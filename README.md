# FireKit

Open-source desktop admin for **Firebase Firestore** and **Authentication**. Connect with a service account, browse and edit data with pagination and filters, and search large collections via a local index.

Built with **Angular**, **[spartan/ui](https://www.spartan.ng/components)** (brain + helm in `libs/ui/`), **Tailwind CSS v4**, and **Electron** (`firebase-admin` runs only in the main process). Add more primitives with `ng g @spartan-ng/cli:ui`.

> Screenshots coming soon.

## Features (v1)

- **Multi-project workspace** — add several Firebase projects and switch between them
- **Firestore** — collection tree, cursor-paginated document table, structured filters, JSON editor, CRUD
- **Search index** — SQLite-backed full-collection search (optional per-collection sync)
- **Authentication** — paginated user list, search, create / disable / delete users
- **Security** — service account secrets stored in the OS keychain; renderer has no Admin SDK access

See [docs/PROJECT.md](docs/PROJECT.md) for the full product spec and roadmap.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- A Firebase **service account** JSON with permissions for Firestore and Auth (typically *Firebase Admin* or custom roles)

## Quick start

```bash
git clone https://github.com/Muneersahel/FireKit.git
cd FireKit
pnpm install
pnpm run electron:dev
```

Use the **Electron desktop window** that opens automatically. Do not open `http://localhost:4200` in Chrome or Safari — the Firebase API is only available in Electron.

On first launch, use **Add project** and import your service account JSON. Credentials are stored in the system keychain, not in the repo.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm start` | Alias for `electron:dev` |
| `pnpm run electron:dev` | Angular dev server + Electron |
| `FIREKIT_DEVTOOLS=1 pnpm run electron:dev` | Same, with DevTools open (ignore Autofill CDP log noise) |
| `pnpm run build` | Production Angular build |
| `pnpm run electron:build` | Compile main/preload TypeScript |
| `pnpm run icons:generate` | Regenerate `build/` icons from `public/firekit-icon.png` (macOS for `.icns`) |
| `pnpm run dist` | Package desktop app (electron-builder) |

## Adding a project

1. Open **Welcome** or **Settings → Projects**
2. Choose **Add project** and select a service account JSON file
3. FireKit stores the secret in the OS keychain and keeps only non-secret metadata in app data
4. Use **Test connection** before saving

**Warning:** A service account has broad access to your Firebase project. Use least-privilege roles and never commit JSON keys to git.

## Build for release

**CI / local packages only** (no GitHub upload):

```bash
pnpm run icons:generate   # once, or after changing public/firekit-icon.png
pnpm run dist
```

**Publish to GitHub Releases** — tag a version and push, or run the Release workflow manually:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions builds on macOS, Windows, and Linux and uploads installers. The workflow uses `GITHUB_TOKEN` by default; add a repository secret **`GH_TOKEN`** (PAT with `repo` scope) only if you need a personal token instead.

Local publish:

```bash
export GH_TOKEN="ghp_..."   # PAT with repo + contents access
pnpm run dist:release
```

**macOS signing & notarization:** configure [GitHub Actions secrets](docs/SIGNING.md) (`CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`) for signed release DMGs. Local builds use your Keychain Developer ID cert when present.

## Documentation

- [Project overview & features](docs/PROJECT.md)
- [Architecture & IPC](docs/ARCHITECTURE.md)
- [macOS code signing](docs/SIGNING.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT — see [LICENSE](LICENSE).
