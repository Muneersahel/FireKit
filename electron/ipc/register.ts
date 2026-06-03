import { registerAuthIpc } from "./auth";
import { registerFirestoreIpc } from "./firestore";
import { registerIndexIpc } from "./index-handlers";
import { registerProjectsIpc } from "./projects";
import { registerWindowIpc } from "./window";

export function registerAllIpc(): void {
  registerProjectsIpc();
  registerFirestoreIpc();
  registerIndexIpc();
  registerAuthIpc();
  registerWindowIpc();
}
