//! WebVideo Studio — Tauri desktop application.
//!
//! Native desktop shell providing:
//!   - macOS-native window (hiddenInset titlebar, state persistence)
//!   - Next.js server lifecycle (production spawn / dev passthrough)
//!   - Settings → env var injection
//!   - Skills root resolution
//!   - IPC bridge (app version, paths, directory picker)

mod server;

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Listener;
use tauri::Manager;

// ── App state ──────────────────────────────────────────────────────────────

#[allow(dead_code)]
struct AppState {
    /// The Next.js server child process (None in dev mode).
    server_child: Mutex<Option<std::process::Child>>,
    /// Port the Next.js server listens on.
    server_port: u16,
    /// Whether the app is running in packaged mode.
    is_packaged: bool,
    /// Path to the application data directory.
    app_data: PathBuf,
}

// ── Window state persistence ───────────────────────────────────────────────

const WINDOW_STATE_FILE: &str = "window-state.json";

#[derive(Serialize, Deserialize, Clone)]
struct WindowState {
    x: Option<f64>,
    y: Option<f64>,
    width: f64,
    height: f64,
    is_maximized: bool,
}

impl Default for WindowState {
    fn default() -> Self {
        Self { x: None, y: None, width: 1400.0, height: 900.0, is_maximized: false }
    }
}

fn load_window_state(app_data: &PathBuf) -> WindowState {
    let path = app_data.join(WINDOW_STATE_FILE);
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_window_state(app_data: &PathBuf, state: &WindowState) {
    if let Ok(json) = serde_json::to_string_pretty(state) {
        let path = app_data.join(WINDOW_STATE_FILE);
        let _ = fs::create_dir_all(path.parent().unwrap());
        let _ = fs::write(&path, json);
    }
}

// ── Settings loader ────────────────────────────────────────────────────────

fn load_settings_into_env(app_data: &PathBuf) {
    let settings_path = app_data.join("data").join("settings.json");
    let raw = match fs::read_to_string(&settings_path) {
        Ok(s) => s,
        Err(_) => {
            log::info!("[settings] No settings file found — using env vars only");
            return;
        }
    };
    let settings: serde_json::Value = match serde_json::from_str(&raw) {
        Ok(v) => v,
        Err(e) => {
            log::warn!("[settings] Failed to parse: {e}");
            return;
        }
    };

    let api_keys = settings.get("apiKeys").and_then(|v| v.as_object());
    let endpoints = settings.get("endpoints").and_then(|v| v.as_object());
    let preferences = settings.get("preferences").and_then(|v| v.as_object());

    for (setting_key, env_key) in [
        ("anthropic", "ANTHROPIC_API_KEY"), ("heygen", "HEYGEN_API_KEY"),
        ("fal", "FAL_KEY"), ("dashscope", "DASHSCOPE_API_KEY"),
        ("deepseek", "DEEPSEEK_API_KEY"), ("gptImage", "GPT_IMAGE_KEY"),
        ("stripe", "STRIPE_SECRET_KEY"),
    ] {
        if let Some(val) = api_keys.and_then(|m| m.get(setting_key)).and_then(|v| v.as_str()) {
            std::env::set_var(env_key, val);
        }
    }
    for (setting_key, env_key) in [
        ("anthropicBaseUrl", "ANTHROPIC_BASE_URL"),
        ("buildAnthropicBaseUrl", "BUILD_ANTHROPIC_BASE_URL"),
        ("gptImageBaseUrl", "GPT_IMAGE_BASE_URL"),
    ] {
        if let Some(val) = endpoints.and_then(|m| m.get(setting_key)).and_then(|v| v.as_str()) {
            std::env::set_var(env_key, val);
        }
    }
    if let Some(val) = preferences.and_then(|m| m.get("mainSkillId")).and_then(|v| v.as_str()) {
        std::env::set_var("MAIN_SKILL_ID", val);
    }
    if let Some(val) = preferences.and_then(|m| m.get("skillsRoot")).and_then(|v| v.as_str()) {
        std::env::set_var("SKILLS_ROOT", val);
    }
    log::info!("[settings] Loaded from {}", settings_path.display());
}

// ── Skills root ────────────────────────────────────────────────────────────

fn resolve_skills_root(is_packaged: bool, resources_dir: &PathBuf) -> PathBuf {
    if let Ok(val) = std::env::var("SKILLS_ROOT") {
        let p = PathBuf::from(val.trim());
        if p.exists() { return p; }
    }
    if is_packaged {
        resources_dir.join("skills")
    } else {
        let cwd = std::env::current_dir().unwrap_or_default();
        let candidate = cwd.parent().map(|p| p.join("skills")).unwrap_or_default();
        if candidate.exists() { candidate } else { cwd.join("..").join("skills") }
    }
}

// ── Server readiness (blocking) ────────────────────────────────────────────

fn wait_for_server_blocking(port: u16, timeout_secs: u64) -> Result<(), String> {
    let url = format!("http://localhost:{port}/login");
    let start = std::time::Instant::now();
    let timeout = std::time::Duration::from_secs(timeout_secs);
    loop {
        if start.elapsed() > timeout {
            return Err(format!("Server did not start within {timeout_secs}s"));
        }
        match ureq::get(&url).call() {
            Ok(_) => { log::info!("[server] Ready on port {port}"); return Ok(()); }
            Err(_) => { std::thread::sleep(std::time::Duration::from_millis(500)); }
        }
    }
}

// ── IPC commands ───────────────────────────────────────────────────────────

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
async fn select_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app.dialog().file().blocking_pick_folder();
    Ok(path.map(|p| p.to_string()))
}

#[tauri::command]
fn get_app_paths(state: tauri::State<AppState>) -> serde_json::Value {
    serde_json::json!({
        "appData": state.app_data.to_string_lossy(),
        "skillsRoot": std::env::var("SKILLS_ROOT").unwrap_or_default(),
        "isPackaged": state.is_packaged,
    })
}

// ── App entry ──────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None::<Vec<&str>>,
        ))
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_localhost::Builder::new(3100).build())
        .setup(|app| {
            let is_packaged = std::env::var("TAURI_DEV").is_err();
            let app_data = dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("webvideo-studio");
            let _ = fs::create_dir_all(&app_data);
            std::env::set_var("WEBVIDEO_APP_DATA", app_data.to_string_lossy().as_ref());

            let resources_dir = if is_packaged {
                app.path().resource_dir().unwrap_or_else(|_| PathBuf::from("."))
            } else {
                std::env::current_dir().unwrap_or_default()
            };

            // Load settings before starting server
            load_settings_into_env(&app_data);

            // Resolve skills root
            let skills_root = resolve_skills_root(is_packaged, &resources_dir);
            std::env::set_var("SKILLS_ROOT", skills_root.to_string_lossy().as_ref());
            log::info!("[app] Skills root: {}", skills_root.display());

            let port: u16 = std::env::var("PORT")
                .unwrap_or_else(|_| "3100".into())
                .parse()
                .unwrap_or(3100);

            // Start Next.js server (no-op in dev mode)
            let server_child = server::start_next_server(port, is_packaged, &resources_dir);

            // Wait for server readiness
            if let Err(e) = wait_for_server_blocking(port, 30) {
                log::error!("[app] Server startup failed: {e}");
                // Continue anyway — window will show connection error
            }

            // ── Create main window ──────────────────────────────────────────
            let window_state = load_window_state(&app_data);
            let url = format!("http://localhost:{port}");

            let builder = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::External(url.parse().unwrap()),
            )
            .title("WebVideo Studio")
            .min_inner_size(960.0, 640.0)
            .inner_size(window_state.width, window_state.height);

            #[cfg(target_os = "macos")]
            let builder = builder
                .hidden_title(true)
                .title_bar_style(tauri::TitleBarStyle::Overlay);

            let window = builder.build()?;

            if let (Some(x), Some(y)) = (window_state.x, window_state.y) {
                let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
            }
            if window_state.is_maximized {
                let _ = window.maximize();
            }

            // Persist window state on changes
            let app_data_clone = app_data.clone();
            let w1 = window.clone();
            window.on_window_event(move |event| {
                use tauri::WindowEvent;
                if matches!(event,
                    WindowEvent::Resized(_) | WindowEvent::Moved(_) | WindowEvent::CloseRequested { .. }
                ) {
                    if let (Ok(size), Ok(pos)) = (w1.inner_size(), w1.outer_position()) {
                        save_window_state(&app_data_clone, &WindowState {
                            x: Some(pos.x as f64),
                            y: Some(pos.y as f64),
                            width: size.width.into(),
                            height: size.height.into(),
                            is_maximized: w1.is_maximized().unwrap_or(false),
                        });
                    }
                }
            });

            // Listen for external-link events from the renderer (Next.js).
            let w2 = window.clone();
            w2.listen("navigate-external", |event| {
                let url = event.payload();
                let _ = open::that(url.to_string());
            });

            log::info!("[app] Window created on port {port}");

            // Store state for IPC access
            app.manage(AppState {
                server_child: Mutex::new(server_child),
                server_port: port,
                is_packaged,
                app_data,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            select_directory,
            get_app_paths,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
