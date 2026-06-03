export type FirestorePathSegment =
  | { kind: "collection"; label: string; collectionPath: string }
  | { kind: "document"; label: string; documentPath: string };

export function parsePathSegments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** Breadcrumb segments for a collection path (col/doc/col/…). */
export function collectionPathBreadcrumbs(
  collectionPath: string,
): FirestorePathSegment[] {
  const parts = parsePathSegments(collectionPath);
  const segments: FirestorePathSegment[] = [];
  for (let i = 0; i < parts.length; i++) {
    const slice = parts.slice(0, i + 1).join("/");
    if (i % 2 === 0) {
      segments.push({
        kind: "collection",
        label: parts[i],
        collectionPath: slice,
      });
    } else {
      segments.push({
        kind: "document",
        label: parts[i],
        documentPath: slice,
      });
    }
  }
  return segments;
}

export function isRootCollectionPath(collectionPath: string): boolean {
  return !collectionPath.includes("/");
}

export function rootCollectionId(collectionPath: string): string {
  return parsePathSegments(collectionPath)[0] ?? collectionPath;
}

/** Parent collection path, or null at project root. */
export function parentCollectionPath(collectionPath: string): string | null {
  const parts = parsePathSegments(collectionPath);
  if (parts.length <= 1) return null;
  return parts.slice(0, -2).join("/");
}

export function buildSubcollectionPath(
  collectionPath: string,
  documentId: string,
  subcollectionId: string,
): string {
  return `${collectionPath}/${documentId}/${subcollectionId}`;
}

export function documentIdFromPath(documentPath: string): string {
  const parts = parsePathSegments(documentPath);
  return parts[parts.length - 1] ?? documentPath;
}

/** Collection that contains the given document. */
export function collectionPathFromDocumentPath(documentPath: string): string {
  const parts = parsePathSegments(documentPath);
  if (parts.length <= 1) return parts[0] ?? "";
  return parts.slice(0, -1).join("/");
}

/** Breadcrumb trail for collection view or document page. */
export function firestoreBreadcrumbs(
  collectionPath: string,
  activeDocumentPath?: string | null,
): FirestorePathSegment[] {
  const docPath = activeDocumentPath?.trim();
  const collPath = docPath
    ? collectionPathFromDocumentPath(docPath)
    : collectionPath;
  const crumbs = collectionPathBreadcrumbs(collPath);

  if (!docPath) return crumbs;

  const docId = documentIdFromPath(docPath);
  const last = crumbs[crumbs.length - 1];
  if (last?.kind === "document" && last.documentPath === docPath) {
    return crumbs;
  }
  return [...crumbs, { kind: "document", label: docId, documentPath: docPath }];
}
