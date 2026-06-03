import { Component, input, output } from "@angular/core";
import type { FirestoreDocumentDto } from "@shared/ipc";
import { HlmSkeletonImports } from "@spartan-ng/helm/skeleton";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { HlmTableImports } from "@spartan-ng/helm/table";
import { FirestoreValueCellComponent } from "./firestore-value-cell.component";

@Component({
  selector: "fk-firestore-fields-table",
  standalone: true,
  imports: [
    HlmTableImports,
    HlmSpinnerImports,
    HlmSkeletonImports,
    FirestoreValueCellComponent,
  ],
  template: `
    <div
      class="fk-auth-table-panel relative flex min-h-0 flex-1 flex-col overflow-hidden"
      [attr.aria-busy]="initialLoading() || refreshing()"
    >
      @if (refreshing() && !initialLoading()) {
        <div class="fk-auth-table-loading" aria-live="polite">
          <div
            class="bg-card border-border flex items-center gap-2 rounded-lg border px-3 py-2 shadow-sm"
          >
            <hlm-spinner class="size-4" />
            <span class="text-sm">Loading documents…</span>
          </div>
        </div>
      }

      <div
        class="fk-fs-fields-scroll min-h-0 flex-1"
        [class.opacity-50]="refreshing() && !initialLoading()"
      >
        <table
          hlmTable
          class="fk-auth-table fk-fs-fields-table w-max min-w-full"
        >
          <colgroup>
            <col [style.width.px]="docIdColWidth" />
            @for (field of displayFields(); track field) {
              <col [style.width.px]="columnWidth(field)" />
            }
          </colgroup>
          <thead hlmTHead>
            <tr hlmTr>
              <th
                hlmTh
                class="fk-auth-th fk-auth-cell fk-fs-sticky-col fk-fs-field-header text-left"
              >
                Document ID
              </th>
              @for (field of displayFields(); track field) {
                <th
                  hlmTh
                  class="fk-auth-th fk-auth-cell fk-fs-field-header text-left"
                >
                  <span class="block truncate font-mono" [title]="field">{{
                    field
                  }}</span>
                </th>
              }
            </tr>
          </thead>
          <tbody hlmTBody>
            @if (initialLoading()) {
              @for (row of skeletonRows; track row) {
                <tr hlmTr class="fk-auth-skeleton-row">
                  <td hlmTd class="fk-auth-cell fk-fs-sticky-col">
                    <div hlmSkeleton class="h-3 w-24"></div>
                  </td>
                  @for (col of skeletonCols; track col) {
                    <td hlmTd class="fk-auth-cell">
                      <div hlmSkeleton class="h-3 w-20"></div>
                    </td>
                  }
                </tr>
              }
            } @else {
              @for (doc of documents(); track doc.id) {
                <tr
                  hlmTr
                  class="fk-fs-data-row cursor-pointer"
                  [class.fk-auth-row-selected]="highlightedDocId() === doc.id"
                  (click)="openDocument.emit(doc.path)"
                >
                  <td hlmTd class="fk-auth-cell fk-fs-sticky-col align-middle">
                    <span
                      class="block truncate font-mono text-xs font-medium"
                      [title]="doc.id"
                      >{{ doc.id }}</span
                    >
                  </td>
                  @for (field of displayFields(); track field) {
                    <td hlmTd class="fk-auth-cell min-w-0 align-middle">
                      @if (field === "__empty__") {
                        <span class="text-muted-foreground text-xs"
                          >No fields on this page</span
                        >
                      } @else {
                        <fk-firestore-value-cell
                          [value]="doc.data[field]"
                          [field]="field"
                          [docId]="doc.id"
                          [docPath]="doc.path"
                          (openDocument)="openDocument.emit($event)"
                        />
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class FirestoreFieldsTableComponent {
  readonly documents = input.required<FirestoreDocumentDto[]>();
  readonly fields = input.required<string[]>();
  readonly collectionPath = input("");
  readonly initialLoading = input(false);
  readonly refreshing = input(false);
  readonly highlightedDocId = input<string | null>(null);

  readonly openDocument = output<string>();

  protected readonly docIdColWidth = 200;
  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5, 6, 7];
  protected readonly skeletonCols = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  displayFields(): string[] {
    const fields = this.fields();
    return fields.length ? fields : ["__empty__"];
  }

  columnWidth(field: string): number {
    if (field === "__empty__") return 200;
    const estimated = field.length * 7 + 64;
    return Math.min(260, Math.max(140, estimated));
  }
}
