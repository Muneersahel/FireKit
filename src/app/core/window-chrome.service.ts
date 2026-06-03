import { Injectable, inject, signal } from "@angular/core";
import type { WindowChromeInfo } from "@shared/ipc";
import { ElectronApiService } from "./electron-api.service";

@Injectable({ providedIn: "root" })
export class WindowChromeService {
  private readonly electron = inject(ElectronApiService);

  readonly chrome = signal<WindowChromeInfo | null>(null);

  async init(): Promise<void> {
    if (!this.electron.isAvailable()) return;
    try {
      const info = await this.electron.api.window.getChrome();
      this.chrome.set(info);
    } catch {
      this.chrome.set(null);
    }
  }

  isMac(): boolean {
    return this.chrome()?.useNativeTrafficLights ?? false;
  }

  showCustomTrafficLights(): boolean {
    const c = this.chrome();
    return !!c?.frameless && !c.useNativeTrafficLights;
  }

  minimize(): void {
    if (!this.electron.isAvailable()) return;
    void this.electron.api.window.minimize();
  }

  maximize(): void {
    if (!this.electron.isAvailable()) return;
    void this.electron.api.window.maximize();
  }

  close(): void {
    if (!this.electron.isAvailable()) return;
    void this.electron.api.window.close();
  }
}
