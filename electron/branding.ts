import { app, nativeImage, type NativeImage } from "electron";
import fs from "fs";
import path from "path";

export const APP_NAME = "FireKit";
export const APP_ID = "dev.firekit.app";
export const APP_DESCRIPTION =
  "Desktop admin for Firebase Firestore and Authentication";
export const GITHUB_URL = "https://github.com/Muneersahel/FireKit";
export const DOCS_URL =
  "https://github.com/Muneersahel/FireKit/blob/main/docs/PROJECT.md";

function iconPathCandidates(): string[] {
  return [
    path.join(process.resourcesPath, "icons", "icon.png"),
    path.join(app.getAppPath(), "build", "icon.png"),
    path.join(__dirname, "../../build/icon.png"),
  ];
}

function aboutIconCandidates(): string[] {
  const macIcns = path.join(app.getAppPath(), "build", "icon.icns");
  return [
    path.join(process.resourcesPath, "icons", "icon.icns"),
    ...(process.platform === "darwin" && fs.existsSync(macIcns)
      ? [macIcns]
      : []),
    ...iconPathCandidates(),
  ];
}

function firstExisting(paths: string[]): string | undefined {
  return paths.find((p) => fs.existsSync(p));
}

export function resolveAppIcon(): NativeImage | undefined {
  const iconPath = firstExisting(iconPathCandidates());
  return iconPath ? nativeImage.createFromPath(iconPath) : undefined;
}

export function configureAppBranding(version: string): void {
  // bootstrap-name.ts sets this before other modules load; repeat for safety.
  app.setName(APP_NAME);

  if (process.platform === "win32") {
    app.setAppUserModelId(APP_ID);
  }

  const aboutIcon = firstExisting(aboutIconCandidates());
  app.setAboutPanelOptions({
    applicationName: APP_NAME,
    applicationVersion: version,
    version,
    copyright: "Copyright © FireKit contributors",
    website: GITHUB_URL,
    credits: APP_DESCRIPTION,
    ...(aboutIcon ? { iconPath: aboutIcon } : {}),
  });

  if (process.platform === "darwin") {
    const icon = resolveAppIcon();
    if (icon && !icon.isEmpty()) {
      app.dock?.setIcon(icon);
    }
  }
}
