import { ipcMain } from "electron";
import type { UserRecord } from "firebase-admin/auth";
import type {
  AuthCreateUserPayload,
  AuthDeleteUserPayload,
  AuthGetUserByEmailPayload,
  AuthGetUserPayload,
  AuthListUsersPayload,
  AuthSetDisabledPayload,
  AuthUserDto,
} from "../../shared/ipc";
import { IPC } from "../../shared/ipc";
import { getAuth } from "../firebase/admin";

function toUserDto(user: UserRecord): AuthUserDto {
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    disabled: user.disabled,
    emailVerified: user.emailVerified,
    creationTime: user.metadata.creationTime,
    lastSignInTime: user.metadata.lastSignInTime ?? null,
    customClaims: (user.customClaims ?? {}) as Record<string, unknown>,
    providerIds: user.providerData.map((p) => p.providerId),
  };
}

export function registerAuthIpc(): void {
  ipcMain.handle(
    IPC.auth.listUsers,
    async (_e, payload: AuthListUsersPayload) => {
      const auth = await getAuth(payload.projectId);
      const result = await auth.listUsers(
        payload.maxResults,
        payload.pageToken,
      );
      return {
        users: result.users.map(toUserDto),
        pageToken: result.pageToken ?? null,
      };
    },
  );

  ipcMain.handle(IPC.auth.getUser, async (_e, payload: AuthGetUserPayload) => {
    const auth = await getAuth(payload.projectId);
    try {
      const user = await auth.getUser(payload.uid);
      return toUserDto(user);
    } catch {
      return null;
    }
  });

  ipcMain.handle(
    IPC.auth.getUserByEmail,
    async (_e, payload: AuthGetUserByEmailPayload) => {
      const auth = await getAuth(payload.projectId);
      try {
        const user = await auth.getUserByEmail(payload.email);
        return toUserDto(user);
      } catch {
        return null;
      }
    },
  );

  ipcMain.handle(
    IPC.auth.createUser,
    async (_e, payload: AuthCreateUserPayload) => {
      const auth = await getAuth(payload.projectId);
      const user = await auth.createUser({
        email: payload.email,
        password: payload.password,
        displayName: payload.displayName,
      });
      return toUserDto(user);
    },
  );

  ipcMain.handle(
    IPC.auth.deleteUser,
    async (_e, payload: AuthDeleteUserPayload) => {
      const auth = await getAuth(payload.projectId);
      await auth.deleteUser(payload.uid);
    },
  );

  ipcMain.handle(
    IPC.auth.setDisabled,
    async (_e, payload: AuthSetDisabledPayload) => {
      const auth = await getAuth(payload.projectId);
      await auth.updateUser(payload.uid, { disabled: payload.disabled });
    },
  );
}
