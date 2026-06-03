import { app } from "electron";
import fs from "fs/promises";
import path from "path";
import type { ProjectMeta } from "../../shared/ipc";

interface StoreFile {
  projects: ProjectMeta[];
  activeProjectId: string | null;
}

const fileName = "projects.json";

function storePath(): string {
  return path.join(app.getPath("userData"), fileName);
}

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await fs.readFile(storePath(), "utf-8");
    return JSON.parse(raw) as StoreFile;
  } catch {
    return { projects: [], activeProjectId: null };
  }
}

async function writeStore(data: StoreFile): Promise<void> {
  await fs.mkdir(path.dirname(storePath()), { recursive: true });
  await fs.writeFile(storePath(), JSON.stringify(data, null, 2), "utf-8");
}

export async function listProjects(): Promise<StoreFile> {
  return readStore();
}

export async function addProject(meta: ProjectMeta): Promise<ProjectMeta> {
  const store = await readStore();
  if (store.projects.some((p) => p.id === meta.id)) {
    throw new Error("Project already exists");
  }
  store.projects.push(meta);
  if (!store.activeProjectId) {
    store.activeProjectId = meta.id;
  }
  await writeStore(store);
  return meta;
}

export async function removeProject(projectId: string): Promise<void> {
  const store = await readStore();
  store.projects = store.projects.filter((p) => p.id !== projectId);
  if (store.activeProjectId === projectId) {
    store.activeProjectId = store.projects[0]?.id ?? null;
  }
  await writeStore(store);
}

export async function setActiveProject(projectId: string): Promise<void> {
  const store = await readStore();
  if (!store.projects.some((p) => p.id === projectId)) {
    throw new Error("Unknown project");
  }
  store.activeProjectId = projectId;
  await writeStore(store);
}

export async function getActiveProjectId(): Promise<string | null> {
  const store = await readStore();
  return store.activeProjectId;
}
