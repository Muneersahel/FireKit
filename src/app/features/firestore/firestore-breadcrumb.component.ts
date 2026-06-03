import { Component, computed, inject } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideChevronRight, lucideDatabase } from "@ng-icons/lucide";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { FirestoreNavService } from "./firestore-nav.service";
import { firestoreBreadcrumbs } from "./firestore-path.utils";

@Component({
  selector: "fk-firestore-breadcrumb",
  standalone: true,
  imports: [HlmIconImports],
  providers: [provideIcons({ lucideChevronRight, lucideDatabase })],
  template: `
    <nav class="fk-fs-breadcrumb" aria-label="Firestore path">
      <button
        type="button"
        class="fk-fs-breadcrumb__root"
        (click)="goFirestore()"
      >
        <ng-icon hlm name="lucideDatabase" size="sm" />
        <span>Firestore</span>
      </button>

      @for (seg of segments(); track seg.kind + seg.label; let last = $last) {
        <ng-icon
          hlm
          name="lucideChevronRight"
          size="sm"
          class="fk-fs-breadcrumb__sep"
          aria-hidden="true"
        />
        @if (!last) {
          @if (seg.kind === "collection") {
            <button
              type="button"
              class="fk-fs-breadcrumb__link"
              (click)="goCollection(seg.collectionPath)"
            >
              {{ seg.label }}
            </button>
          } @else {
            <button
              type="button"
              class="fk-fs-breadcrumb__link fk-fs-breadcrumb__link--doc"
              (click)="goDocument(seg.documentPath)"
            >
              {{ seg.label }}
            </button>
          }
        } @else {
          <span
            class="fk-fs-breadcrumb__current"
            [class.fk-fs-breadcrumb__current--doc]="seg.kind === 'document'"
            >{{ seg.label }}</span
          >
        }
      }
    </nav>
  `,
})
export class FirestoreBreadcrumbComponent {
  private readonly nav = inject(FirestoreNavService);

  readonly segments = computed(() =>
    firestoreBreadcrumbs(this.nav.collectionPath(), this.nav.documentPath()),
  );

  goFirestore(): void {
    this.nav.navigateToCollection("");
  }

  goCollection(path: string): void {
    this.nav.navigateToCollection(path);
  }

  goDocument(path: string): void {
    this.nav.navigateToDocument(path);
  }
}
