import { app, BrowserWindow, shell } from "electron";
import fs from "fs";
import path from "path";
import packageJson from "../package.json";
import "./bootstrap-name";
import { configureAppBranding, resolveAppIcon } from "./branding";
import { registerAllIpc } from "./ipc/register";
import { createApplicationMenu } from "./menu";
import {
  applyWindowState,
  attachWindowStatePersistence,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  loadWindowState,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
} from "./window-state";

const isDev = !app.isPackaged;

function resolvePreloadPath(): string {
  return path.join(__dirname, "preload.js");
}

async function createWindow(): Promise<void> {
  const preloadPath = resolvePreloadPath();
  if (!fs.existsSync(preloadPath)) {
    console.error("[FireKit] Preload script missing:", preloadPath);
    console.error("[FireKit] Run: pnpm run electron:build");
  }

  const isMac = process.platform === "darwin";
  const saved = await loadWindowState();

  const win = new BrowserWindow({
    width: saved.width ?? DEFAULT_WINDOW_WIDTH,
    height: saved.height ?? DEFAULT_WINDOW_HEIGHT,
    ...(saved.x !== undefined && saved.y !== undefined
      ? { x: saved.x, y: saved.y }
      : {}),
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    title: "FireKit",
    icon: resolveAppIcon(),
    frame: false,
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    // Align with sidebar toolbar row (fk-sidebar-chrome).
    ...(isMac ? { trafficLightPosition: { x: 14, y: 16 } } : {}),
    backgroundColor: "#1c1c1e",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Preload + contextBridge with http://localhost (ng serve) requires sandbox off.
      sandbox: false,
      preload: preloadPath,
    },
  });

  attachWindowStatePersistence(win);
  applyWindowState(win, saved);

  win.webContents.on("did-finish-load", () => {
    void win.webContents
      .executeJavaScript('typeof window.firekit !== "undefined"')
      .then((ok) => {
        if (!ok) {
          console.error(
            "[FireKit] window.firekit was not exposed. Check preload at:",
            preloadPath,
          );
        }
      });
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    void win.loadURL("http://localhost:4200");
    if (process.env["FIREKIT_DEVTOOLS"] === "1") {
      win.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    void win.loadFile(
      path.join(__dirname, "../../dist/firekit/browser/index.html"),
    );
  }
}

configureAppBranding(packageJson.version);

app.whenReady().then(() => {
  registerAllIpc();
  createApplicationMenu(isDev);
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
