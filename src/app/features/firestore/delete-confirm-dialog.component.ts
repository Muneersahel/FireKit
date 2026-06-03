import { Component, input, output } from "@angular/core";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";

@Component({
  selector: "fk-delete-confirm-dialog",
  standalone: true,
  imports: [HlmButtonImports, HlmSpinnerImports],
  template: `
    @if (open()) {
      <div
        class="fk-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="dialogTitleId"
        [attr.aria-describedby]="dialogDescId"
      >
        <button
          type="button"
          class="fk-confirm-dialog__backdrop"
          aria-label="Cancel"
          [disabled]="busy()"
          (click)="cancel.emit()"
        ></button>

        <div class="fk-confirm-dialog__panel">
          <h3 [id]="dialogTitleId" class="fk-confirm-dialog__title">
            {{ title() }}
          </h3>
          <p [id]="dialogDescId" class="fk-confirm-dialog__message">
            {{ message() }}
          </p>
          @if (detail()) {
            <p class="fk-confirm-dialog__detail" [title]="detail()">
              {{ detail() }}
            </p>
          }
          <div class="fk-confirm-dialog__actions">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              [disabled]="busy()"
              (click)="cancel.emit()"
            >
              Cancel
            </button>
            <button
              hlmBtn
              variant="destructive"
              size="sm"
              type="button"
              [disabled]="busy()"
              (click)="confirm.emit()"
            >
              @if (busy()) {
                <hlm-spinner class="mr-2 size-4" />
              }
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DeleteConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input("Delete document?");
  readonly message = input(
    "This will permanently remove the document from Firestore. This action cannot be undone.",
  );
  readonly detail = input("");
  readonly confirmLabel = input("Delete document");
  readonly busy = input(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected readonly dialogTitleId = "fk-delete-dialog-title";
  protected readonly dialogDescId = "fk-delete-dialog-desc";
}
