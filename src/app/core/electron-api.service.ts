import { Injectable } from "@angular/core";
import type { FirekitApi } from "@shared/ipc";

@Injectable({ providedIn: "root" })
export class ElectronApiService {
  /** True when running inside Electron with preload bridge attached. */
  isAvailable(): boolean {
    return typeof window !== "undefined" && !!window.firekit;
  }

  get api(): FirekitApi {
    if (!this.isAvailable()) {
      const inElectronShell =
        typeof navigator !== "undefined" &&
        /Electron/i.test(navigator.userAgent);
      throw new Error(
        inElectronShell
          ? "FireKit API is not loaded. Run `pnpm run electron:build` then `pnpm run electron:dev` again."
          : "FireKit must run in the Electron app window, not a browser tab. Close this tab and use the window opened by `pnpm run electron:dev`.",
      );
    }
    return window.firekit;
  }
}
