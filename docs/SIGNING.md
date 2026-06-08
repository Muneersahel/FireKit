# macOS code signing and notarization

FireKit uses [electron-builder](https://www.electron.build/code-signing) with a **Developer ID Application** certificate and Apple notarization so Gatekeeper accepts distributed `.dmg` / `.zip` builds.

## Prerequisites

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/).
2. Create a **Developer ID Application** certificate and install it in Keychain (or export as `.p12`).
3. Create an [app-specific password](https://appleid.apple.com) for notarization.
4. Note your **Team ID** (10 characters) from the Apple Developer membership page.

## Repository secrets (GitHub Actions)

Add these in **Settings → Secrets and variables → Actions** on the FireKit repo:

| Secret | Description |
|--------|-------------|
| `CSC_LINK` | Base64-encoded `.p12` for **Developer ID Application** |
| `CSC_KEY_PASSWORD` | Password for that `.p12` |
| `APPLE_ID` | Apple ID email used for notarization |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password (not your Apple ID password) |
| `APPLE_TEAM_ID` | Team ID, e.g. `ABCDE12345` |

Optional: `CSC_NAME` — exact codesign identity string if you have multiple Developer ID certs.

### Encode the certificate

```bash
base64 -i DeveloperID.p12 | pbcopy   # macOS: copies to clipboard for CSC_LINK
```

Release builds on `macos-latest` use these secrets. Other platforms ignore them. If secrets are missing (e.g. forks), the macOS job still produces an **unsigned** build.

## Local release build

With the cert in your login keychain:

```bash
pnpm run icons:generate   # if needed
pnpm run dist
```

electron-builder picks the Developer ID identity automatically. To pin one:

```bash
export CSC_NAME="Developer ID Application: Your Name (TEAMID)"
pnpm run dist
```

Notarize locally:

```bash
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOURTEAMID"
pnpm run dist
```

Verify:

```bash
codesign -dv --verbose=4 release/mac-arm64/FireKit.app
spctl -a -vv release/mac-arm64/FireKit.app
```

## Entitlements

- `build/entitlements.mac.plist` — main app (network client for Firebase, Chromium JIT)
- `build/entitlements.mac.inherit.plist` — Electron helper processes

Service account secrets use the system keychain via `keytar`; no extra entitlement is required beyond correct Developer ID signing.

## CI behavior

The [Release workflow](../.github/workflows/release.yml) passes signing env vars only on the macOS matrix job. When all `APPLE_*` and `CSC_*` secrets are set, electron-builder signs, notarizes, and staples before uploading the DMG/ZIP.
