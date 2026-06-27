//! Next.js server lifecycle management.
//!
//! In development: assumes Next.js is already running (`npm run dev`).
//! In production: spawns `node server.js` (Next.js standalone output) as a child process.

use std::path::PathBuf;
use std::process::{Child, Command, Stdio};

/// Find the Node.js executable on the system.
/// GUI apps on macOS have a limited PATH, so we search common locations.
fn find_node() -> Option<PathBuf> {
    // 1. Try PATH first (might work if launched from terminal)
    if let Ok(path) = which::which("node") {
        log::info!("[server] Found node on PATH: {}", path.display());
        return Some(path);
    }
    // 2. Search common install locations
    let candidates = [
        "/usr/local/bin/node",
        "/opt/homebrew/bin/node",
        "/opt/homebrew/opt/node/bin/node",
        "/usr/bin/node",
        &format!("{}/.nvm/versions/node/*/bin/node", std::env::var("HOME").unwrap_or_default()),
    ];
    for candidate in &candidates {
        // Expand globs
        if candidate.contains('*') {
            if let Some(parent) = std::path::Path::new(candidate).parent() {
                if parent.exists() {
                    if let Ok(entries) = std::fs::read_dir(parent) {
                        for entry in entries.flatten() {
                            let p = entry.path().join("bin").join("node");
                            if p.exists() {
                                log::info!("[server] Found node: {}", p.display());
                                return Some(p);
                            }
                        }
                    }
                }
            }
        } else {
            let p = std::path::Path::new(candidate);
            if p.exists() {
                log::info!("[server] Found node: {}", p.display());
                return Some(p.to_path_buf());
            }
        }
    }
    log::error!("[server] Node.js not found! Install Node.js (brew install node)");
    None
}

/// Start the Next.js server.
///
/// In dev mode, returns `None` (assumes externally managed).
/// In production, spawns the standalone server and returns the child process handle.
pub fn start_next_server(port: u16, is_packaged: bool, resources_dir: &PathBuf) -> Option<Child> {
    if !is_packaged {
        log::info!("[server] Dev mode — assuming Next.js is running on port {port}");
        return None;
    }

    let node = find_node()?;

    let standalone_dir = resources_dir.join("standalone");
    let server_js = standalone_dir.join("server.js");

    let server_path = if server_js.exists() {
        server_js
    } else {
        let cwd = std::env::current_dir().unwrap_or_default();
        cwd.join(".next").join("standalone").join("server.js")
    };

    log::info!(
        "[server] Starting Next.js (packaged): {} {}",
        node.display(),
        server_path.display()
    );

    match Command::new(&node)
        .arg(&server_path)
        .env("PORT", port.to_string())
        .env("NODE_ENV", "production")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => {
            log::info!("[server] Next.js started (PID {})", child.id());
            Some(child)
        }
        Err(e) => {
            log::error!("[server] Failed to start Next.js: {e}");
            None
        }
    }
}

#[allow(dead_code)]
pub struct ServerGuard {
    child: Option<Child>,
}

impl Drop for ServerGuard {
    fn drop(&mut self) {
        if let Some(ref mut child) = self.child {
            log::info!("[server] Shutting down Next.js (PID {})", child.id());
            let _ = child.kill();
        }
    }
}

impl ServerGuard {
    #[allow(dead_code)]
    pub fn new(child: Option<Child>) -> Self {
        Self { child }
    }
}
