import { Injectable } from "@angular/core";

const STORAGE_PREFIX = "firekit:collections:";

/** Per-project Firestore root collection list (memory + localStorage). */
@Injectable({ providedIn: "root" })
export class FirestoreCollectionsCacheService {
  private readonly memory = new Map<string, string[]>();

  /** Returns cached names, or `null` if this project has never been cached. */
  get(projectId: string): string[] | null {
    const mem = this.memory.get(projectId);
    if (mem !== undefined) return [...mem];

    if (typeof localStorage === "undefined") return null;

    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + projectId);
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (
        !Array.isArray(parsed) ||
        !parsed.every((x) => typeof x === "string")
      ) {
        return null;
      }
      const cols = parsed as string[];
      this.memory.set(projectId, cols);
      return [...cols];
    } catch {
      return null;
    }
  }

  set(projectId: string, collections: string[]): void {
    const cols = [...collections];
    this.memory.set(projectId, cols);
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_PREFIX + projectId, JSON.stringify(cols));
    } catch {
      /* quota / private mode */
    }
  }

  clear(projectId: string): void {
    this.memory.delete(projectId);
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + projectId);
    } catch {
      /* ignore */
    }
  }
}

export function collectionListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
