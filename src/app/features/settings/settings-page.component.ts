import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import type { ProjectMeta } from "@shared/ipc";
import { HlmAlertImports } from "@spartan-ng/helm/alert";
import { HlmBadgeImports } from "@spartan-ng/helm/badge";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmCardImports } from "@spartan-ng/helm/card";
import { HlmInputImports } from "@spartan-ng/helm/input";
import { HlmLabelImports } from "@spartan-ng/helm/label";
import { HlmSeparatorImports } from "@spartan-ng/helm/separator";
import { HlmSkeletonImports } from "@spartan-ng/helm/skeleton";
import { ElectronApiService } from "../../core/electron-api.service";
import { ProjectContextService } from "../../core/project-context.service";

type IndexFeedback = { type: "success" | "error"; message: string };

@Component({
  selector: "fk-settings-page",
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HlmCardImports,
    HlmButtonImports,
    HlmBadgeImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSeparatorImports,
    HlmAlertImports,
    HlmSkeletonImports,
  ],
  template: `
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-6">
        <header
          class="flex shrink-0 flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h2 class="text-lg font-semibold tracking-tight">Settings</h2>
            <p class="text-muted-foreground text-sm">
              Manage projects, local search indexes, and app preferences
            </p>
          </div>
          <a hlmBtn size="sm" routerLink="/projects/new">Add project</a>
        </header>

        @if (ctx.error()) {
          <div hlmAlert variant="destructive" class="shrink-0">
            <p hlmAlertDescription>{{ ctx.error() }}</p>
          </div>
        }

        <div class="grid gap-6 lg:grid-cols-2">
          <section hlmCard size="sm" class="flex flex-col">
            <div hlmCardHeader class="pb-4">
              <h3 hlmCardTitle class="text-base">Projects</h3>
              <p hlmCardDescription>
                Firebase projects stored locally with credentials in your OS
                keychain.
              </p>
            </div>
            <div hlmCardContent class="flex flex-1 flex-col gap-3 pt-0">
              @if (ctx.loading() && ctx.projects().length === 0) {
                <div class="space-y-3" aria-busy="true">
                  @for (row of skeletonRows; track row) {
                    <div
                      class="border-border flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div
                        hlmSkeleton
                        class="size-10 shrink-0 rounded-full"
                      ></div>
                      <div class="min-w-0 flex-1 space-y-2">
                        <div hlmSkeleton class="h-4 w-32"></div>
                        <div hlmSkeleton class="h-3 w-48"></div>
                      </div>
                      <div hlmSkeleton class="h-8 w-24"></div>
                    </div>
                  }
                </div>
              } @else if (ctx.projects().length === 0) {
                <div
                  class="border-border bg-muted/10 flex flex-col items-center rounded-lg border border-dashed px-6 py-10 text-center"
                  role="status"
                >
                  <div
                    class="bg-muted/50 text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      />
                      <path
                        d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
                      />
                    </svg>
                  </div>
                  <h4 class="text-sm font-semibold">No projects connected</h4>
                  <p class="text-muted-foreground mt-1.5 max-w-xs text-sm">
                    Add a Firebase service account to browse Firestore and Auth.
                  </p>
                  <a hlmBtn class="mt-5" size="sm" routerLink="/onboarding">
                    Connect a project
                  </a>
                </div>
              } @else {
                <ul class="space-y-2">
                  @for (p of ctx.projects(); track p.id) {
                    <li
                      class="border-border flex items-center gap-3 rounded-lg border p-3 transition-colors"
                      [class.bg-primary/5]="ctx.activeProjectId() === p.id"
                      [class.ring-primary/30]="ctx.activeProjectId() === p.id"
                      [class.ring-1]="ctx.activeProjectId() === p.id"
                    >
                      <div
                        class="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                        aria-hidden="true"
                      >
                        {{ projectInitials(p) }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate font-medium">{{ p.displayName }}</p>
                        <p
                          class="text-muted-foreground truncate font-mono text-xs"
                        >
                          {{ p.projectId }}
                        </p>
                      </div>
                      <div
                        class="flex shrink-0 flex-wrap items-center justify-end gap-2"
                      >
                        @if (ctx.activeProjectId() === p.id) {
                          <span hlmBadge variant="default">Active</span>
                        } @else {
                          <button
                            hlmBtn
                            variant="outline"
                            size="sm"
                            type="button"
                            (click)="activate(p.id)"
                          >
                            Activate
                          </button>
                        }
                        <button
                          hlmBtn
                          variant="ghost"
                          size="sm"
                          class="text-destructive hover:text-destructive"
                          type="button"
                          (click)="remove(p.id)"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          </section>

          <section hlmCard size="sm" class="flex flex-col">
            <div hlmCardHeader class="pb-4">
              <h3 hlmCardTitle class="text-base">Search index</h3>
              <p hlmCardDescription>
                Local SQLite index for faster Firestore search. Sync from the
                Firestore view; clear per collection here.
              </p>
            </div>
            <div hlmCardContent class="space-y-4 pt-0">
              <div
                class="bg-muted/20 border-border rounded-lg border px-3 py-2.5"
              >
                <p class="text-muted-foreground text-xs font-medium uppercase">
                  Active project
                </p>
                <p class="mt-0.5 truncate text-sm font-medium">
                  @if (ctx.activeProject; as active) {
                    {{ active.displayName }}
                    <span class="text-muted-foreground font-mono font-normal">
                      · {{ active.projectId }}
                    </span>
                  } @else {
                    <span class="text-muted-foreground">None selected</span>
                  }
                </p>
              </div>

              <div class="space-y-2">
                <label hlmLabel for="collPath">Collection path</label>
                <input
                  hlmInput
                  id="collPath"
                  class="h-9 font-mono"
                  [(ngModel)]="collectionPath"
                  placeholder="users"
                  (keydown.enter)="clearIndex()"
                />
                <p class="text-muted-foreground text-xs">
                  Removes cached index rows for this collection only.
                </p>
              </div>

              <button
                hlmBtn
                variant="outline"
                size="sm"
                type="button"
                [disabled]="!ctx.activeProjectId() || !collectionPath.trim()"
                (click)="clearIndex()"
              >
                Clear collection index
              </button>

              @if (indexFeedback(); as feedback) {
                <div
                  hlmAlert
                  [variant]="
                    feedback.type === 'success' ? 'default' : 'destructive'
                  "
                >
                  <p hlmAlertDescription>{{ feedback.message }}</p>
                </div>
              }
            </div>
          </section>
        </div>

        <section hlmCard size="sm" class="bg-muted/10">
          <div
            hlmCardContent
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-3">
              <img
                src="firekit-icon.png"
                width="40"
                height="40"
                alt=""
                class="size-10 shrink-0 rounded-lg object-cover"
              />
              <div class="space-y-1">
                <p class="text-sm font-medium">FireKit</p>
                <p class="text-muted-foreground text-xs">
                  v0.1.0 · MIT License · Admin SDK runs in the Electron main
                  process only
                </p>
              </div>
            </div>
            <div class="text-muted-foreground flex gap-4 text-xs">
              <a
                routerLink="/firestore"
                class="hover:text-foreground underline-offset-4 hover:underline"
                >Firestore</a
              >
              <a
                routerLink="/auth"
                class="hover:text-foreground underline-offset-4 hover:underline"
                >Authentication</a
              >
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class SettingsPageComponent implements OnInit {
  protected readonly skeletonRows = [0, 1];

  readonly ctx = inject(ProjectContextService);
  private readonly electron = inject(ElectronApiService);
  private readonly router = inject(Router);

  readonly indexFeedback = signal<IndexFeedback | null>(null);
  collectionPath = "";

  ngOnInit(): void {
    void this.ctx.refresh();
  }

  projectInitials(project: ProjectMeta): string {
    const parts = project.displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return project.displayName.slice(0, 2).toUpperCase() || "FK";
  }

  async activate(id: string): Promise<void> {
    await this.ctx.setActive(id);
  }

  async remove(id: string): Promise<void> {
    if (!confirm("Remove this project and delete stored credentials?")) return;
    await this.electron.api.projects.remove(id);
    await this.ctx.refresh();
    if (this.ctx.projects().length === 0) {
      void this.router.navigate(["/onboarding"]);
    }
  }

  async clearIndex(): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    const path = this.collectionPath.trim();
    if (!projectId || !path) {
      this.indexFeedback.set({
        type: "error",
        message: "Select an active project and enter a collection path.",
      });
      return;
    }
    try {
      await this.electron.api.index.clear({
        projectId,
        collectionPath: path,
      });
      this.indexFeedback.set({
        type: "success",
        message: `Index cleared for “${path}”.`,
      });
    } catch (e) {
      this.indexFeedback.set({
        type: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
}
