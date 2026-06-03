/**
 * Generates Electron / electron-builder icons from public/firekit-icon.png.
 * Outputs: build/icon.icns, build/icon.ico, build/icon.png, build/icons/*.png
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "public", "firekit-icon.png");
const buildDir = path.join(root, "build");
const iconsDir = path.join(buildDir, "icons");
const iconsetDir = path.join(buildDir, "icon.iconset");

const LINUX_SIZES = [16, 32, 48, 64, 128, 256, 512];
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: root });
}

function resize(out, size) {
  run(`sips -z ${size} ${size} "${source}" --out "${out}"`);
}

if (!fs.existsSync(source)) {
  console.error(`Source icon not found: ${source}`);
  process.exit(1);
}

if (process.platform !== "darwin") {
  console.error(
    "icon.icns generation requires macOS (sips + iconutil). PNG/ICO steps may still run.",
  );
}

fs.rmSync(buildDir, { recursive: true, force: true });
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of LINUX_SIZES) {
  resize(path.join(iconsDir, `${size}x${size}.png`), size);
}

resize(path.join(buildDir, "icon.png"), 512);

if (process.platform === "darwin") {
  fs.mkdirSync(iconsetDir, { recursive: true });
  const macSet = [
    ["icon_16x16.png", 16],
    ["icon_16x16@2x.png", 32],
    ["icon_32x32.png", 32],
    ["icon_32x32@2x.png", 64],
    ["icon_128x128.png", 128],
    ["icon_128x128@2x.png", 256],
    ["icon_256x256.png", 256],
    ["icon_256x256@2x.png", 512],
    ["icon_512x512.png", 512],
    ["icon_512x512@2x.png", 1024],
  ];
  for (const [name, size] of macSet) {
    resize(path.join(iconsetDir, name), size);
  }
  run(
    `iconutil -c icns "${iconsetDir}" -o "${path.join(buildDir, "icon.icns")}"`,
  );
  fs.rmSync(iconsetDir, { recursive: true, force: true });
}

const icoInputs = ICO_SIZES.map((size) => {
  const file = path.join(buildDir, `_ico-${size}.png`);
  resize(file, size);
  return file;
});

const icoBuffer = await pngToIco(icoInputs);
fs.writeFileSync(path.join(buildDir, "icon.ico"), icoBuffer);
for (const file of icoInputs) {
  fs.unlinkSync(file);
}

console.log("Icons written to build/");
