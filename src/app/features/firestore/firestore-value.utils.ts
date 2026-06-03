import type { FirestoreDocumentDto } from "@shared/ipc";

export type FirestoreValueKind =
  | "null"
  | "boolean"
  | "number"
  | "string"
  | "array"
  | "object"
  | "timestamp";

export interface FirestoreCellPreview {
  kind: FirestoreValueKind;
  text: string;
  badge?: string;
  expandable: boolean;
}

export interface FirestoreInspectContext {
  docId: string;
  docPath: string;
  field: string;
  value: unknown;
}

export const FIRESTORE_DOC_ID_COL_WIDTH = 200;
export const FIRESTORE_FIELD_COL_MIN = 140;
export const FIRESTORE_FIELD_COL_MAX = 260;

export function fieldColumnWidthPx(field: string): number {
  const estimated = field.length * 7 + 64;
  return Math.min(
    FIRESTORE_FIELD_COL_MAX,
    Math.max(FIRESTORE_FIELD_COL_MIN, estimated),
  );
}

export function extractFieldColumns(
  documents: FirestoreDocumentDto[],
): string[] {
  const keys = new Set<string>();
  for (const doc of documents) {
    for (const key of Object.keys(doc.data)) {
      keys.add(key);
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

export function getDocumentFieldValue(
  doc: FirestoreDocumentDto,
  field: string,
): unknown {
  return doc.data[field];
}

export const VALUE_KIND_LABEL: Record<FirestoreValueKind, string> = {
  null: "null",
  boolean: "boolean",
  number: "number",
  string: "string",
  array: "array",
  object: "object",
  timestamp: "timestamp",
};

export function valueKindLabel(kind: FirestoreValueKind): string {
  return VALUE_KIND_LABEL[kind];
}

export function valueKind(value: unknown): FirestoreValueKind {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (isFirestoreTimestamp(value)) return "timestamp";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "string";
}

export function cellPreview(value: unknown): FirestoreCellPreview {
  const kind = valueKind(value);

  switch (kind) {
    case "null":
      return { kind, text: "—", expandable: false };
    case "boolean":
      return {
        kind,
        text: value ? "true" : "false",
        badge: "bool",
        expandable: false,
      };
    case "number":
      return { kind, text: String(value), expandable: false };
    case "string": {
      const text = value as string;
      return {
        kind,
        text: text.length > 80 ? `${text.slice(0, 80)}…` : text,
        expandable: text.length > 80,
      };
    }
    case "timestamp":
      return {
        kind,
        text: formatTimestamp(value),
        badge: "timestamp",
        expandable: true,
      };
    case "array": {
      const arr = value as unknown[];
      const preview = arr
        .slice(0, 2)
        .map((item) => formatInlineValue(item))
        .join(", ");
      return {
        kind,
        text: preview || "[]",
        badge: `${arr.length} item${arr.length === 1 ? "" : "s"}`,
        expandable: true,
      };
    }
    case "object": {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj);
      const preview = keys
        .slice(0, 2)
        .map((k) => `${k}: ${formatInlineValue(obj[k])}`)
        .join(", ");
      return {
        kind,
        text: preview || "{}",
        badge: `${keys.length} key${keys.length === 1 ? "" : "s"}`,
        expandable: true,
      };
    }
  }
}

export function formatInlineValue(value: unknown): string {
  const kind = valueKind(value);
  if (kind === "null") return "null";
  if (kind === "string") return JSON.stringify(value);
  if (kind === "object" || kind === "array") {
    return Array.isArray(value)
      ? `[${value.length}]`
      : `{${Object.keys(value as object).length}}`;
  }
  if (kind === "timestamp") return formatTimestamp(value);
  return String(value);
}

export function formatPrimitive(value: unknown): string {
  const kind = valueKind(value);
  if (kind === "null") return "null";
  if (kind === "string") return value as string;
  if (kind === "timestamp") return formatTimestamp(value);
  return String(value);
}

export function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function isExpandableValue(value: unknown): boolean {
  return cellPreview(value).expandable;
}

function isFirestoreTimestamp(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const seconds = record["seconds"] ?? record["_seconds"];
  const nanos = record["nanoseconds"] ?? record["_nanoseconds"];
  return (
    (typeof seconds === "number" || typeof seconds === "string") &&
    (typeof nanos === "number" || typeof nanos === "string")
  );
}

function formatTimestamp(value: unknown): string {
  if (!isFirestoreTimestamp(value)) return String(value);
  const record = value as Record<string, unknown>;
  const seconds = Number(record["seconds"] ?? record["_seconds"]);
  const nanos = Number(record["nanoseconds"] ?? record["_nanoseconds"] ?? 0);
  const date = new Date(seconds * 1000 + nanos / 1_000_000);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}
