import { BrowserWindow, ipcMain } from "electron";
import type { AppPlatform, WindowChromeInfo } from "../../shared/ipc";
import { IPC } from "../../shared/ipc";

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null;
}

function getChromeInfo(): WindowChromeInfo {
  const platform = process.platform as AppPlatform;
  const isMac = platform === "darwin";
  return {
    platform,
    useNativeTrafficLights: isMac,
    frameless: true,
  };
}

export function registerWindowIpc(): void {
  ipcMain.handle(IPC.window.getChrome, () => getChromeInfo());

  ipcMain.handle(IPC.window.minimize, () => {
    getMainWindow()?.minimize();
  });

  ipcMain.handle(IPC.window.maximize, () => {
    const win = getMainWindow();
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.handle(IPC.window.close, () => {
    getMainWindow()?.close();
  });
}
