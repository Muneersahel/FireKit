import { safeStorage } from "electron";
import keytar from "keytar";

const SERVICE = "FireKit";
const ACCOUNT_PREFIX = "service-account:";

export class CredentialDecryptError extends Error {
  constructor(_projectId: string) {
    super(
      "Could not read saved credentials for this project. Open Settings, remove the project, and add it again with your service account JSON.",
    );
    this.name = "CredentialDecryptError";
  }
}

function looksLikeServiceAccountJson(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

export async function storeSecret(
  projectId: string,
  json: string,
): Promise<void> {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(json);
    await keytar.setPassword(
      SERVICE,
      ACCOUNT_PREFIX + projectId,
      encrypted.toString("base64"),
    );
    return;
  }
  await keytar.setPassword(SERVICE, ACCOUNT_PREFIX + projectId, json);
}

export async function getSecret(projectId: string): Promise<string | null> {
  const stored = await keytar.getPassword(SERVICE, ACCOUNT_PREFIX + projectId);
  if (!stored) return null;

  if (looksLikeServiceAccountJson(stored)) {
    return stored;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new CredentialDecryptError(projectId);
  }

  try {
    const decrypted = safeStorage.decryptString(Buffer.from(stored, "base64"));
    if (!looksLikeServiceAccountJson(decrypted)) {
      throw new CredentialDecryptError(projectId);
    }
    return decrypted;
  } catch (e) {
    if (e instanceof CredentialDecryptError) throw e;
    throw new CredentialDecryptError(projectId);
  }
}

export async function deleteSecret(projectId: string): Promise<void> {
  await keytar.deletePassword(SERVICE, ACCOUNT_PREFIX + projectId);
}
