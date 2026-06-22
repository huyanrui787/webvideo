/**
 * Native macOS menu bar for WebVideo Studio.
 */

import {
  app,
  Menu,
  shell,
  type BrowserWindow,
  type MenuItemConstructorOptions,
} from "electron";

export function buildAppMenu(
  getMainWindow: () => BrowserWindow | null
): void {
  const isMac = process.platform === "darwin";

  function win(): BrowserWindow | null {
    return getMainWindow();
  }

  const template: MenuItemConstructorOptions[] = [
    // ── App menu (macOS only) ────────────────────────────────────────────────
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          } as MenuItemConstructorOptions,
        ] as MenuItemConstructorOptions[])
      : []),

    // ── File ─────────────────────────────────────────────────────────────────
    {
      label: "文件",
      submenu: [
        {
          label: "新建项目",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            win()?.webContents.send("menu-action", "new-project");
          },
        },
        { type: "separator" },
        ...(isMac ? [{ role: "close" as const }] : [{ role: "quit" as const }]),
      ],
    } as MenuItemConstructorOptions,

    // ── Edit ─────────────────────────────────────────────────────────────────
    {
      label: "编辑",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    } as MenuItemConstructorOptions,

    // ── View ─────────────────────────────────────────────────────────────────
    {
      label: "视图",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(isMac ? [] : [{ type: "separator" as const }, { role: "toggleDevTools" as const }] as MenuItemConstructorOptions[]),
      ],
    } as MenuItemConstructorOptions,

    // ── Window ───────────────────────────────────────────────────────────────
    {
      label: "窗口",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [{ type: "separator" as const }, { role: "front" as const }] as MenuItemConstructorOptions[]
          : [{ role: "close" as const }] as MenuItemConstructorOptions[]),
      ],
    } as MenuItemConstructorOptions,

    // ── Help ─────────────────────────────────────────────────────────────────
    {
      role: "help",
      submenu: [
        {
          label: "WebVideo Studio 文档",
          click: async () => {
            await shell.openExternal("https://webvideostudio.com/docs");
          },
        },
        {
          label: "反馈问题",
          click: async () => {
            await shell.openExternal("https://webvideostudio.com/feedback");
          },
        },
      ],
    } as MenuItemConstructorOptions,
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
