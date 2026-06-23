# 生产环境预览系统技术方案

## 当前架构（仅限本地开发）

```
浏览器 (localhost:3100)
  │
  ├─ Next.js (web-video-studio)  ← 管理界面、API、聊天
  │
  └─ iframe → Vite dev server (localhost:5201)
                 ↑
                 每个项目独立端口 (5200–5799)
                 启动: nohup vite --port 5201 --host localhost
```

**问题**：
- Vite 是开发服务器，不应在生产环境暴露
- 端口段 5200–5799 无法穿透反向代理
- 多项目并发需要动态端口分配，nginx 无法预配置
- `nohup` 进程管理在生产环境不可靠

---

## 方案对比

| 方案 | 实时预览 | 复杂度 | 资源消耗 | 适用阶段 |
|------|---------|--------|---------|---------|
| A. 构建产物静态托管 | ✗ | 低 | 低 | **最终交付** |
| B. 路径代理 + 动态路由 | ✓ | 中 | 中 | **构建阶段预览** |
| C. 容器化隔离预览 | ✓ | 高 | 高 | 多租户 SaaS |
| D. iframe 内 SSR 直出 | ✓ | 中高 | 中 | 轻量预览 |

**推荐组合**：方案 B（构建阶段预览）+ 方案 A（最终交付）

---

## 方案 A：构建产物静态托管（最终交付）

### 流程

```
Phase 2 构建完成
    │
    ▼
npm run build (Vite build)
    │
    ▼
产出 dist/ 静态文件 (index.html + assets/)
    │
    ▼
拷贝到 public/previews/<projectId>/
    │
    ▼
ifame → /previews/<projectId>/index.html
```

### 实现

```typescript
// lib/preview-build.ts
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { projectDir } from "@/lib/projects";

export async function buildPreview(projectId: string): Promise<string> {
  const cwd = path.join(projectDir(projectId), "presentation");
  
  // 1. 执行 Vite build
  execSync("npx vite build --base /previews/" + projectId, { cwd });
  
  // 2. 拷贝产物到 Next.js public 目录
  const distDir = path.join(cwd, "dist");
  const targetDir = path.join(process.cwd(), "public", "previews", projectId);
  fs.cpSync(distDir, targetDir, { recursive: true });
  
  // 3. 返回访问路径
  return `/previews/${projectId}/index.html`;
}
```

### 优点
- 零运行时开销，静态文件直接走 CDN
- 天然支持 HTTPS、缓存、压缩
- 与 Next.js 同域，无跨域问题
- 进程管理简单（不需要守护 Vite）

### 缺点
- 每次修改需要重新 build（~10-30 秒）
- 不适合频繁修改的构建阶段
- 占用磁盘空间（每个项目 ~2-10MB）

### 适用场景
- 项目完成后交付给用户查看
- 分享链接（`https://域名/previews/<id>/`）
- 录屏/截图渲染

---

## 方案 B：路径代理 + 动态路由（构建阶段预览）

### 架构

```
                     nginx / Next.js
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    /preview/<id>/*  /api/*       /studio/*
          │
    proxy_pass → 内部 Vite 实例
    (Unix socket 或 localhost:动态端口)
```

### 流程

```
1. startDevServer(projectId)
   ├─ 分配端口 (5200–5799)
   ├─ 启动 Vite
   └─ 写入 PID 文件

2. 注册代理路由
   └─ /preview/<projectId>/* → proxy_pass http://127.0.0.1:<port>/

3. iframe
   └─ src="/preview/<projectId>/"
```

### 实现

```typescript
// lib/preview-proxy.ts
import http from "http";
import httpProxy from "http-proxy";

const proxyMap = new Map<string, number>(); // projectId → port
const proxy = httpProxy.createProxyServer({});

export function registerPreviewProxy(projectId: string, port: number) {
  proxyMap.set(projectId, port);
}

export function unregisterPreviewProxy(projectId: string) {
  proxyMap.delete(projectId);
}

// Next.js API route: app/api/preview/[projectId]/[...path]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { projectId: string; path: string[] } }
) {
  const port = proxyMap.get(params.projectId);
  if (!port) return new Response("Preview not available", { status: 404 });

  // 将请求代理到内部 Vite 实例
  const targetUrl = `http://127.0.0.1:${port}/${params.path.join("/")}`;
  
  // 注意：Next.js API route 不适合做流式代理
  // 更好的方案是用 nginx 动态 upstream 或 Node.js http-proxy 中间件
}
```

### Nginx 方案（推荐）

```nginx
# /etc/nginx/sites-available/webvideostudio

server {
    listen 443 ssl http2;
    server_name studio.example.com;

    # 主应用
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 预览代理 —— 每个项目一个 location
    # 由部署脚本动态生成 include 文件
    include /etc/nginx/preview-locations/*.conf;
}
```

```bash
# scripts/register-preview.sh
# 当项目进入构建阶段时调用
PROJECT_ID=$1
PORT=$2

cat > "/etc/nginx/preview-locations/${PROJECT_ID}.conf" << EOF
location /preview/${PROJECT_ID}/ {
    proxy_pass http://127.0.0.1:${PORT}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    # Vite HMR WebSocket
    proxy_set_header Origin http://127.0.0.1:${PORT};
}
EOF

nginx -s reload
```

```bash
# scripts/unregister-preview.sh
# 项目停止或删除时调用
PROJECT_ID=$1
rm -f "/etc/nginx/preview-locations/${PROJECT_ID}.conf"
nginx -s reload
```

### iframe 改造

```tsx
// components/preview-window.tsx
// 生产环境走同域代理路径，开发环境走 localhost 直连

const previewUrl = process.env.NODE_ENV === "production"
  ? `/preview/${projectId}/`
  : `//${window.location.hostname}:${devPort}?pid=${projectId}`;

<iframe src={previewUrl} ... />
```

### 进程管理（替代 nohup）

```typescript
// lib/dev-servers.ts 生产环境改用 systemd 或 pm2

// 方案 1: systemd (推荐)
// 为每个项目创建 transient unit
function startViteWithSystemd(projectId: string, port: number) {
  execSync(
    `systemd-run --user --unit=wvs-preview-${projectId} \
     --setenv=PORT=${port} \
     npx vite --port ${port} --host 127.0.0.1`,
    { cwd: path.join(projectDir(projectId), "presentation") }
  );
}

// 方案 2: pm2
function startViteWithPM2(projectId: string, port: number) {
  execSync(
    `pm2 start npx --name "wvs-${projectId}" \
     -- vite --port ${port} --host 127.0.0.1`,
    { cwd: path.join(projectDir(projectId), "presentation") }
  );
}
```

---

## 方案 C：容器化隔离预览（多租户 SaaS）

```
用户 A 项目 1  ──→ container (port 5201)
用户 A 项目 2  ──→ container (port 5202)
用户 B 项目 1  ──→ container (port 5203)
                     │
            nginx 动态 upstream
            (Lua / OpenResty 动态路由)
```

### 适用场景
- 多用户 SaaS 平台
- 需要严格资源隔离
- 需要限制预览并发数

### 实现要点
- 用 Docker/Podman 启动临时容器，分配随机端口
- nginx + Lua 脚本动态注册 upstream
- 项目空闲 N 分钟后自动销毁容器
- 限制每用户同时预览项目数

这个方案复杂度较高，当前阶段不建议实施。

---

## 方案 D：iframe 内 SSR 直出（轻量预览）

### 思路
不启动外部 Vite 进程，而是把 presentation 代码**内嵌**到 Next.js 页面中渲染。

```tsx
// app/projects/[id]/preview/page.tsx
import { renderPreview } from "@/lib/preview-render";

export default async function PreviewPage({ params }) {
  const { id } = await params;
  const html = await renderPreview(id);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### 优点
- 不需要额外进程
- 天然同域，无跨域
- 可以利用 Next.js 的 SSR/ISR

### 缺点
- React 组件不能直接渲染到 iframe（需要独立 DOM 环境）
- Vite HMR 不可用
- 每次修改需要重新 SSR

---

## 推荐实施路径

### Phase 1：构建阶段预览（方案 B 精简版）

```
目标：构建过程中实时看到预览，不需要 nginx 动态配置
```

1. **保持 Vite dev server 模式**，改用 pm2 管理进程
2. **Next.js 内置代理**：用 `next.config.ts` 的 `rewrites` 动态注册
3. **iframe 改造**：生产走 `/preview/<projectId>/`，开发走 `localhost:<port>`

```typescript
// next.config.ts — 动态 rewrites（需要自定义 server）
// 更好的方案：用 middleware 做代理

// middleware.ts 增加预览代理
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // /preview/<projectId>/* → 代理到 Vite
  const previewMatch = pathname.match(/^\/preview\/([^/]+)(\/.*)?$/);
  if (previewMatch) {
    const projectId = previewMatch[1];
    const port = getDevServerPort(projectId); // 从 PID 文件或内存 map 读取
    if (port) {
      const targetUrl = `http://127.0.0.1:${port}${previewMatch[2] || "/"}`;
      return NextResponse.rewrite(targetUrl);
    }
    return new NextResponse("Preview not available", { status: 404 });
  }
  // ... 其余中间件逻辑
}
```

> ⚠️ `NextResponse.rewrite` 不能跨域代理。需要用自定义 server 或 nginx。
> 轻量替代：用 `http-proxy` 在自定义 `server.ts` 中处理。

### Phase 2：最终交付（方案 A）

```
目标：项目完成后生成静态文件，支持分享链接
```

1. 构建完成后触发 `npm run build`
2. 产物拷贝到 `public/previews/<id>/`
3. 通过 `/previews/<id>/` 直接访问
4. 支持 CDN 缓存、设置 `Cache-Control: public, max-age=3600`

### Phase 3：SaaS 多租户（方案 C，远期）

```
目标：平台化运营，多用户并发
```

1. 容器化预览实例
2. 动态 nginx upstream
3. 自动扩缩容
4. 预览会话超时管理

---

## 安全考虑

| 关注点 | 措施 |
|--------|------|
| 预览访问鉴权 | `/preview/<id>/` 路由继承 middleware auth 检查 |
| 端口暴露 | Vite 只监听 `127.0.0.1`，不暴露到公网 |
| 跨域隔离 | 生产走同域代理，不存在跨域问题 |
| XSS 防护 | 用户提供的 HTML/CSS/JS 在 iframe sandbox 中运行 |
| 资源限制 | pm2/systemd 限制每进程内存/CPU，防止单个项目拖垮服务器 |

---

## 关键代码改动清单

```
改动文件                      改动内容
──────────────────────────────────────────────────────────
components/preview-window.tsx   iframe src 根据环境动态切换
lib/preview-proxy.ts            [新增] 预览代理注册/注销
lib/dev-servers.ts              进程管理改用 pm2/systemd
middleware.ts                   增加 /preview/:id/* 代理路由
next.config.ts                  [可选] 自定义 server
scripts/register-preview.sh     [新增] nginx location 注册
scripts/unregister-preview.sh   [新增] nginx location 注销
.env.production                 增加预览相关环境变量
```

---

## 环境变量

```bash
# .env.production
PREVIEW_MODE=proxy           # proxy | static | container
PREVIEW_HOST=127.0.0.1       # Vite 绑定地址
PREVIEW_PORT_RANGE=5200-5299 # 端口范围
PREVIEW_IDLE_TIMEOUT=1800    # 空闲超时（秒），超时后停止 Vite
PREVIEW_MAX_PER_USER=3       # 每用户最大并发预览数
```
