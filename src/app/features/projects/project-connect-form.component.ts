import {
  Component,
  HostListener,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideIcons } from "@ng-icons/core";
import {
  lucideCheck,
  lucideFileJson,
  lucideShield,
  lucideUpload,
} from "@ng-icons/lucide";
import type { BrnTooltipPosition } from "@spartan-ng/brain/tooltip";
import { provideBrnTooltipDefaultOptions } from "@spartan-ng/brain/tooltip";
import { HlmAlertImports } from "@spartan-ng/helm/alert";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { HlmInputImports } from "@spartan-ng/helm/input";
import { HlmLabelImports } from "@spartan-ng/helm/label";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { HlmTextareaImports } from "@spartan-ng/helm/textarea";
import {
  DEFAULT_TOOLTIP_CONTENT_CLASSES,
  DEFAULT_TOOLTIP_SVG_CLASS,
  HlmTooltipImports,
  tooltipPositionVariants,
} from "@spartan-ng/helm/tooltip";
import { hlm } from "@spartan-ng/helm/utils";
import { ElectronApiService } from "../../core/electron-api.service";
import { ProjectContextService } from "../../core/project-context.service";

@Component({
  selector: "fk-project-connect-form",
  standalone: true,
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmTextareaImports,
    HlmLabelImports,
    HlmAlertImports,
    HlmIconImports,
    HlmSpinnerImports,
    HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideUpload,
      lucideFileJson,
      lucideShield,
      lucideCheck,
    }),
    provideBrnTooltipDefaultOptions({
      showDelay: 150,
      hideDelay: 0,
      svgClasses: DEFAULT_TOOLTIP_SVG_CLASS,
      tooltipContentClasses: `${DEFAULT_TOOLTIP_CONTENT_CLASSES} max-w-xs px-3 py-2.5`,
      arrowClasses: (position: BrnTooltipPosition) =>
        hlm(tooltipPositionVariants({ position })),
    }),
  ],
  template: `
    <form class="fk-connect-form space-y-5" (submit)="onSubmit($event)">
      <div class="space-y-2">
        <label hlmLabel for="displayName">Display name</label>
        <input
          hlmInput
          id="displayName"
          name="displayName"
          [(ngModel)]="displayName"
          placeholder="My App (production)"
          autocomplete="off"
        />
        <p class="text-muted-foreground text-xs">
          A friendly label — only stored on this device.
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-1.5">
          <label hlmLabel class="mb-0">Service account JSON</label>
          <button
            type="button"
            class="fk-connect-form__help-trigger"
            hlmTooltip
            [hlmTooltip]="saHelpTpl"
            position="top"
            aria-label="How to get a service account JSON key"
          >
            ?
          </button>
        </div>
        <ng-template #saHelpTpl>
          <div class="fk-connect-form__help space-y-1.5 text-left">
            <p class="font-semibold">Download from Firebase Console</p>
            <ol class="list-decimal space-y-1 pl-4 leading-snug">
              <li>
                Open
                <span class="font-medium">console.firebase.google.com</span>
                and select your project
              </li>
              <li>
                Go to <span class="font-medium">Project settings</span> (gear
                icon) → <span class="font-medium">Service accounts</span>
              </li>
              <li>
                Click <span class="font-medium">Generate new private key</span>
                and confirm
              </li>
              <li>
                Save the downloaded <span class="font-medium">.json</span> file,
                then drop or paste it here
              </li>
            </ol>
          </div>
        </ng-template>
        <div
          class="fk-connect-form__drop"
          [class.fk-connect-form__drop--active]="dragOver()"
          [class.fk-connect-form__drop--filled]="!!serviceAccountJson.trim()"
          (click)="fileInput.click()"
          role="button"
          tabindex="0"
          (keydown.enter)="fileInput.click()"
          (keydown.space)="fileInput.click(); $event.preventDefault()"
        >
          <input
            #fileInput
            type="file"
            accept="application/json,.json"
            class="sr-only"
            (change)="onFileSelected($event)"
          />
          <ng-icon
            hlm
            [name]="
              serviceAccountJson.trim() ? 'lucideFileJson' : 'lucideUpload'
            "
            size="lg"
            class="text-muted-foreground mb-3"
          />
          @if (serviceAccountJson.trim()) {
            <p class="text-sm font-medium">JSON loaded</p>
            <p class="text-muted-foreground mt-1 text-xs">
              Click or drop another file to replace
            </p>
          } @else {
            <p class="text-sm font-medium">Drop your JSON file here</p>
            <p class="text-muted-foreground mt-1 text-xs">
              or click to browse · paste into the field below
            </p>
          }
        </div>
        <textarea
          hlmTextarea
          id="saJson"
          name="saJson"
          class="fk-connect-form__json font-mono text-xs"
          [(ngModel)]="serviceAccountJson"
          (ngModelChange)="onJsonChange()"
          placeholder='{ "type": "service_account", "project_id": "...", ... }'
          spellcheck="false"
        ></textarea>
      </div>

      <div class="fk-connect-form__notice">
        <ng-icon hlm name="lucideShield" size="sm" class="shrink-0" />
        <p class="text-muted-foreground text-xs leading-relaxed">
          Credentials are stored in your OS keychain, never in the cloud. Use a
          service account with least-privilege IAM roles.
        </p>
      </div>

      @if (message()) {
        <div
          hlmAlert
          [variant]="success() ? 'default' : 'destructive'"
          class="fk-connect-form__feedback"
        >
          @if (success() && tested()) {
            <ng-icon hlm name="lucideCheck" size="sm" class="text-primary" />
          }
          <p hlmAlertDescription>{{ message() }}</p>
        </div>
      }

      <div class="flex flex-wrap gap-2 pt-1">
        <button
          hlmBtn
          variant="outline"
          type="button"
          (click)="test()"
          [disabled]="busy() || !canTest()"
        >
          @if (busy() && busyAction() === "test") {
            <hlm-spinner class="size-4" aria-label="Testing connection" />
          }
          Test connection
        </button>
        <button hlmBtn type="submit" [disabled]="busy() || !canSave()">
          @if (busy() && busyAction() === "save") {
            <hlm-spinner class="size-4" aria-label="Saving project" />
          }
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  `,
})
export class ProjectConnectFormComponent {
  private readonly electron = inject(ElectronApiService);
  private readonly ctx = inject(ProjectContextService);

  readonly submitLabel = input("Save project");
  readonly completed = output<void>();

  displayName = "";
  serviceAccountJson = "";
  readonly busy = signal(false);
  readonly busyAction = signal<"test" | "save" | null>(null);
  readonly message = signal("");
  readonly success = signal(false);
  readonly tested = signal(false);
  readonly dragOver = signal(false);

  @HostListener("dragover", ["$event"])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  @HostListener("dragleave")
  onDragLeave(): void {
    this.dragOver.set(false);
  }

  @HostListener("drop", ["$event"])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.readFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void this.readFile(file);
    input.value = "";
  }

  onJsonChange(): void {
    this.tested.set(false);
    this.suggestNameFromJson();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    void this.save();
  }

  canTest(): boolean {
    return this.serviceAccountJson.trim().length > 0;
  }

  canSave(): boolean {
    return (
      this.displayName.trim().length > 0 &&
      this.serviceAccountJson.trim().length > 0 &&
      this.tested() &&
      this.success()
    );
  }

  async test(): Promise<void> {
    if (!this.canTest()) return;
    this.busy.set(true);
    this.busyAction.set("test");
    this.message.set("");
    this.tested.set(false);
    try {
      const result = await this.electron.api.projects.testConnection({
        serviceAccountJson: this.serviceAccountJson.trim(),
      });
      this.success.set(result.ok);
      this.tested.set(true);
      this.message.set(
        result.ok
          ? `Connected to Firebase project “${result.projectId ?? this.projectIdFromJson() ?? "unknown"}”`
          : (result.error ?? "Connection failed"),
      );
      if (result.ok) {
        this.suggestNameFromJson();
      }
    } catch (e) {
      this.success.set(false);
      this.tested.set(true);
      this.message.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
      this.busyAction.set(null);
    }
  }

  async save(): Promise<void> {
    if (!this.displayName.trim() || !this.serviceAccountJson.trim()) {
      this.message.set("Display name and service account JSON are required");
      this.success.set(false);
      return;
    }
    if (!this.tested() || !this.success()) {
      this.message.set("Test the connection before continuing");
      this.success.set(false);
      return;
    }
    this.busy.set(true);
    this.busyAction.set("save");
    try {
      await this.electron.api.projects.add({
        displayName: this.displayName.trim(),
        serviceAccountJson: this.serviceAccountJson.trim(),
      });
      await this.ctx.refresh();
      this.completed.emit();
    } catch (e) {
      this.success.set(false);
      this.message.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
      this.busyAction.set(null);
    }
  }

  private async readFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      this.serviceAccountJson = text;
      this.onJsonChange();
      this.message.set(`Loaded ${file.name}`);
      this.success.set(true);
      this.tested.set(false);
    } catch {
      this.message.set("Could not read that file");
      this.success.set(false);
    }
  }

  private projectIdFromJson(): string | undefined {
    try {
      const parsed = JSON.parse(this.serviceAccountJson) as {
        project_id?: string;
        projectId?: string;
      };
      return parsed.project_id ?? parsed.projectId;
    } catch {
      return undefined;
    }
  }

  private suggestNameFromJson(): void {
    if (this.displayName.trim()) return;
    const projectId = this.projectIdFromJson();
    if (projectId) {
      this.displayName = projectId;
    }
  }
}
