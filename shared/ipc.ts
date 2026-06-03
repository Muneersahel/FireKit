/** IPC channel names and shared DTO types (main + renderer). */

export const IPC = {
  projects: {
    list: "projects:list",
    add: "projects:add",
    remove: "projects:remove",
    setActive: "projects:setActive",
    getActive: "projects:getActive",
    testConnection: "projects:testConnection",
  },
  firestore: {
    listCollections: "firestore:listCollections",
    listSubcollections: "firestore:listSubcollections",
    listDocuments: "firestore:listDocuments",
    query: "firestore:query",
    get: "firestore:get",
    upsert: "firestore:upsert",
    delete: "firestore:delete",
  },
  index: {
    syncStart: "index:syncStart",
    syncStatus: "index:syncStatus",
    search: "index:search",
    clear: "index:clear",
    progress: "index:progress",
  },
  auth: {
    listUsers: "auth:listUsers",
    getUser: "auth:getUser",
    getUserByEmail: "auth:getUserByEmail",
    createUser: "auth:createUser",
    deleteUser: "auth:deleteUser",
    setDisabled: "auth:setDisabled",
  },
  window: {
    getChrome: "window:getChrome",
    minimize: "window:minimize",
    maximize: "window:maximize",
    close: "window:close",
  },
  app: {
    navigate: "firekit:navigate",
  },
} as const;

export type AppPlatform = "darwin" | "win32" | "linux";

export interface WindowChromeInfo {
  platform: AppPlatform;
  /** Native macOS traffic lights (hiddenInset); no custom controls needed. */
  useNativeTrafficLights: boolean;
  /** Custom title bar; window frame is hidden. */
  frameless: boolean;
}

export interface ProjectMeta {
  id: string;
  displayName: string;
  projectId: string;
  createdAt: number;
}

export interface ProjectListResult {
  projects: ProjectMeta[];
  activeProjectId: string | null;
}

export interface AddProjectPayload {
  displayName: string;
  serviceAccountJson: string;
}

export interface TestConnectionPayload {
  serviceAccountJson?: string;
  projectId?: string;
}

export interface TestConnectionResult {
  ok: boolean;
  projectId?: string;
  error?: string;
}

export type FirestoreWhereOp =
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "array-contains"
  | "in"
  | "array-contains-any";

export interface FirestoreFilter {
  field: string;
  op: FirestoreWhereOp;
  value: unknown;
}

export interface FirestoreQueryPayload {
  projectId: string;
  collectionPath: string;
  limit: number;
  orderBy?: { field: string; direction: "asc" | "desc" };
  filters?: FirestoreFilter[];
  startAfterId?: string;
}

export interface FirestoreDocumentDto {
  id: string;
  path: string;
  data: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
}

export interface FirestoreQueryResult {
  documents: FirestoreDocumentDto[];
  hasMore: boolean;
  lastId: string | null;
}

export interface FirestoreListCollectionsPayload {
  projectId: string;
}

export interface FirestoreListSubcollectionsPayload {
  projectId: string;
  /** Full document path, e.g. shops/abc123 */
  documentPath: string;
}

export interface FirestoreListDocumentsPayload {
  projectId: string;
  collectionPath: string;
  limit?: number;
}

export interface FirestoreGetPayload {
  projectId: string;
  documentPath: string;
}

export interface FirestoreUpsertPayload {
  projectId: string;
  documentPath: string;
  data: Record<string, unknown>;
  merge?: boolean;
}

export interface FirestoreDeletePayload {
  projectId: string;
  documentPath: string;
}

export interface IndexSyncStartPayload {
  projectId: string;
  collectionPath: string;
  full?: boolean;
}

export interface IndexSyncStatusPayload {
  projectId: string;
  collectionPath: string;
}

export interface IndexSyncStatusResult {
  syncing: boolean;
  indexedCount: number;
  lastSyncAt: number | null;
  error: string | null;
}

export interface IndexProgressEvent {
  projectId: string;
  collectionPath: string;
  indexed: number;
  done: boolean;
  error?: string;
}

export interface IndexSearchPayload {
  projectId: string;
  collectionPath: string;
  query: string;
  limit: number;
  offset: number;
}

export interface IndexSearchHit {
  docId: string;
  path: string;
  snippet: string;
  data: Record<string, unknown>;
}

export interface IndexSearchResult {
  hits: IndexSearchHit[];
  total: number;
}

export interface IndexClearPayload {
  projectId: string;
  collectionPath: string;
}

export interface AuthListUsersPayload {
  projectId: string;
  maxResults: number;
  pageToken?: string;
}

export interface AuthUserDto {
  uid: string;
  email: string | null;
  displayName: string | null;
  disabled: boolean;
  emailVerified: boolean;
  creationTime: string;
  lastSignInTime: string | null;
  customClaims: Record<string, unknown>;
  providerIds: string[];
}

export interface AuthListUsersResult {
  users: AuthUserDto[];
  pageToken: string | null;
}

export interface AuthGetUserPayload {
  projectId: string;
  uid: string;
}

export interface AuthGetUserByEmailPayload {
  projectId: string;
  email: string;
}

export interface AuthCreateUserPayload {
  projectId: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthDeleteUserPayload {
  projectId: string;
  uid: string;
}

export interface AuthSetDisabledPayload {
  projectId: string;
  uid: string;
  disabled: boolean;
}

export interface FirekitApi {
  projects: {
    list(): Promise<ProjectListResult>;
    add(payload: AddProjectPayload): Promise<ProjectMeta>;
    remove(projectId: string): Promise<void>;
    setActive(projectId: string): Promise<void>;
    getActive(): Promise<string | null>;
    testConnection(
      payload: TestConnectionPayload,
    ): Promise<TestConnectionResult>;
  };
  firestore: {
    listCollections(
      payload: FirestoreListCollectionsPayload,
    ): Promise<string[]>;
    listSubcollections(
      payload: FirestoreListSubcollectionsPayload,
    ): Promise<string[]>;
    listDocuments(
      payload: FirestoreListDocumentsPayload,
    ): Promise<FirestoreDocumentDto[]>;
    query(payload: FirestoreQueryPayload): Promise<FirestoreQueryResult>;
    get(payload: FirestoreGetPayload): Promise<FirestoreDocumentDto | null>;
    upsert(payload: FirestoreUpsertPayload): Promise<void>;
    delete(payload: FirestoreDeletePayload): Promise<void>;
  };
  index: {
    syncStart(payload: IndexSyncStartPayload): Promise<void>;
    syncStatus(payload: IndexSyncStatusPayload): Promise<IndexSyncStatusResult>;
    search(payload: IndexSearchPayload): Promise<IndexSearchResult>;
    clear(payload: IndexClearPayload): Promise<void>;
    onProgress(callback: (event: IndexProgressEvent) => void): () => void;
  };
  auth: {
    listUsers(payload: AuthListUsersPayload): Promise<AuthListUsersResult>;
    getUser(payload: AuthGetUserPayload): Promise<AuthUserDto | null>;
    getUserByEmail(
      payload: AuthGetUserByEmailPayload,
    ): Promise<AuthUserDto | null>;
    createUser(payload: AuthCreateUserPayload): Promise<AuthUserDto>;
    deleteUser(payload: AuthDeleteUserPayload): Promise<void>;
    setDisabled(payload: AuthSetDisabledPayload): Promise<void>;
  };
  window: {
    getChrome(): Promise<WindowChromeInfo>;
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    close(): Promise<void>;
  };
  app: {
    onNavigate(callback: (route: string) => void): () => void;
  };
}

declare global {
  interface Window {
    firekit: FirekitApi;
  }
}

export {};
