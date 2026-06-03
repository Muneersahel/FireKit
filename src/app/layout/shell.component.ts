import { NgTemplateOutlet } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import { lucideDatabase, lucideSettings, lucideUsers } from "@ng-icons/lucide";
import { HlmAlertImports } from "@spartan-ng/helm/alert";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmCardImports } from "@spartan-ng/helm/card";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { HlmSeparatorImports } from "@spartan-ng/helm/separator";
import {
  HlmSidebarImports,
  provideHlmSidebarConfig,
} from "@spartan-ng/helm/sidebar";
import { ElectronApiService } from "../core/electron-api.service";
import { ProjectContextService } from "../core/project-context.service";
import { AppSidebarChromeComponent } from "./app-sidebar-chrome.component";
import { ProjectMenuComponent } from "./project-menu.component";
import { SidebarToggleComponent } from "./sidebar-toggle.component";

@Component({
  selector: "fk-shell",
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HlmSidebarImports,
    HlmButtonImports,
    HlmCardImports,
    HlmAlertImports,
    HlmSeparatorImports,
    HlmIconImports,
    AppSidebarChromeComponent,
    ProjectMenuComponent,
    SidebarToggleComponent,
  ],
  providers: [
    provideIcons({
      lucideDatabase,
      lucideUsers,
      lucideSettings,
    }),
    provideHlmSidebarConfig({
      sidebarWidthIcon: "3.5rem",
    }),
  ],
  template: `
    @if (!electron.isAvailable()) {
      <div class="flex min-h-screen items-center justify-center p-8">
        <section hlmCard class="w-full max-w-lg p-0">
          <div hlmCardHeader>
            <h2 hlmCardTitle>Open FireKit in Electron</h2>
            <p hlmCardDescription>
              The UI at <code class="text-primary">localhost:4200</code> only
              works inside the Electron window. Do not use Chrome or Safari for
              this URL.
            </p>
          </div>
          <div hlmCardContent class="space-y-3">
            <p class="text-muted-foreground text-sm">
              In the project folder, run:
            </p>
            <pre class="bg-muted rounded-md p-3 text-xs">
pnpm run electron:dev</pre
            >
          </div>
        </section>
      </div>
    } @else {
      <div hlmSidebarWrapper class="fk-shell h-svh w-full">
        <hlm-sidebar collapsible="icon" class="fk-app-sidebar">
          <div class="fk-sidebar-chrome-slot">
            <fk-app-sidebar-chrome />
          </div>

          <div class="fk-sidebar-rail">
            <div class="fk-sidebar-rail__traffic-gap" aria-hidden="true"></div>
            <fk-sidebar-toggle buttonClass="fk-sidebar-rail__btn size-9" />
          </div>

          <ng-container *ngTemplateOutlet="navPanel" />
        </hlm-sidebar>

        <main hlmSidebarInset class="fk-main">
          <ng-container *ngTemplateOutlet="mainContent" />
        </main>
      </div>
    }

    <ng-template #navPanel>
      <div hlmSidebarHeader class="fk-app-sidebar__header">
        <div class="fk-app-sidebar__brand">
          <img
            class="fk-app-sidebar__logo"
            src="firekit-icon.png"
            width="32"
            height="32"
            alt=""
          />
          <div class="min-w-0">
            <p class="fk-app-sidebar__title">FireKit</p>
            <p class="fk-app-sidebar__subtitle">Firebase admin</p>
          </div>
        </div>
      </div>

      <div hlmSidebarContent class="fk-app-sidebar__content">
        <div hlmSidebarGroup class="fk-app-sidebar__nav-group">
          <div hlmSidebarGroupLabel class="fk-app-sidebar__group-label">
            Navigate
          </div>
          <ul hlmSidebarMenu class="fk-app-sidebar__menu">
            <li hlmSidebarMenuItem>
              <a
                hlmSidebarMenuButton
                routerLink="/firestore"
                routerLinkActive
                #rlaFs="routerLinkActive"
                [isActive]="rlaFs.isActive"
                tooltip="Firestore"
              >
                <ng-icon hlm name="lucideDatabase" size="sm" />
                <span>Firestore</span>
              </a>
            </li>
            <li hlmSidebarMenuItem>
              <a
                hlmSidebarMenuButton
                routerLink="/auth"
                routerLinkActive
                #rlaAuth="routerLinkActive"
                [isActive]="rlaAuth.isActive"
                tooltip="Authentication"
              >
                <ng-icon hlm name="lucideUsers" size="sm" />
                <span>Authentication</span>
              </a>
            </li>
            <li hlmSidebarMenuItem>
              <a
                hlmSidebarMenuButton
                routerLink="/settings"
                routerLinkActive
                #rlaSet="routerLinkActive"
                [isActive]="rlaSet.isActive"
                tooltip="Settings"
              >
                <ng-icon hlm name="lucideSettings" size="sm" />
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div hlmSidebarFooter class="fk-app-sidebar__footer">
        <div class="fk-app-sidebar__footer-expanded">
          <div hlmSidebarGroupLabel class="fk-app-sidebar__group-label mb-2">
            Project
          </div>
          <fk-project-menu
            class="fk-app-sidebar__select"
            [projects]="ctx.projects()"
            [value]="ctx.activeProjectId()"
            (valueChange)="onProjectSelect($event)"
          />
          @if (!ctx.activeProjectId() && ctx.projects().length > 0) {
            <p class="text-muted-foreground mt-2 text-xs">
              Select a project above
            </p>
          } @else if (ctx.activeProject; as project) {
            <p
              class="text-muted-foreground mt-2 truncate font-mono text-[10px]"
              [title]="project.projectId"
            >
              {{ project.projectId }}
            </p>
          }
        </div>

        <div class="fk-app-sidebar__footer-collapsed">
          <fk-project-menu
            [compact]="true"
            [projects]="ctx.projects()"
            [value]="ctx.activeProjectId()"
            (valueChange)="onProjectSelect($event)"
          />
        </div>
      </div>
    </ng-template>

    <ng-template #mainContent>
      @if (ctx.error()) {
        <div hlmAlert variant="destructive" class="m-4 shrink-0">
          <p hlmAlertTitle>Error</p>
          <p hlmAlertDescription>{{ ctx.error() }}</p>
        </div>
      }
      <router-outlet />
    </ng-template>
  `,
})
export class ShellComponent implements OnInit {
  readonly ctx = inject(ProjectContextService);
  readonly electron = inject(ElectronApiService);

  ngOnInit(): void {
    if (this.electron.isAvailable()) {
      void this.ctx.refresh();
    }
  }

  onProjectSelect(id: string): void {
    if (id) void this.ctx.setActive(id);
  }
}
