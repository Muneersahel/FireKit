import * as admin from "firebase-admin";
import { CredentialDecryptError, getSecret } from "../secrets/keychain";

function parseServiceAccountJson(
  json: string,
  projectId: string,
): admin.ServiceAccount {
  try {
    return JSON.parse(json) as admin.ServiceAccount;
  } catch {
    throw new CredentialDecryptError(projectId);
  }
}

const apps = new Map<string, admin.app.App>();
const initInflight = new Map<string, Promise<admin.app.App>>();

function isAppAlreadyExistsError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const err = e as { code?: string; errorInfo?: { code?: string } };
  const code = err.errorInfo?.code ?? err.code;
  return code === "app/invalid-app-options" || code === "app/duplicate-app";
}

function reuseGlobalApp(projectId: string): admin.app.App | undefined {
  return admin.apps.find((a) => a?.name === projectId) ?? undefined;
}

function initializeOrReuse(
  projectId: string,
  credential: admin.credential.Credential,
): admin.app.App {
  try {
    return admin.initializeApp({ credential }, projectId);
  } catch (e) {
    if (isAppAlreadyExistsError(e)) {
      const existing = reuseGlobalApp(projectId);
      if (existing) return existing;
      return admin.app(projectId);
    }
    throw e;
  }
}

export async function getAdminApp(projectId: string): Promise<admin.app.App> {
  const cached = apps.get(projectId);
  if (cached) return cached;

  const global = reuseGlobalApp(projectId);
  if (global) {
    apps.set(projectId, global);
    return global;
  }

  const inflight = initInflight.get(projectId);
  if (inflight) return inflight;

  const promise = (async () => {
    const existing = reuseGlobalApp(projectId);
    if (existing) {
      apps.set(projectId, existing);
      return existing;
    }

    const json = await getSecret(projectId);
    if (!json) {
      throw new Error(`No credentials for project ${projectId}`);
    }

    const credential = admin.credential.cert(
      parseServiceAccountJson(json, projectId),
    );
    const app = initializeOrReuse(projectId, credential);
    apps.set(projectId, app);
    return app;
  })();

  initInflight.set(projectId, promise);
  try {
    return await promise;
  } finally {
    initInflight.delete(projectId);
  }
}

export async function getFirestore(projectId: string) {
  const app = await getAdminApp(projectId);
  return admin.firestore(app);
}

export async function getAuth(projectId: string) {
  const app = await getAdminApp(projectId);
  return admin.auth(app);
}

function projectIdFromServiceAccount(
  sa: admin.ServiceAccount & { project_id?: string },
): string | undefined {
  return sa.projectId ?? sa.project_id;
}

export async function testConnection(
  serviceAccountJson: string,
): Promise<{ ok: boolean; projectId?: string; error?: string }> {
  try {
    const sa = JSON.parse(serviceAccountJson) as admin.ServiceAccount & {
      project_id?: string;
    };
    const projectId = projectIdFromServiceAccount(sa);
    const tempName = `test-${Date.now()}`;
    const app = admin.initializeApp(
      { credential: admin.credential.cert(sa) },
      tempName,
    );
    await admin.firestore(app).listCollections();
    await admin.app(tempName).delete();
    return { ok: true, projectId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function removeAdminApp(projectId: string): Promise<void> {
  const app = apps.get(projectId);
  if (app) {
    await app.delete();
    apps.delete(projectId);
  }
  try {
    await admin.app(projectId).delete();
  } catch {
    /* not initialized */
  }
}
