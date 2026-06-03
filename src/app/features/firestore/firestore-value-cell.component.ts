import { Component, input, output } from "@angular/core";
import { HlmBadgeImports } from "@spartan-ng/helm/badge";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { cellPreview } from "./firestore-value.utils";

@Component({
  selector: "fk-firestore-value-cell",
  standalone: true,
  imports: [HlmButtonImports, HlmBadgeImports],
  template: `
    @if (preview().expandable) {
      <button
        hlmBtn
        variant="ghost"
        size="sm"
        class="hover:bg-muted/40 h-auto min-h-8 w-full min-w-0 max-w-full justify-start gap-2 px-1 py-1 text-left font-normal"
        type="button"
        (click)="onOpenDocument($event)"
      >
        @if (preview().badge) {
          <span
            hlmBadge
            variant="outline"
            class="shrink-0 font-mono text-[10px]"
          >
            {{ preview().badge }}
          </span>
        }
        <span class="truncate font-mono text-xs">{{ preview().text }}</span>
      </button>
    } @else if (preview().kind === "boolean") {
      <span
        hlmBadge
        [variant]="value() ? 'default' : 'secondary'"
        class="font-mono text-xs"
      >
        {{ preview().text }}
      </span>
    } @else if (preview().kind === "null") {
      <span class="text-muted-foreground text-xs">—</span>
    } @else {
      <span
        class="block min-w-0 truncate font-mono text-xs"
        [title]="displayTitle()"
      >
        {{ preview().text }}
      </span>
    }
  `,
})
export class FirestoreValueCellComponent {
  readonly value = input.required<unknown>();
  readonly field = input.required<string>();
  readonly docId = input.required<string>();
  readonly docPath = input.required<string>();

  readonly openDocument = output<string>();

  preview = () => cellPreview(this.value());

  displayTitle(): string {
    const v = this.value();
    return typeof v === "string" ? v : this.preview().text;
  }

  onOpenDocument(event: Event): void {
    event.stopPropagation();
    this.openDocument.emit(this.docPath());
  }
}
