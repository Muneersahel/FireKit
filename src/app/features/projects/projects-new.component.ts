import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { ProjectConnectFormComponent } from "./project-connect-form.component";

/** Add another project from inside the app shell. */
@Component({
  selector: "fk-projects-new",
  standalone: true,
  imports: [HlmButtonImports, ProjectConnectFormComponent],
  template: `
    <div class="flex min-h-0 flex-1 flex-col overflow-auto p-6">
      <header class="mb-6 max-w-xl">
        <button
          hlmBtn
          variant="ghost"
          size="sm"
          type="button"
          class="text-muted-foreground -ml-2 mb-3"
          (click)="goBack()"
        >
          ← Back
        </button>
        <h2 class="text-lg font-semibold tracking-tight">Add project</h2>
        <p class="text-muted-foreground mt-1 text-sm">
          Connect another Firebase project with a service account JSON file.
        </p>
      </header>

      <div class="max-w-xl">
        <fk-project-connect-form
          submitLabel="Save project"
          (completed)="onSaved()"
        />
      </div>
    </div>
  `,
})
export class ProjectsNewComponent {
  private readonly router = inject(Router);

  goBack(): void {
    void this.router.navigate(["/settings"]);
  }

  onSaved(): void {
    void this.router.navigate(["/settings"]);
  }
}
