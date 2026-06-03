/**
 * Launches Electron for local dev.
 * macOS: uses a ditto-copied, ad-hoc signed FireKit.app so the menu bar shows
 * "FireKit" without breaking Chromium resources (icudtl.dat / GPU helpers).
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const APP_NAME = "FireKit";
const requireFromRoot = createRequire(path.join(root, "package.json"));

/** Path to the MacOS/Electron (or platform) binary from the installed electron package. */
function resolveElectronExec() {
  return requireFromRoot("electron");
}

/** Electron.app / electron.exe directory for the installed package. */
function resolveElectronDistDir() {
  const execPath = resolveElectronExec();
  if (process.platform === "darwin") {
    return path.resolve(execPath, "../../..");
  }
  return path.dirname(execPath);
}

function execPlutil(args) {
  execSync(`plutil ${args.map((a) => JSON.stringify(a)).join(" ")}`, {
    stdio: "pipe",
  });
}

function macBundleDisplayName(plistPath) {
  try {
    return execSync(
      `plutil -extract CFBundleDisplayName raw ${JSON.stringify(plistPath)}`,
      { encoding: "utf8" },
    ).trim();
  } catch {
    return "";
  }
}

function ensureMacDevBundle() {
  const sourceApp = resolveElectronDistDir();
  const devApp = path.join(root, ".cache", "FireKit.app");
  const plistPath = path.join(devApp, "Contents", "Info.plist");
  const stampPath = path.join(devApp, ".firekit-dev-stamp");
  const electronVersion = requireFromRoot("electron/package.json").version;

  if (!fs.existsSync(sourceApp)) {
    throw new Error(
      `Electron.app not found at ${sourceApp}. Run pnpm install.`,
    );
  }

  const stamp = `${electronVersion}\n${sourceApp}\n`;
  const needsRebuild =
    !fs.existsSync(devApp) ||
    macBundleDisplayName(plistPath) !== APP_NAME ||
    !fs.existsSync(stampPath) ||
    fs.readFileSync(stampPath, "utf8") !== stamp;

  if (needsRebuild) {
    fs.rmSync(devApp, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(devApp), { recursive: true });
    execSync(`ditto ${JSON.stringify(sourceApp)} ${JSON.stringify(devApp)}`);
    for (const key of ["CFBundleName", "CFBundleDisplayName"]) {
      try {
        execPlutil(["-replace", key, "-string", APP_NAME, plistPath]);
      } catch {
        execPlutil(["-insert", key, "-string", APP_NAME, plistPath]);
      }
    }
    execSync(`codesign --force --deep --sign - ${JSON.stringify(devApp)}`, {
      stdio: "pipe",
    });
    fs.writeFileSync(stampPath, stamp);
  }

  return path.join(devApp, "Contents/MacOS/Electron");
}

function run(extraArgs = []) {
  const bin =
    process.platform === "darwin"
      ? ensureMacDevBundle()
      : resolveElectronExec();

  const child = spawn(bin, [root, ...extraArgs], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}

run(process.argv.slice(2));
