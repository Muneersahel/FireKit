# FireKit — Project overview

## Vision

FireKit is a **local-first Firebase operations desk**: a fast desktop app for developers and operators who need to inspect and change Firestore data and Auth users without fighting security rules or waiting on the Firebase Console for every pagination click.

It optimizes for **large collections** through explicit cursor pagination, structured query filters, and an optional **SQLite search index** synced from Admin reads.

## Target users

- Application developers debugging staging/production data
- Support engineers with a scoped service account
- Small teams who want a dedicated data tool without full GCP Console access

## Core principles

1. **Admin-only (v1)** — connect via service account; no client SDK “sign in as user” flows
2. **Explicit pagination** — never load an entire collection into memory by default
3. **Secrets stay out of the renderer** — `firebase-admin` runs in Electron main; credentials in OS keychain
4. **Search index is auxiliary** — SQLite speeds discovery; Firestore remains the source of truth
5. **No telemetry by default** — network calls go only to Google/Firebase APIs you configure

## Feature list

### v1 — Firestore

| Feature | Description |
|---------|-------------|
| Collection tree | Lazy-loaded hierarchy of collections and document IDs |
| Document table | Page size 25–200 (default 50), next/prev cursors, sort field + direction |
| Document detail | JSON tree viewer; edit, save, delete with confirmation |
| Structured filters | Field + operator UI mapped to Firestore `where`; AND composition; index error hints |
| Indexed search | SQLite-backed search across synced collection bodies |
| Index management | Full/incremental sync, status, last sync time, cancel |

### v1 — Authentication

| Feature | Description |
|---------|-------------|
| User list | Paginated `listUsers` with page tokens |
| Search | By email or UID where Admin API allows; bounded scan with warning otherwise |
| User detail | Providers, metadata, custom claims (read-only in v1) |
| Actions | Create (email/password), disable/enable, delete (typed confirmation) |

### v1.1+ (roadmap)

- Cloud Storage browser (`admin.storage()`)
- Custom claims editor, provider linking, CSV import/export
- Optional real-time watch on a single document
- Security rules viewer (read-only)
- macOS/Windows code signing and notarization for releases

## Non-goals

- End-user production app or multi-tenant hosted backend
- Replacing the full Firebase Console (Hosting, Functions, Extensions, etc.)
- Realtime Database or Emulator suite UI in v1
- Offline writes or sync conflict resolution

## Security model

- **Service account power** equals project admin capabilities you grant in IAM — treat keys like production secrets
- **Keychain storage** for private key material; app data holds project ID, display name, active collection paths only
- **Renderer sandbox** — `contextIsolation`, no `nodeIntegration`, narrow preload API
- Import wizard warns before first save

## FireKit vs Firebase Console

| Use FireKit when… | Use Console when… |
|-------------------|-------------------|
| You need fast paginated tables and local search | You need Hosting, Functions, Rules playground |
| You have a service account and bypass rules intentionally | You prefer Google sign-in without local keys |
| You work offline against an already-synced index | You need Google’s full product surface |

## Architecture

Technical design: [ARCHITECTURE.md](ARCHITECTURE.md).

## License

MIT — see [LICENSE](../LICENSE).
