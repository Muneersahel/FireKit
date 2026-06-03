export type DraftValueType = "string" | "number" | "boolean" | "null" | "json";

export const DRAFT_VALUE_TYPES: DraftValueType[] = [
  "string",
  "number",
  "boolean",
  "null",
  "json",
];

export interface DraftFieldRow {
  id: string;
  name: string;
  value: string;
  valueType: DraftValueType;
}

export function createDraftFieldRow(): DraftFieldRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    value: "",
    valueType: "string",
  };
}

export function parseDraftValue(row: DraftFieldRow): unknown {
  switch (row.valueType) {
    case "null":
      return null;
    case "boolean": {
      const v = row.value.trim().toLowerCase();
      if (v === "true") return true;
      if (v === "false") return false;
      throw new Error(`Invalid boolean for "${row.name}"`);
    }
    case "number": {
      const n = Number(row.value.trim());
      if (row.value.trim() === "" || Number.isNaN(n)) {
        throw new Error(`Invalid number for "${row.name}"`);
      }
      return n;
    }
    case "json":
      return JSON.parse(row.value.trim() || "null") as unknown;
    case "string":
    default:
      return row.value;
  }
}
