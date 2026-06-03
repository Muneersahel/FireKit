import { Injectable, inject, signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { FS_ROUTE_COLLECTION, FS_ROUTE_DOCUMENT } from "./firestore-nav.utils";
import { collectionPathFromDocumentPath } from "./firestore-path.utils";

@Injectable({ providedIn: "root" })
export class FirestoreNavService {
  private readonly router = inject(Router);

  readonly collectionPath = signal("");
  readonly documentPath = signal<string | null>(null);

  constructor() {
    this.syncFromUrl(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.syncFromUrl(e.urlAfterRedirects));
  }

  syncFromUrl(url: string): void {
    const path = url.split("?")[0];
    const docMatch = path.match(
      new RegExp(`^/firestore/${FS_ROUTE_DOCUMENT}/(.+)$`),
    );
    if (docMatch) {
      const docPath = docMatch[1];
      this.documentPath.set(docPath);
      this.collectionPath.set(collectionPathFromDocumentPath(docPath));
      return;
    }
    const colMatch = path.match(
      new RegExp(`^/firestore/${FS_ROUTE_COLLECTION}/(.+)$`),
    );
    if (colMatch) {
      this.documentPath.set(null);
      this.collectionPath.set(colMatch[1]);
      return;
    }
    this.documentPath.set(null);
    this.collectionPath.set("");
  }

  navigateToCollection(collectionPath: string): void {
    if (!collectionPath.trim()) {
      void this.router.navigate(["/firestore"]);
      return;
    }
    void this.router.navigate([
      "/firestore",
      FS_ROUTE_COLLECTION,
      ...collectionPath.split("/").filter(Boolean),
    ]);
  }

  navigateToDocument(documentPath: string, isNew = false): void {
    void this.router.navigate(
      [
        "/firestore",
        FS_ROUTE_DOCUMENT,
        ...documentPath.split("/").filter(Boolean),
      ],
      isNew ? { queryParams: { new: "1" } } : {},
    );
  }
}
