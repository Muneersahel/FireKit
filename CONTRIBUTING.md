# Contributing to FireKit

Thank you for your interest in contributing. FireKit is an Electron + Angular desktop app; Firebase Admin access must stay in the **main process** only.

## Development setup

```bash
pnpm install
# If pnpm reports ignored build scripts, run once:
pnpm approve-builds better-sqlite3 keytar electron esbuild @parcel/watcher lmdb msgpackr-extract protobufjs @firebase/util
pnpm run electron:dev
```

Requires Node 20+ and pnpm. Native modules (`better-sqlite3`, `keytar`) are rebuilt for Electron on `postinstall`.

## Project layout

- `src/` — Angular renderer (Spartan UI)
- `electron/` — Main process, preload, IPC handlers, firebase-admin, SQLite index
- `shared/` — IPC channel names and TypeScript types shared by main and renderer

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security checklist (required for PRs touching IPC or Firebase)

- [ ] No `firebase-admin` or service account paths imported under `src/`
- [ ] New capabilities exposed only via `electron/preload.ts` + `ipcMain.handle`
- [ ] Renderer uses `contextIsolation`; `nodeIntegration` remains `false`
- [ ] Secrets never logged or returned to the renderer in full

## Code style

- Angular: standalone components, `OnPush` change detection, signals where practical
- TypeScript strict mode
- Match existing naming and folder structure

## Pull requests

1. Fork and create a branch from `main`
2. Keep PRs focused; link an issue if applicable
3. Run `pnpm run build` and `pnpm run electron:build` before opening
4. Describe security impact if IPC or credential handling changes

## Reporting issues

Include OS version, FireKit version, and whether the issue involves Firestore, Auth, or the search index. Do **not** paste service account JSON or private keys.
