import {
  app,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  shell,
} from "electron";
import { APP_NAME, DOCS_URL, GITHUB_URL } from "./branding";

export const APP_NAVIGATE_CHANNEL = "firekit:navigate";

function focusedWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
}

function sendNavigate(route: string): void {
  focusedWindow()?.webContents.send(APP_NAVIGATE_CHANNEL, route);
}

function settingsItem(): MenuItemConstructorOptions {
  return {
    label: "Settings…",
    accelerator: "CmdOrCtrl+,",
    click: () => sendNavigate("/settings"),
  };
}

function buildMacAppMenu(): MenuItemConstructorOptions {
  return {
    // macOS replaces this with app.name (set in bootstrap-name.ts).
    label: app.name || APP_NAME,
    submenu: [
      { role: "about", label: `About ${APP_NAME}` },
      { type: "separator" },
      settingsItem(),
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide", label: `Hide ${APP_NAME}` },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit", label: `Quit ${APP_NAME}` },
    ],
  };
}

function buildFileMenu(): MenuItemConstructorOptions {
  return {
    label: "File",
    submenu: [
      settingsItem(),
      { type: "separator" },
      { role: "quit", label: `Exit ${APP_NAME}` },
    ],
  };
}

function buildHelpMenu(): MenuItemConstructorOptions {
  return {
    role: "help",
    submenu: [
      {
        label: `${APP_NAME} Documentation`,
        click: () => void shell.openExternal(DOCS_URL),
      },
      {
        label: `${APP_NAME} on GitHub`,
        click: () => void shell.openExternal(GITHUB_URL),
      },
      { type: "separator" },
      {
        label: "Report an Issue",
        click: () => void shell.openExternal(`${GITHUB_URL}/issues/new/choose`),
      },
    ],
  };
}

export function createApplicationMenu(isDev: boolean): void {
  const isMac = process.platform === "darwin";

  const template: MenuItemConstructorOptions[] = [
    isMac ? buildMacAppMenu() : buildFileMenu(),
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        ...(isDev
          ? [
              {
                role: "toggleDevTools" as const,
                accelerator: "Alt+CmdOrCtrl+I",
              },
            ]
          : []),
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
    buildHelpMenu(),
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
