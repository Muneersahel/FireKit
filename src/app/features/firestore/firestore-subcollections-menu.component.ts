import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { ElectronApiService } from "../../core/electron-api.service";
import { ProjectContextService } from "../../core/project-context.service";
import {
  buildSubcollectionPath,
  documentIdFromPath,
} from "./firestore-path.utils";

@Component({
  selector: "fk-firestore-subcollections-menu",
  standalone: true,
  imports: [HlmButtonImports, HlmSpinnerImports],
  template: `
    <div class="relative inline-flex">
      <button
        hlmBtn
        variant="ghost"
        size="sm"
        type="button"
        class="fk-subcollections-btn h-7 px-2 font-mono text-[10px]"
        [attr.aria-expanded]="open()"
        aria-haspopup="menu"
        [attr.aria-label]="'Subcollections for ' + documentPath()"
        [title]="'Browse subcollections'"
        (click)="toggle($event)"
      >
        @if (loading()) {
          <hlm-spinner class="size-3" aria-label="Loading subcollections" />
        } @else {
          Sub
        }
      </button>

      @if (open()) {
        <div
          class="fk-subcollections-menu"
          role="menu"
          (click)="$event.stopPropagation()"
        >
          @if (loading()) {
            <p class="text-muted-foreground px-2 py-1.5 text-xs">Loading…</p>
          } @else if (items().length === 0) {
            <p class="text-muted-foreground px-2 py-1.5 text-xs">
              No subcollections
            </p>
          } @else {
            @for (name of items(); track name) {
              <button
                type="button"
                role="menuitem"
                class="fk-subcollections-menu__item"
                (click)="browse(name, $event)"
              >
                {{ name }}
              </button>
            }
          }
        </div>
      }
    </div>
  `,
})
export class FirestoreSubcollectionsMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly electron = inject(ElectronApiService);
  private readonly ctx = inject(ProjectContextService);

  readonly collectionPath = input.required<string>();
  readonly documentPath = input.required<string>();
  readonly browseCollection = output<string>();

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly items = signal<string[]>([]);

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.open()) {
      this.open.set(false);
      return;
    }
    this.open.set(true);
    if (this.items().length > 0) return;
    void this.load();
  }

  browse(subcollectionId: string, event: MouseEvent): void {
    event.stopPropagation();
    const docId = documentIdFromPath(this.documentPath());
    this.browseCollection.emit(
      buildSubcollectionPath(this.collectionPath(), docId, subcollectionId),
    );
    this.open.set(false);
  }

  private async load(): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    if (!projectId) return;
    this.loading.set(true);
    try {
      const names = await this.electron.api.firestore.listSubcollections({
        projectId,
        documentPath: this.documentPath(),
      });
      this.items.set(names);
    } catch {
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
