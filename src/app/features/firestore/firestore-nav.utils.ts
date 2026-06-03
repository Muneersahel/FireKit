/** Route prefix segments under /firestore. */
export const FS_ROUTE_COLLECTION = "c";
export const FS_ROUTE_DOCUMENT = "d";

export function collectionRouteSegments(collectionPath: string): string[] {
  if (!collectionPath) return [];
  return collectionPath.split("/").filter(Boolean);
}

export function documentRouteSegments(documentPath: string): string[] {
  return documentPath.split("/").filter(Boolean);
}

export function collectionPathFromRouteSegments(segments: string[]): string {
  return segments.filter(Boolean).join("/");
}

export function documentPathFromRouteSegments(segments: string[]): string {
  return segments.filter(Boolean).join("/");
}

export function collectionNavigateCommands(
  collectionPath: string,
): (string | { new?: string })[] {
  const segments = collectionRouteSegments(collectionPath);
  if (!segments.length) return ["/firestore"];
  return ["/firestore", FS_ROUTE_COLLECTION, ...segments];
}
