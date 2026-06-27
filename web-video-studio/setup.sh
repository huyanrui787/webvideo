#!/bin/bash
# WebVideo Studio — 开发环境初始化
# 首次 clone 仓库后运行此脚本

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🎬 WebVideo Studio 开发环境初始化${NC}"
echo ""

# ── 检查依赖 ──────────────────────────────────────────────────────────────

check_cmd() {
    local name=$1 cmd=$2 hint=$3
    echo -n "  检查 ${name}... "
    if command -v "$cmd" &>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        echo -e "    ${YELLOW}请安装: ${hint}${NC}"
        return 1
    fi
}

echo -e "${BLUE}[1/4] 检查依赖${NC}"
MISSING=0

check_cmd "Node.js" node "https://nodejs.org (≥ v20)" || MISSING=1
check_cmd "npm" npm "随 Node.js 安装" || MISSING=1
check_cmd "Rust" rustc "https://rustup.rs" || MISSING=1
check_cmd "Cargo" cargo "随 Rust 安装" || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}请先安装上述缺失的依赖，然后重新运行此脚本${NC}"
    exit 1
fi
echo ""

# ── 安装 npm 依赖 ──────────────────────────────────────────────────────────

echo -e "${BLUE}[2/4] 安装 npm 依赖${NC}"
npm install
echo -e "${GREEN}✓ npm 依赖安装完成${NC}"
echo ""

# ── 检查 Rust 依赖 ─────────────────────────────────────────────────────────

echo -e "${BLUE}[3/4] 检查 Rust 依赖${NC}"
cd src-tauri
cargo check --quiet 2>/dev/null || cargo fetch
cd ..
echo -e "${GREEN}✓ Rust 依赖准备完成${NC}"
echo ""

# ── 准备 Skills ────────────────────────────────────────────────────────────

echo -e "${BLUE}[4/4] 检查 Skills 目录${NC}"
SKILLS_DIR="${PROJECT_DIR}/../skills"
if [ -d "$SKILLS_DIR" ]; then
    echo -e "${GREEN}✓ Skills 目录已就绪: ${SKILLS_DIR}${NC}"
else
    echo -e "${YELLOW}⚠ Skills 目录未找到。设置 SKILLS_ROOT 环境变量或克隆 skills 仓库${NC}"
fi
echo ""

# ── 完成 ───────────────────────────────────────────────────────────────────

echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  开发环境准备就绪!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "  启动命令:"
echo ""
echo "    开发模式:         ./start_dev.sh"
echo "    Tauri 桌面开发:   npm run tauri:dev"
echo "    构建 macOS 包:    ./build_macos.sh"
echo ""
