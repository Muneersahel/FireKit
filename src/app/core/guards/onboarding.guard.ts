import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { ElectronApiService } from "../electron-api.service";
import { ProjectContextService } from "../project-context.service";

/** Onboarding is only for first-time setup (no projects yet). */
export const onboardingGuard: CanActivateFn = async () => {
  const electron = inject(ElectronApiService);
  const ctx = inject(ProjectContextService);
  const router = inject(Router);

  if (!electron.isAvailable()) {
    return true;
  }

  await ctx.ensureLoaded();

  if (ctx.projects().length > 0) {
    return router.createUrlTree(["/firestore"]);
  }

  return true;
};
