// ═══════════════════════════════════════════════════════════════════════════════
// Product Explorer — Playwright-based web crawler for product demo videos
// ═══════════════════════════════════════════════════════════════════════════════

import path from "path";
import fs from "fs";
import { projectDir, writeProjectFile } from "@/lib/projects";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PageElement {
  tag: string;
  type: "button" | "input" | "link" | "form" | "dropdown" | "other";
  label: string;
  selector: string;
  visible: boolean;
}

export interface ExploredPage {
  path: string;
  title: string;
  url: string;
  textContent: string;
  screenshotFile: string;
  elements: PageElement[];
  aiDescription?: string;    // Vision model analysis of the screenshot
}

export interface InteractionResult {
  pagePath: string;
  action: string;           // "clicked 'Sign Up' button"
  beforeScreenshot: string;
  afterScreenshot: string;
  success: boolean;
  note: string;
}

export interface ExplorationResult {
  baseUrl: string;
  title: string;
  pages: ExploredPage[];
  interactions: InteractionResult[];
  exploredAt: number;
}

export interface ExplorationJob {
  status: "running" | "done" | "error";
  progress: string;
  pagesFound: number;
  pagesExplored: number;
  screenshotsTaken: number;
  error?: string;
  result?: ExplorationResult;
  thumbnails: string[];       // relative URLs to completed screenshots (real-time preview)
}

const jobs = new Map<string, ExplorationJob>();

function jobFilePath(projectId: string): string {
  return path.join(projectDir(projectId), ".explore-job.json");
}

function persistJob(projectId: string, job: ExplorationJob) {
  try {
    fs.writeFileSync(jobFilePath(projectId), JSON.stringify(job));
  } catch { /* ignore */ }
}

function readPersistedJob(projectId: string): ExplorationJob | null {
  try {
    const p = jobFilePath(projectId);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { return null; }
}

export function getExplorationJob(projectId: string): ExplorationJob | null {
  // In-memory takes priority
  const mem = jobs.get(projectId);
  if (mem) return mem;
  // Fall back to persisted file (survives restarts)
  return readPersistedJob(projectId);
}

// ─── URL helpers ───────────────────────────────────────────────────────────────

function sameDomain(urlA: string, urlB: string): boolean {
  try {
    return new URL(urlA).hostname === new URL(urlB).hostname;
  } catch {
    return false;
  }
}

function urlToSlug(url: string): string {
  try {
    const u = new URL(url);
    const slug = (u.pathname === "/" ? "home" : u.pathname.replace(/\//g, "-").replace(/^-|-$/g, ""))
      .replace(/[^a-zA-Z0-9一-鿿-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
    return slug || "page";
  } catch {
    return "page";
  }
}

// ─── AI Vision Annotation ──────────────────────────────────────────────────────

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const ANTHROPIC_BASE = process.env.ANTHROPIC_BASE_URL ?? "https://qqqapi.com";

async function annotateScreenshot(
  imagePath: string,
  pageTitle: string,
  textContent: string,
): Promise<string> {
  if (!ANTHROPIC_KEY) return "";
  try {
    const imgBuf = fs.readFileSync(imagePath);
    const base64 = imgBuf.toString("base64");
    const res = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: base64 },
            },
            {
              type: "text",
              text: `这是一张产品网站页面的截图，页面标题为「${pageTitle}」。请用一段中文简要描述这个页面展示的内容：页面类型（首页/功能页/定价页等）、主要UI元素、核心信息。不超过80字。页面文字：${textContent.slice(0, 500)}`,
            },
          ],
        }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json() as any;
    return data.content?.[0]?.text?.trim() ?? "";
  } catch {
    return "";
  }
}

// ─── Form Auto-Fill ────────────────────────────────────────────────────────────

const FORM_FILL_DATA: Record<string, string> = {
  email: "demo@example.com",
  name: "张三",
  username: "demo_user",
  password: "TestPass123!",
  phone: "13800138000",
  search: "示例搜索关键词",
  message: "这是一条测试留言，用于演示产品功能。",
  comment: "产品看起来很专业，功能齐全。",
  address: "北京市朝阳区建国路88号",
  company: "示例科技有限公司",
  title: "产品经理",
};

async function autoFillForms(page: any): Promise<number> {
  let filled = 0;
  try {
    // Fill email inputs
    const emailInputs = await page.$$('input[type="email"], input[name*="email"], input[placeholder*="邮箱"], input[placeholder*="email" i]');
    for (const input of emailInputs) {
      try {
        await input.fill(FORM_FILL_DATA.email);
        filled++;
      } catch { /* skip */ }
    }

    // Fill name inputs
    const nameInputs = await page.$$('input[name*="name"], input[placeholder*="姓名"], input[placeholder*="名字"], input[name*="username"]');
    for (const input of nameInputs) {
      try {
        const name = await input.getAttribute("name") ?? "";
        await input.fill(FORM_FILL_DATA[name.includes("user") ? "username" : "name"]);
        filled++;
      } catch { /* skip */ }
    }

    // Fill password
    const pwdInputs = await page.$$('input[type="password"]');
    for (const input of pwdInputs) {
      try { await input.fill(FORM_FILL_DATA.password); filled++; } catch { /* skip */ }
    }

    // Fill textareas
    const textareas = await page.$$("textarea");
    for (const ta of textareas) {
      try { await ta.fill(FORM_FILL_DATA.message); filled++; } catch { /* skip */ }
    }

    // Fill remaining text inputs with contextual data
    const textInputs = await page.$$('input[type="text"]:not([name*="name"]):not([name*="email"])');
    for (const input of textInputs) {
      try {
        const ph = ((await input.getAttribute("placeholder")) ?? "").toLowerCase();
        const nm = ((await input.getAttribute("name")) ?? "").toLowerCase();
        let val = FORM_FILL_DATA.search;
        for (const [key, v] of Object.entries(FORM_FILL_DATA)) {
          if (ph.includes(key) || nm.includes(key)) { val = v; break; }
        }
        await input.fill(val);
        filled++;
      } catch { /* skip */ }
    }
  } catch { /* ignore */ }
  return filled;
}

// ─── Main Explorer ─────────────────────────────────────────────────────────────

export interface ProductCredentials {
  loginUrl?: string;     // login page URL (auto-detected if empty)
  username: string;
  password: string;
  usernameSelector?: string;  // CSS selector for username field
  passwordSelector?: string;  // CSS selector for password field
  submitSelector?: string;    // CSS selector for submit button
}

export async function startProductExploration(
  projectId: string,
  url: string,
  credentials?: ProductCredentials,
): Promise<void> {
  if (jobs.get(projectId)?.status === "running") return;

  const job: ExplorationJob = {
    status: "running",
    progress: "启动浏览器…",
    pagesFound: 0,
    pagesExplored: 0,
    screenshotsTaken: 0,
    thumbnails: [],
  };
  jobs.set(projectId, job);
  persistJob(projectId, job);

  const assetsDir = path.join(projectDir(projectId), "assets");
  fs.mkdirSync(assetsDir, { recursive: true });

  (async () => {
    let browser: any = null;
    try {
      // Dynamic import to avoid cold-start penalty
      const { chromium } = await import("playwright");
      browser = await chromium.launch({ headless: true });

      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      });

      const page = await context.newPage();

      // ── Step 0: Login if credentials provided ──────────────────────────────────
      if (credentials?.username && credentials?.password) {
        const loginUrl = credentials.loginUrl || url;
        job.progress = "正在登录…";
        try {
          await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 30000 });
          await page.waitForTimeout(1500);

          // Try common login selectors + user-provided ones
          const userSelectors = [
            credentials.usernameSelector,
            'input[type="email"]', 'input[name="email"]', 'input[name="username"]',
            'input[placeholder*="邮箱" i]', 'input[placeholder*="email" i]',
            'input[placeholder*="用户名" i]', 'input[placeholder*="账号" i]',
            'input[name="user"]', 'input[name="login"]',
          ].filter(Boolean) as string[];

          const pwdSelectors = [
            credentials.passwordSelector,
            'input[type="password"]',
          ].filter(Boolean) as string[];

          const submitSelectors = [
            credentials.submitSelector,
            'button[type="submit"]', 'input[type="submit"]',
            'button:has-text("登录")', 'button:has-text("Log in")',
            'button:has-text("Sign in")', 'button:has-text("登 录")',
            '[role="button"]:has-text("登录")',
          ].filter(Boolean) as string[];

          // Fill username
          let filled = false;
          for (const sel of userSelectors) {
            try {
              const el = await page.$(sel);
              if (el) {
                await el.fill(credentials.username);
                filled = true;
                break;
              }
            } catch { /* try next */ }
          }

          // Fill password
          for (const sel of pwdSelectors) {
            try {
              const el = await page.$(sel);
              if (el) {
                await el.fill(credentials.password);
                break;
              }
            } catch { /* try next */ }
          }

          if (filled) {
            // Screenshot before login
            await page.screenshot({
              path: path.join(assetsDir, "screenshot-login-filled.png"),
              fullPage: false,
            });
            job.screenshotsTaken++;
            job.thumbnails.push("screenshot-login-filled.png");

            // Click submit
            for (const sel of submitSelectors) {
              try {
                const el = await page.$(sel);
                if (el) {
                  await el.click();
                  await page.waitForTimeout(3000); // Wait for redirect
                  break;
                }
              } catch { /* try next */ }
            }

            // Wait for navigation to complete
            await page.waitForLoadState("networkidle").catch(() => {});
            await page.waitForTimeout(1000);

            // Screenshot after login
            await page.screenshot({
              path: path.join(assetsDir, "screenshot-logged-in.png"),
              fullPage: false,
            });
            job.screenshotsTaken++;
            job.thumbnails.push("screenshot-logged-in.png");
          }
        } catch (err: any) {
          console.warn("[product-explorer] login attempt failed:", err.message);
          // Continue anyway — maybe already logged in, or public pages are enough
        }
      }

      // ── Step 1: Load main page ─────────────────────────────────────────────────
      job.progress = "加载首页…";
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {
        page.goto(url, { waitUntil: "load", timeout: 30000 });
      });
      await page.waitForTimeout(1000); // Let animations settle

      const pageTitle = await page.title();
      const pages: ExploredPage[] = [];
      const interactions: InteractionResult[] = [];

      // ── Step 2: Discover all same-domain links ──────────────────────────────────
      job.progress = "发现页面链接…";
      const links = await page.evaluate(() => {
        const anchors = document.querySelectorAll("a[href]");
        const hrefs: string[] = [];
        anchors.forEach((a) => {
          const h = a.getAttribute("href");
          if (h && !h.startsWith("#") && !h.startsWith("javascript:") && !h.startsWith("mailto:") && !h.startsWith("tel:")) {
            hrefs.push(h);
          }
        });
        return hrefs;
      });

      // Resolve relative URLs, keep same-domain, deduplicate, limit
      const baseUrl = new URL(url);
      const uniquePaths = new Map<string, string>();
      for (const href of links) {
        try {
          const resolved = new URL(href, url);
          if (sameDomain(resolved.href, url)) {
            const p = resolved.pathname + resolved.search;
            if (!uniquePaths.has(p)) uniquePaths.set(p, resolved.href);
          }
        } catch { /* skip invalid */ }
      }

      // Ensure homepage is first
      const allUrls = [url];
      for (const [p, full] of uniquePaths) {
        if (full !== url) allUrls.push(full);
      }
      const toExplore = allUrls.slice(0, 20); // Max 20 pages
      job.pagesFound = toExplore.length;

      // ── Step 3: Explore each page ──────────────────────────────────────────────
      for (let i = 0; i < toExplore.length; i++) {
        const pageUrl = toExplore[i];
        job.progress = `浏览页面 ${i + 1}/${toExplore.length}: ${new URL(pageUrl).pathname || "/"}`;
        job.pagesExplored = i;

        try {
          await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {
            page.goto(pageUrl, { waitUntil: "load", timeout: 20000 });
          });
          await page.waitForTimeout(800);

          // Screenshot
          const slug = urlToSlug(pageUrl);
          const screenshotFile = `screenshot-page-${String(i + 1).padStart(2, "0")}-${slug}.png`;
          const screenshotPath = path.join(assetsDir, screenshotFile);
          await page.screenshot({ path: screenshotPath, fullPage: false });
          job.screenshotsTaken++;
          // Push thumbnail for real-time frontend preview
          job.thumbnails.push(screenshotFile);
          if (i % 3 === 0) persistJob(projectId, job);

          // Extract text content (for annotation)
          const textContent = await page.evaluate(() => {
            // Get text from main content areas, skip nav/footer
            const main = document.querySelector("main, article, .content, #content, .main")
              || document.body;
            return (main as HTMLElement).innerText.slice(0, 5000);
          });

          // Find interactive elements
          const elements = await page.evaluate(() => {
            const el: PageElement[] = [];
            const seen = new Set<string>();
            const interactives = document.querySelectorAll(
              'button:not([type="hidden"]), input:not([type="hidden"]), select, a[role="button"], [onclick], form'
            );
            interactives.forEach((e) => {
              const htmlEl = e as HTMLElement;
              if (!htmlEl.offsetParent) return; // Not visible
              const label = htmlEl.getAttribute("aria-label")
                || htmlEl.textContent?.trim().slice(0, 40)
                || htmlEl.getAttribute("placeholder")
                || htmlEl.getAttribute("name")
                || htmlEl.tagName;
              if (seen.has(label)) return;
              seen.add(label);
              let type: PageElement["type"] = "other";
              if (htmlEl.tagName === "BUTTON" || htmlEl.getAttribute("role") === "button") type = "button";
              else if (htmlEl.tagName === "INPUT") type = "input";
              else if (htmlEl.tagName === "A") type = "link";
              else if (htmlEl.tagName === "FORM") type = "form";
              else if (htmlEl.tagName === "SELECT") type = "dropdown";

              el.push({
                tag: htmlEl.tagName,
                type,
                label: label || htmlEl.tagName,
                selector: `${htmlEl.tagName}${htmlEl.id ? "#" + htmlEl.id : ""}${[...htmlEl.classList].map((c) => "." + c).join("")}`.slice(0, 80),
                visible: true,
              });
            });
            return el.slice(0, 10); // Top 10 visible elements
          });

          const title = await page.title();
          const pageEntry: ExploredPage = {
            path: new URL(pageUrl).pathname || "/",
            title: title || `Page ${i + 1}`,
            url: pageUrl,
            textContent,
            screenshotFile,
            elements,
          };

          // AI vision annotation (fire-and-forget, updates entry afterwards)
          annotateScreenshot(screenshotPath, title, textContent).then((desc) => {
            if (desc) pageEntry.aiDescription = desc;
          });

          pages.push(pageEntry);
        } catch (err: any) {
          console.error(`[product-explorer] failed to explore ${pageUrl}:`, err.message);
          // Continue to next page
        }
      }

      job.pagesExplored = pages.length;

      // ── Step 4: Auto-fill forms + Interaction sampling ─────────────────────────
      if (pages.length > 0) {
        const targetPage = pages[0]; // Focus on homepage interactions
        try {
          await page.goto(targetPage.url, { waitUntil: "networkidle", timeout: 20000 });
          await page.waitForTimeout(800);

          // Auto-fill any detected form fields with realistic test data
          const filledCount = await autoFillForms(page);
          if (filledCount > 0) {
            job.progress = `自动填写了 ${filledCount} 个表单字段`;
            const formScreenshot = path.join(assetsDir, "screenshot-form-filled.png");
            await page.screenshot({ path: formScreenshot, fullPage: false });
            job.screenshotsTaken++;
            job.thumbnails.push("screenshot-form-filled.png");
          }

          for (const el of targetPage.elements.slice(0, 3)) {
            job.progress = `尝试交互: ${el.label}…`;
            try {
              const beforeFile = `screenshots/interaction-before-${el.label.replace(/[^a-zA-Z0-9一-鿿]/g, "-").slice(0, 30)}.png`;
              await page.screenshot({ path: path.join(assetsDir, beforeFile), fullPage: false });

              // Attempt click
              try {
                const clicked = await page.evaluate((sel: string) => {
                  const e = document.querySelector(sel) as HTMLElement;
                  if (e) { e.click(); return true; }
                  return false;
                }, el.selector);
                if (clicked) await page.waitForTimeout(1500);
              } catch { /* can't click */ }

              const afterFile = `screenshots/interaction-after-${el.label.replace(/[^a-zA-Z0-9一-鿿]/g, "-").slice(0, 30)}.png`;
              await page.screenshot({ path: path.join(assetsDir, afterFile), fullPage: false });

              interactions.push({
                pagePath: targetPage.path,
                action: `点击了「${el.label}」`,
                beforeScreenshot: beforeFile,
                afterScreenshot: afterFile,
                success: true,
                note: "",
              });
              job.screenshotsTaken += 2;

              // Go back
              await page.goBack().catch(() => page.goto(targetPage.url));
              await page.waitForTimeout(500);
            } catch { /* skip this interaction */ }
          }
        } catch { /* skip interactions if page fails */ }
      }

      // ── Step 5: Build result ────────────────────────────────────────────────────
      const result: ExplorationResult = {
        baseUrl: url,
        title: pageTitle,
        pages,
        interactions,
        exploredAt: Date.now(),
      };

      // Save to project file
      writeProjectFile(projectId, "product-exploration.json", JSON.stringify(result, null, 2));

      job.status = "done";
      job.progress = `探索完成：${pages.length} 个页面，${job.screenshotsTaken} 张截图`;
      job.result = result;
      persistJob(projectId, job);

      await browser.close();
    } catch (err: any) {
      console.error("[product-explorer] exploration failed:", err.message);
      job.status = "error";
      job.error = err.message;
      persistJob(projectId, job);
      try { if (browser) await browser.close(); } catch { /* ignore */ }
    }
  })();
}
