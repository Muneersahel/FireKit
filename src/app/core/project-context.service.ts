import { Injectable, inject, signal } from "@angular/core";
import type { ProjectListResult, ProjectMeta } from "@shared/ipc";
import { ElectronApiService } from "./electron-api.service";

@Injectable({ providedIn: "root" })
export class ProjectContextService {
  private readonly electron = inject(ElectronApiService);

  readonly projects = signal<ProjectMeta[]>([]);
  readonly activeProjectId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** True after the first successful projects.list (or failed attempt). */
  readonly ready = signal(false);

  get activeProject(): ProjectMeta | null {
    const id = this.activeProjectId();
    return this.projects().find((p) => p.id === id) ?? null;
  }

  async ensureLoaded(): Promise<void> {
    if (this.ready() || !this.electron.isAvailable()) {
      return;
    }
    await this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.electron.isAvailable()) {
      this.ready.set(true);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const result: ProjectListResult = await this.electron.api.projects.list();
      this.projects.set(result.projects);
      this.activeProjectId.set(result.activeProjectId);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(false);
      this.ready.set(true);
    }
  }

  async setActive(projectId: string): Promise<void> {
    await this.electron.api.projects.setActive(projectId);
    this.activeProjectId.set(projectId);
  }
}
