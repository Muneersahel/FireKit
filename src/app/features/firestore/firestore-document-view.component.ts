import { Component, OnInit, effect, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  FirestoreDocumentDrawerComponent,
  type DocumentDrawerState,
} from "./firestore-document-drawer.component";
import { FirestoreNavService } from "./firestore-nav.service";

@Component({
  selector: "fk-firestore-document-view",
  standalone: true,
  host: {
    class: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  },
  imports: [FirestoreDocumentDrawerComponent],
  template: `
    @if (docState(); as state) {
      <fk-firestore-document-drawer
        presentation="page"
        [drawer]="state"
        [collectionPath]="nav.collectionPath()"
        (close)="onClose()"
        (saved)="onSaved()"
        (browseCollection)="nav.navigateToCollection($event)"
      />
    }
  `,
})
export class FirestoreDocumentViewComponent implements OnInit {
  readonly nav = inject(FirestoreNavService);
  private readonly route = inject(ActivatedRoute);

  readonly docState = signal<DocumentDrawerState | null>(null);

  constructor() {
    effect(() => {
      const path = this.nav.documentPath();
      const isNew = this.route.snapshot.queryParamMap.get("new") === "1";
      if (path) {
        this.docState.set({ path, isNew });
      } else {
        this.docState.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(() => {
      const path = this.nav.documentPath();
      if (!path) return;
      this.docState.set({
        path,
        isNew: this.route.snapshot.queryParamMap.get("new") === "1",
      });
    });
  }

  onClose(): void {
    this.nav.navigateToCollection(this.nav.collectionPath());
  }

  onSaved(): void {
    this.nav.navigateToCollection(this.nav.collectionPath());
  }
}
