import { ipcMain } from "electron";
import type FirebaseFirestore from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";
import type {
  FirestoreDeletePayload,
  FirestoreDocumentDto,
  FirestoreFilter,
  FirestoreGetPayload,
  FirestoreListCollectionsPayload,
  FirestoreListDocumentsPayload,
  FirestoreListSubcollectionsPayload,
  FirestoreQueryPayload,
  FirestoreUpsertPayload,
} from "../../shared/ipc";
import { IPC } from "../../shared/ipc";
import { getFirestore } from "../firebase/admin";

function toDto(
  id: string,
  path: string,
  data: FirebaseFirestore.DocumentData,
  createTime?: FirebaseFirestore.Timestamp,
  updateTime?: FirebaseFirestore.Timestamp,
): FirestoreDocumentDto {
  return {
    id,
    path,
    data: data as Record<string, unknown>,
    createTime: createTime?.toDate().toISOString(),
    updateTime: updateTime?.toDate().toISOString(),
  };
}

function applyFilters(
  base: FirebaseFirestore.Query,
  filters: FirestoreFilter[] | undefined,
): FirebaseFirestore.Query {
  let q = base;
  for (const f of filters ?? []) {
    q = q.where(f.field, f.op as FirebaseFirestore.WhereFilterOp, f.value);
  }
  return q;
}

export function registerFirestoreIpc(): void {
  ipcMain.handle(
    IPC.firestore.listCollections,
    async (_e, payload: FirestoreListCollectionsPayload) => {
      const db = await getFirestore(payload.projectId);
      const cols = await db.listCollections();
      return cols.map((c) => c.id);
    },
  );

  ipcMain.handle(
    IPC.firestore.listSubcollections,
    async (_e, payload: FirestoreListSubcollectionsPayload) => {
      const db = await getFirestore(payload.projectId);
      const cols = await db.doc(payload.documentPath).listCollections();
      return cols.map((c) => c.id);
    },
  );

  ipcMain.handle(
    IPC.firestore.listDocuments,
    async (_e, payload: FirestoreListDocumentsPayload) => {
      const db = await getFirestore(payload.projectId);
      const limit = payload.limit ?? 100;
      const snap = await db
        .collection(payload.collectionPath)
        .limit(limit)
        .get();
      return snap.docs.map((d) =>
        toDto(d.id, d.ref.path, d.data(), d.createTime, d.updateTime),
      );
    },
  );

  ipcMain.handle(
    IPC.firestore.query,
    async (_e, payload: FirestoreQueryPayload) => {
      const db = await getFirestore(payload.projectId);
      let q: FirebaseFirestore.Query = db.collection(payload.collectionPath);

      if (payload.orderBy) {
        q = q.orderBy(payload.orderBy.field, payload.orderBy.direction);
      } else {
        q = q.orderBy(FieldPath.documentId());
      }

      q = applyFilters(q, payload.filters);

      if (payload.startAfterId) {
        const cursor = db
          .collection(payload.collectionPath)
          .doc(payload.startAfterId);
        const cursorSnap = await cursor.get();
        if (cursorSnap.exists) {
          q = q.startAfter(cursorSnap);
        }
      }

      const snap = await q.limit(payload.limit + 1).get();
      const hasMore = snap.size > payload.limit;
      const docs = snap.docs.slice(0, payload.limit);

      return {
        documents: docs.map((d) =>
          toDto(d.id, d.ref.path, d.data(), d.createTime, d.updateTime),
        ),
        hasMore,
        lastId: docs.length ? docs[docs.length - 1].id : null,
      };
    },
  );

  ipcMain.handle(
    IPC.firestore.get,
    async (_e, payload: FirestoreGetPayload) => {
      const db = await getFirestore(payload.projectId);
      const snap = await db.doc(payload.documentPath).get();
      if (!snap.exists) return null;
      return toDto(
        snap.id,
        snap.ref.path,
        snap.data() ?? {},
        snap.createTime,
        snap.updateTime,
      );
    },
  );

  ipcMain.handle(
    IPC.firestore.upsert,
    async (_e, payload: FirestoreUpsertPayload) => {
      const db = await getFirestore(payload.projectId);
      await db
        .doc(payload.documentPath)
        .set(payload.data, { merge: payload.merge ?? false });
    },
  );

  ipcMain.handle(
    IPC.firestore.delete,
    async (_e, payload: FirestoreDeletePayload) => {
      const db = await getFirestore(payload.projectId);
      await db.doc(payload.documentPath).delete();
    },
  );
}
