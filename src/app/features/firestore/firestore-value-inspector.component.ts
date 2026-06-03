import { Component, input, output, signal } from "@angular/core";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmSeparatorImports } from "@spartan-ng/helm/separator";
import { FirestoreValueTreeComponent } from "./firestore-value-tree.component";
import {
  formatJson,
  type FirestoreInspectContext,
} from "./firestore-value.utils";

@Component({
  selector: "fk-firestore-value-inspector",
  standalone: true,
  imports: [HlmButtonImports, HlmSeparatorImports, FirestoreValueTreeComponent],
  template: `
    <div class="flex h-full flex-col">
      <div class="flex items-start justify-between gap-3 p-4 pb-0">
        <div class="min-w-0 flex-1">
          <p class="text-muted-foreground text-xs font-medium uppercase">
            Field value
          </p>
          <h3 class="truncate font-mono text-sm font-semibold">
            {{ context().field }}
          </h3>
          <p class="text-muted-foreground mt-1 truncate font-mono text-xs">
            {{ context().docId }}
          </p>
        </div>
        <button
          hlmBtn
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Close inspector"
          (click)="close.emit()"
        >
          ✕
        </button>
      </div>

      <div class="flex-1 space-y-4 overflow-auto p-4">
        <section>
          <p class="text-muted-foreground mb-2 text-xs font-medium uppercase">
            Structured
          </p>
          <fk-firestore-value-tree
            [nodeKey]="context().field"
            [value]="context().value"
          />
        </section>

        <div hlmSeparator></div>

        <section>
          <div class="mb-2 flex items-center justify-between gap-2">
            <p class="text-muted-foreground text-xs font-medium uppercase">
              Raw JSON
            </p>
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              (click)="copyJson()"
            >
              {{ copied() ? "Copied" : "Copy" }}
            </button>
          </div>
          <pre
            class="bg-muted/30 border-border max-h-64 overflow-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
            >{{ json() }}</pre
          >
        </section>
      </div>

      <div class="border-border border-t p-4">
        <button
          hlmBtn
          variant="outline"
          class="w-full"
          size="sm"
          type="button"
          (click)="openDocument.emit(context().docPath)"
        >
          Open full document
        </button>
      </div>
    </div>
  `,
})
export class FirestoreValueInspectorComponent {
  readonly context = input.required<FirestoreInspectContext>();
  readonly close = output<void>();
  readonly openDocument = output<string>();

  readonly copied = signal(false);

  json = () => formatJson(this.context().value);

  async copyJson(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.json());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }
}
