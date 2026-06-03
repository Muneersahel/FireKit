import { createId } from "@paralleldrive/cuid2";

/** Generates a collision-resistant Firestore document id (CUID2). */
export function createFirestoreDocumentId(): string {
  return createId();
}
