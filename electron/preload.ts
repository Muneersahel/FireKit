import { contextBridge, ipcRenderer } from "electron";
import type { FirekitApi } from "../shared/ipc";
import { IPC } from "../shared/ipc";

const api: FirekitApi = {
  projects: {
    list: () => ipcRenderer.invoke(IPC.projects.list),
    add: (payload) => ipcRenderer.invoke(IPC.projects.add, payload),
    remove: (projectId) => ipcRenderer.invoke(IPC.projects.remove, projectId),
    setActive: (projectId) =>
      ipcRenderer.invoke(IPC.projects.setActive, projectId),
    getActive: () => ipcRenderer.invoke(IPC.projects.getActive),
    testConnection: (payload) =>
      ipcRenderer.invoke(IPC.projects.testConnection, payload),
  },
  firestore: {
    listCollections: (payload) =>
      ipcRenderer.invoke(IPC.firestore.listCollections, payload),
    listSubcollections: (payload) =>
      ipcRenderer.invoke(IPC.firestore.listSubcollections, payload),
    listDocuments: (payload) =>
      ipcRenderer.invoke(IPC.firestore.listDocuments, payload),
    query: (payload) => ipcRenderer.invoke(IPC.firestore.query, payload),
    get: (payload) => ipcRenderer.invoke(IPC.firestore.get, payload),
    upsert: (payload) => ipcRenderer.invoke(IPC.firestore.upsert, payload),
    delete: (payload) => ipcRenderer.invoke(IPC.firestore.delete, payload),
  },
  index: {
    syncStart: (payload) => ipcRenderer.invoke(IPC.index.syncStart, payload),
    syncStatus: (payload) => ipcRenderer.invoke(IPC.index.syncStatus, payload),
    search: (payload) => ipcRenderer.invoke(IPC.index.search, payload),
    clear: (payload) => ipcRenderer.invoke(IPC.index.clear, payload),
    onProgress: (callback) => {
      const listener = (_: unknown, event: unknown) =>
        callback(event as Parameters<typeof callback>[0]);
      ipcRenderer.on(IPC.index.progress, listener);
      return () => ipcRenderer.removeListener(IPC.index.progress, listener);
    },
  },
  auth: {
    listUsers: (payload) => ipcRenderer.invoke(IPC.auth.listUsers, payload),
    getUser: (payload) => ipcRenderer.invoke(IPC.auth.getUser, payload),
    getUserByEmail: (payload) =>
      ipcRenderer.invoke(IPC.auth.getUserByEmail, payload),
    createUser: (payload) => ipcRenderer.invoke(IPC.auth.createUser, payload),
    deleteUser: (payload) => ipcRenderer.invoke(IPC.auth.deleteUser, payload),
    setDisabled: (payload) => ipcRenderer.invoke(IPC.auth.setDisabled, payload),
  },
  window: {
    getChrome: () => ipcRenderer.invoke(IPC.window.getChrome),
    minimize: () => ipcRenderer.invoke(IPC.window.minimize),
    maximize: () => ipcRenderer.invoke(IPC.window.maximize),
    close: () => ipcRenderer.invoke(IPC.window.close),
  },
  app: {
    onNavigate: (callback) => {
      const listener = (_: unknown, route: string) => callback(route);
      ipcRenderer.on(IPC.app.navigate, listener);
      return () => ipcRenderer.removeListener(IPC.app.navigate, listener);
    },
  },
};

contextBridge.exposeInMainWorld("firekit", api);
