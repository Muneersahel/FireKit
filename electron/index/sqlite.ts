import Database from "better-sqlite3";
import { app, BrowserWindow } from "electron";
import type FirebaseFirestore from "firebase-admin/firestore";
import path from "path";
import type {
  IndexProgressEvent,
  IndexSearchHit,
  IndexSearchResult,
} from "../../shared/ipc";
import { getFirestore } from "../firebase/admin";

let db: Database.Database | null = null;

const syncJobs = new Map<
  string,
  { abort: AbortController; syncing: boolean }
>();

function jobKey(projectId: string, collectionPath: string): string {
  return `${projectId}::${collectionPath}`;
}

function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath("userData"), "firekit-index.db");
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS doc_index (
        project_id TEXT NOT NULL,
        collection_path TEXT NOT NULL,
        doc_id TEXT NOT NULL,
        updated_at INTEGER,
        body_json TEXT NOT NULL,
        search_text TEXT NOT NULL,
        PRIMARY KEY (project_id, collection_path, doc_id)
      );
      CREATE INDEX IF NOT EXISTS idx_search ON doc_index(project_id, collection_path);
      CREATE TABLE IF NOT EXISTS sync_meta (
        project_id TEXT NOT NULL,
        collection_path TEXT NOT NULL,
        last_sync_at INTEGER,
        indexed_count INTEGER,
        PRIMARY KEY (project_id, collection_path)
      );
    `);
  }
  return db;
}

function flattenForSearch(data: Record<string, unknown>): string {
  return JSON.stringify(data).toLowerCase();
}

function emitProgress(
  win: BrowserWindow | null,
  event: IndexProgressEvent,
): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send("index:progress", event);
  }
}

export function getSyncStatus(projectId: string, collectionPath: string) {
  const row = getDb()
    .prepare(
      `SELECT last_sync_at, indexed_count FROM sync_meta WHERE project_id = ? AND collection_path = ?`,
    )
    .get(projectId, collectionPath) as
    | { last_sync_at: number | null; indexed_count: number }
    | undefined;

  const key = jobKey(projectId, collectionPath);
  const job = syncJobs.get(key);

  return {
    syncing: job?.syncing ?? false,
    indexedCount: row?.indexed_count ?? 0,
    lastSyncAt: row?.last_sync_at ?? null,
    error: null as string | null,
  };
}

export async function startSync(
  projectId: string,
  collectionPath: string,
  full: boolean,
  win: BrowserWindow | null,
): Promise<void> {
  const key = jobKey(projectId, collectionPath);
  const existing = syncJobs.get(key);
  if (existing?.syncing) return;

  const abort = new AbortController();
  syncJobs.set(key, { abort, syncing: true });

  const database = getDb();
  const upsert = database.prepare(`
    INSERT INTO doc_index (project_id, collection_path, doc_id, updated_at, body_json, search_text)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id, collection_path, doc_id) DO UPDATE SET
      updated_at = excluded.updated_at,
      body_json = excluded.body_json,
      search_text = excluded.search_text
  `);

  if (full) {
    database
      .prepare(
        `DELETE FROM doc_index WHERE project_id = ? AND collection_path = ?`,
      )
      .run(projectId, collectionPath);
  }

  let indexed = 0;
  try {
    const firestore = await getFirestore(projectId);
    let query: FirebaseFirestore.Query = firestore
      .collection(collectionPath)
      .orderBy("__name__")
      .limit(200);

    while (!abort.signal.aborted) {
      const snap = await query.get();
      if (snap.empty) break;

      for (const doc of snap.docs) {
        const data = doc.data() as Record<string, unknown>;
        const updatedAt = doc.updateTime?.toMillis?.() ?? Date.now();
        upsert.run(
          projectId,
          collectionPath,
          doc.id,
          updatedAt,
          JSON.stringify(data),
          flattenForSearch(data),
        );
        indexed++;
      }

      emitProgress(win, { projectId, collectionPath, indexed, done: false });
      const last = snap.docs[snap.docs.length - 1];
      query = firestore
        .collection(collectionPath)
        .orderBy("__name__")
        .startAfter(last)
        .limit(200);
      if (snap.size < 200) break;
    }

    database
      .prepare(
        `INSERT INTO sync_meta (project_id, collection_path, last_sync_at, indexed_count)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(project_id, collection_path) DO UPDATE SET
           last_sync_at = excluded.last_sync_at,
           indexed_count = excluded.indexed_count`,
      )
      .run(projectId, collectionPath, Date.now(), indexed);

    emitProgress(win, { projectId, collectionPath, indexed, done: true });
  } catch (e) {
    emitProgress(win, {
      projectId,
      collectionPath,
      indexed,
      done: true,
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  } finally {
    syncJobs.set(key, { abort, syncing: false });
  }
}

export function searchIndex(
  projectId: string,
  collectionPath: string,
  query: string,
  limit: number,
  offset: number,
): IndexSearchResult {
  const q = `%${query.toLowerCase()}%`;
  const database = getDb();
  const total = (
    database
      .prepare(
        `SELECT COUNT(*) as c FROM doc_index
         WHERE project_id = ? AND collection_path = ? AND search_text LIKE ?`,
      )
      .get(projectId, collectionPath, q) as { c: number }
  ).c;

  const rows = database
    .prepare(
      `SELECT doc_id, body_json FROM doc_index
       WHERE project_id = ? AND collection_path = ? AND search_text LIKE ?
       ORDER BY doc_id LIMIT ? OFFSET ?`,
    )
    .all(projectId, collectionPath, q, limit, offset) as {
    doc_id: string;
    body_json: string;
  }[];

  const hits: IndexSearchHit[] = rows.map((r) => {
    const data = JSON.parse(r.body_json) as Record<string, unknown>;
    return {
      docId: r.doc_id,
      path: `${collectionPath}/${r.doc_id}`,
      snippet: r.body_json.slice(0, 200),
      data,
    };
  });

  return { hits, total };
}

export function clearIndex(projectId: string, collectionPath: string): void {
  const database = getDb();
  database
    .prepare(
      `DELETE FROM doc_index WHERE project_id = ? AND collection_path = ?`,
    )
    .run(projectId, collectionPath);
  database
    .prepare(
      `DELETE FROM sync_meta WHERE project_id = ? AND collection_path = ?`,
    )
    .run(projectId, collectionPath);
}
