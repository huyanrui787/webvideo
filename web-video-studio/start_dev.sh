#!/bin/bash
# WebVideo Studio — 开发模式启动
# 启动 Next.js 服务器 + Tauri 开发窗口

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎬 WebVideo Studio 开发模式${NC}"
echo ""

# ── 清理旧进程 ────────────────────────────────────────────────────────────

cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止服务...${NC}"
    kill $NEXT_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

kill_existing() {
    echo -e "${YELLOW}检查并停止之前的开发服务...${NC}"
    lsof -ti:3100 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}已清理${NC}"
}
kill_existing

# ── 启动 Next.js 开发服务器 ────────────────────────────────────────────────

echo -e "${BLUE}启动 Next.js 开发服务器...${NC}"
npm run dev &
NEXT_PID=$!
echo -e "Next.js PID: ${NEXT_PID}"
echo ""

# 等待服务器就绪
echo -n "等待服务器启动"
for i in $(seq 1 30); do
    if curl -s http://localhost:3100/login >/dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓ Next.js 已启动: http://localhost:3100${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  开发环境已就绪!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Web 前端: ${BLUE}http://localhost:3100${NC}"
echo ""
echo -e "启动 Tauri 桌面窗口: ${BLUE}npm run tauri:dev${NC}"
echo -e "按 ${YELLOW}Ctrl+C${NC} 停止 Next.js 服务器"
echo ""

wait
