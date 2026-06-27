#!/bin/bash
# WebVideo Studio — macOS 正式发布构建
# 构建签名 + 公证的 DMG 安装包

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION=$(grep '"version"' "${PROJECT_DIR}/package.json" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}🎬 WebVideo Studio macOS 构建${NC}             ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  ${BLUE}Version: ${VERSION}${NC}                              ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# ── 同步版本号 ────────────────────────────────────────────────────────────

PKG_VERSION=$(grep '"version"' "${PROJECT_DIR}/package.json" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
TAURI_VERSION=$(grep '"version"' "${PROJECT_DIR}/src-tauri/tauri.conf.json" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
CARGO_VERSION=$(grep '^version = ' "${PROJECT_DIR}/src-tauri/Cargo.toml" | head -1 | sed 's/version = "\([^"]*\)".*/\1/')

if [ "$PKG_VERSION" != "$TAURI_VERSION" ] || [ "$PKG_VERSION" != "$CARGO_VERSION" ]; then
    echo -e "${YELLOW}⚠ 版本号不一致:${NC}"
    echo -e "  package.json:    ${CYAN}${PKG_VERSION}${NC}"
    echo -e "  tauri.conf.json: ${CYAN}${TAURI_VERSION}${NC}"
    echo -e "  Cargo.toml:      ${CYAN}${CARGO_VERSION}${NC}"
    echo ""
    echo -e "${YELLOW}请同步版本号后重试${NC}"
    exit 1
fi

# ── 加载签名环境变量 ──────────────────────────────────────────────────────

if [ -f "${PROJECT_DIR}/.env" ]; then
    set -a
    source "${PROJECT_DIR}/.env"
    set +a
fi

echo -e "${BLUE}签名配置:${NC}"
echo -e "  APPLE_SIGNING_IDENTITY: ${APPLE_SIGNING_IDENTITY:-未设置 (adhoc 签名)}"
echo -e "  APPLE_TEAM_ID:          ${APPLE_TEAM_ID:-未设置}"
echo ""

# ── 构建 Next.js + Electron 清理 ──────────────────────────────────────────

echo -e "${BLUE}[1/3] 构建 Next.js 前端${NC}"
cd "$PROJECT_DIR"
npm run build
echo -e "${GREEN}✓ 前端构建完成${NC}"
echo ""

# ── Tauri 打包 ────────────────────────────────────────────────────────────

echo -e "${BLUE}[2/3] Tauri 打包 (DMG)${NC}"
cd "$PROJECT_DIR"

# 设置签名环境
if [ -n "$APPLE_SIGNING_IDENTITY" ]; then
    export TAURI_SIGNING_PRIVATE_KEY="$APPLE_SIGNING_IDENTITY"
    export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$APPLE_SIGNING_KEY_PASSWORD"
fi

npm run tauri:build -- --target universal-apple-darwin
echo -e "${GREEN}✓ Tauri 构建完成${NC}"
echo ""

# ── 输出结果 ──────────────────────────────────────────────────────────────

DMG_PATH=$(find src-tauri/target/universal-apple-darwin/release/bundle/dmg -name "*.dmg" 2>/dev/null | head -1)
APP_PATH=$(find src-tauri/target/universal-apple-darwin/release/bundle/macos -name "*.app" -maxdepth 1 2>/dev/null | head -1)

echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  构建完成!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
if [ -n "$DMG_PATH" ]; then
    echo -e "  DMG:  ${BLUE}${DMG_PATH}${NC}"
fi
if [ -n "$APP_PATH" ]; then
    echo -e "  App:  ${BLUE}${APP_PATH}${NC}"
fi
echo ""

# ── 可选：签名公证 ────────────────────────────────────────────────────────

if [ -n "$APPLE_TEAM_ID" ] && [ -n "$APP_PATH" ]; then
    echo -e "${BLUE}[3/3] 签名 + 公证${NC}"
    echo ""

    # 签名
    codesign --deep --force --verify --verbose \
        --sign "Developer ID Application: ${APPLE_SIGNING_IDENTITY}" \
        --options runtime \
        --entitlements "${PROJECT_DIR}/entitlements.plist" \
        "$APP_PATH"

    # 创建 ZIP 用于公证
    APP_NAME=$(basename "$APP_PATH")
    ZIP_PATH="/tmp/${APP_NAME%.app}.zip"
    ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"

    # 提交公证
    xcrun notarytool submit "$ZIP_PATH" \
        --apple-id "$APPLE_ID" \
        --team-id "$APPLE_TEAM_ID" \
        --password "$APPLE_APP_SPECIFIC_PASSWORD" \
        --wait

    # 装订票据
    xcrun stapler staple "$APP_PATH"
    echo -e "${GREEN}✓ 签名公证完成${NC}"
fi
