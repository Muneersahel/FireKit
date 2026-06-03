import { Routes } from "@angular/router";
import { onboardingGuard } from "./core/guards/onboarding.guard";
import { requiresProjectsGuard } from "./core/guards/requires-projects.guard";

export const routes: Routes = [
  {
    path: "onboarding",
    canActivate: [onboardingGuard],
    loadComponent: () =>
      import("./features/projects/onboarding.component").then(
        (m) => m.OnboardingComponent,
      ),
  },
  { path: "welcome", redirectTo: "onboarding", pathMatch: "full" },
  {
    path: "",
    loadComponent: () =>
      import("./layout/shell.component").then((m) => m.ShellComponent),
    canActivate: [requiresProjectsGuard],
    children: [
      { path: "", redirectTo: "firestore", pathMatch: "full" },
      {
        path: "projects/new",
        loadComponent: () =>
          import("./features/projects/projects-new.component").then(
            (m) => m.ProjectsNewComponent,
          ),
      },
      {
        path: "firestore",
        loadComponent: () =>
          import("./features/firestore/firestore-shell.component").then(
            (m) => m.FirestoreShellComponent,
          ),
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/firestore/firestore-page.component").then(
                (m) => m.FirestoreCollectionComponent,
              ),
          },
          {
            path: "c/**",
            loadComponent: () =>
              import("./features/firestore/firestore-page.component").then(
                (m) => m.FirestoreCollectionComponent,
              ),
          },
          {
            path: "d/**",
            loadComponent: () =>
              import("./features/firestore/firestore-document-view.component").then(
                (m) => m.FirestoreDocumentViewComponent,
              ),
          },
        ],
      },
      {
        path: "auth",
        loadComponent: () =>
          import("./features/auth/auth-page.component").then(
            (m) => m.AuthPageComponent,
          ),
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./features/settings/settings-page.component").then(
            (m) => m.SettingsPageComponent,
          ),
      },
    ],
  },
  { path: "**", redirectTo: "firestore" },
];
