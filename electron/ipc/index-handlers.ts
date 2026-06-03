import { BrowserWindow, ipcMain } from "electron";
import type {
  IndexClearPayload,
  IndexSearchPayload,
  IndexSyncStartPayload,
  IndexSyncStatusPayload,
} from "../../shared/ipc";
import { IPC } from "../../shared/ipc";
import * as sqliteIndex from "../index/sqlite";

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null;
}

export function registerIndexIpc(): void {
  ipcMain.handle(
    IPC.index.syncStart,
    async (_e, payload: IndexSyncStartPayload) => {
      void sqliteIndex.startSync(
        payload.projectId,
        payload.collectionPath,
        payload.full ?? false,
        getMainWindow(),
      );
    },
  );

  ipcMain.handle(
    IPC.index.syncStatus,
    async (_e, payload: IndexSyncStatusPayload) => {
      return sqliteIndex.getSyncStatus(
        payload.projectId,
        payload.collectionPath,
      );
    },
  );

  ipcMain.handle(IPC.index.search, async (_e, payload: IndexSearchPayload) => {
    return sqliteIndex.searchIndex(
      payload.projectId,
      payload.collectionPath,
      payload.query,
      payload.limit,
      payload.offset,
    );
  });

  ipcMain.handle(IPC.index.clear, async (_e, payload: IndexClearPayload) => {
    sqliteIndex.clearIndex(payload.projectId, payload.collectionPath);
  });
}
