import { randomUUID } from "crypto";
import { ipcMain } from "electron";
import type {
  AddProjectPayload,
  TestConnectionPayload,
} from "../../shared/ipc";
import { IPC } from "../../shared/ipc";
import { removeAdminApp, testConnection } from "../firebase/admin";
import * as projectStore from "../projects/store";
import { deleteSecret, storeSecret } from "../secrets/keychain";

export function registerProjectsIpc(): void {
  ipcMain.handle(IPC.projects.list, async () => {
    const store = await projectStore.listProjects();
    return { projects: store.projects, activeProjectId: store.activeProjectId };
  });

  ipcMain.handle(IPC.projects.add, async (_e, payload: AddProjectPayload) => {
    const sa = JSON.parse(payload.serviceAccountJson) as { project_id: string };
    const id = randomUUID();
    const meta = {
      id,
      displayName: payload.displayName,
      projectId: sa.project_id,
      createdAt: Date.now(),
    };
    await storeSecret(id, payload.serviceAccountJson);
    return projectStore.addProject(meta);
  });

  ipcMain.handle(IPC.projects.remove, async (_e, projectId: string) => {
    await deleteSecret(projectId);
    await removeAdminApp(projectId);
    await projectStore.removeProject(projectId);
  });

  ipcMain.handle(IPC.projects.setActive, async (_e, projectId: string) => {
    await projectStore.setActiveProject(projectId);
  });

  ipcMain.handle(IPC.projects.getActive, async () => {
    return projectStore.getActiveProjectId();
  });

  ipcMain.handle(
    IPC.projects.testConnection,
    async (_e, payload: TestConnectionPayload) => {
      if (payload.serviceAccountJson) {
        return testConnection(payload.serviceAccountJson);
      }
      if (payload.projectId) {
        const { getFirestore } = await import("../firebase/admin");
        try {
          await getFirestore(payload.projectId);
          const store = await projectStore.listProjects();
          const p = store.projects.find((x) => x.id === payload.projectId);
          return { ok: true, projectId: p?.projectId };
        } catch (e) {
          return {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          };
        }
      }
      return { ok: false, error: "No credentials provided" };
    },
  );
}
