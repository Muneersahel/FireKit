import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import { lucideDatabase, lucideKeyRound, lucideUsers } from "@ng-icons/lucide";
import { HlmCardImports } from "@spartan-ng/helm/card";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { ElectronApiService } from "../../core/electron-api.service";
import { OnboardingChromeComponent } from "../../layout/onboarding-chrome.component";
import { ProjectConnectFormComponent } from "./project-connect-form.component";

@Component({
  selector: "fk-onboarding",
  standalone: true,
  imports: [
    HlmCardImports,
    HlmIconImports,
    OnboardingChromeComponent,
    ProjectConnectFormComponent,
  ],
  providers: [
    provideIcons({
      lucideDatabase,
      lucideUsers,
      lucideKeyRound,
    }),
  ],
  template: `
    @if (!electron.isAvailable()) {
      <div
        class="fk-onboarding fk-onboarding--browser flex min-h-svh items-center justify-center p-8"
      >
        <section hlmCard class="w-full max-w-md p-0">
          <div hlmCardHeader>
            <h2 hlmCardTitle>Open FireKit in Electron</h2>
            <p hlmCardDescription>
              This app runs inside the Electron window — not in a regular
              browser tab.
            </p>
          </div>
          <div hlmCardContent class="space-y-3">
            <p class="text-muted-foreground text-sm">
              From the project folder:
            </p>
            <pre class="bg-muted rounded-md p-3 text-xs">
pnpm run electron:dev</pre
            >
          </div>
        </section>
      </div>
    } @else {
      <div class="fk-onboarding min-h-svh">
        <fk-onboarding-chrome />

        <div class="fk-onboarding__grid">
          <aside class="fk-onboarding__hero">
            <div class="fk-onboarding__hero-inner">
              <img
                class="fk-onboarding__logo"
                src="firekit-icon.png"
                width="44"
                height="44"
                alt=""
              />
              <p class="fk-onboarding__eyebrow">Welcome</p>
              <h1 class="fk-onboarding__headline">
                Connect your first Firebase project
              </h1>
              <p class="fk-onboarding__lead">
                FireKit is a local admin console for Firestore and
                Authentication. Add a service account to get started —
                everything stays on your machine.
              </p>

              <ol class="fk-onboarding__steps">
                <li class="fk-onboarding__step fk-onboarding__step--active">
                  <span class="fk-onboarding__step-num">1</span>
                  <span>Import service account JSON</span>
                </li>
                <li class="fk-onboarding__step">
                  <span class="fk-onboarding__step-num">2</span>
                  <span>Verify connection</span>
                </li>
                <li class="fk-onboarding__step">
                  <span class="fk-onboarding__step-num">3</span>
                  <span>Open Firestore &amp; Auth</span>
                </li>
              </ol>

              <ul class="fk-onboarding__features">
                <li>
                  <ng-icon hlm name="lucideDatabase" size="sm" />
                  <span>Browse collections and documents</span>
                </li>
                <li>
                  <ng-icon hlm name="lucideUsers" size="sm" />
                  <span>Search and manage Auth users</span>
                </li>
                <li>
                  <ng-icon hlm name="lucideKeyRound" size="sm" />
                  <span>Secrets stored in your OS keychain</span>
                </li>
              </ul>
            </div>
          </aside>

          <main class="fk-onboarding__main">
            <div class="fk-onboarding__panel">
              <header class="fk-onboarding__panel-header">
                <div class="mb-4 flex items-center gap-2.5 lg:hidden">
                  <img
                    class="fk-onboarding__logo size-9"
                    src="firekit-icon.png"
                    width="36"
                    height="36"
                    alt=""
                  />
                  <span class="text-sm font-semibold">FireKit</span>
                </div>
                <h2 class="text-lg font-semibold tracking-tight">
                  Project setup
                </h2>
                <p class="text-muted-foreground text-sm">
                  Paste or upload a Firebase service account key from the
                  console.
                </p>
              </header>

              <fk-project-connect-form
                submitLabel="Start using FireKit"
                (completed)="onConnected()"
              />
            </div>
          </main>
        </div>
      </div>
    }
  `,
})
export class OnboardingComponent {
  private readonly router = inject(Router);
  readonly electron = inject(ElectronApiService);

  onConnected(): void {
    void this.router.navigate(["/firestore"]);
  }
}
