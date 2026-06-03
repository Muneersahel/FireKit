/**
 * Must load before any other app modules. On macOS the menu bar name is fixed
 * very early; calling setName after other imports can leave "Electron" visible.
 */
import { app } from "electron";

app.setName("FireKit");
