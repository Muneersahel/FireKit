import { app, BrowserWindow, screen } from "electron";
import fs from "fs/promises";
import path from "path";

export const DEFAULT_WINDOW_WIDTH = 1280;
export const DEFAULT_WINDOW_HEIGHT = 800;
export const MIN_WINDOW_WIDTH = 900;
export const MIN_WINDOW_HEIGHT = 600;

export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

const fileName = "window-state.json";

function statePath(): string {
  return path.join(app.getPath("userData"), fileName);
}

function clampSize(
  width: number,
  height: number,
): { width: number; height: number } {
  return {
    width: Math.max(MIN_WINDOW_WIDTH, Math.round(width)),
    height: Math.max(MIN_WINDOW_HEIGHT, Math.round(height)),
  };
}

function ensureOnScreen(state: WindowState): WindowState {
  const { width, height } = clampSize(state.width, state.height);
  let x = state.x;
  let y = state.y;

  if (x === undefined || y === undefined) {
    return { width, height, isMaximized: state.isMaximized };
  }

  const display = screen.getDisplayNearestPoint({ x, y });
  const area = display.workArea;

  let w = Math.min(width, area.width);
  let h = Math.min(height, area.height);

  if (x < area.x || x > area.x + area.width - MIN_WINDOW_WIDTH) {
    x = area.x + Math.floor((area.width - w) / 2);
  }
  if (y < area.y || y > area.y + area.height - MIN_WINDOW_HEIGHT) {
    y = area.y + Math.floor((area.height - h) / 2);
  }

  if (x + w > area.x + area.width) {
    x = area.x + area.width - w;
  }
  if (y + h > area.y + area.height) {
    y = area.y + area.height - h;
  }

  return { width: w, height: h, x, y, isMaximized: state.isMaximized };
}

export async function loadWindowState(): Promise<WindowState> {
  try {
    const raw = await fs.readFile(statePath(), "utf-8");
    const parsed = JSON.parse(raw) as WindowState;
    if (
      typeof parsed.width !== "number" ||
      typeof parsed.height !== "number" ||
      !Number.isFinite(parsed.width) ||
      !Number.isFinite(parsed.height)
    ) {
      return { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT };
    }
    return ensureOnScreen(parsed);
  } catch {
    return { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT };
  }
}

export async function saveWindowState(state: WindowState): Promise<void> {
  const normalized = ensureOnScreen(state);
  await fs.mkdir(path.dirname(statePath()), { recursive: true });
  await fs.writeFile(statePath(), JSON.stringify(normalized, null, 2), "utf-8");
}

function boundsToPersist(win: BrowserWindow): WindowState {
  const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds();
  return {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized: win.isMaximized(),
  };
}

/** Persist size/position when the user resizes or moves the window. */
export function attachWindowStatePersistence(win: BrowserWindow): void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const persist = () => {
    if (win.isDestroyed()) return;
    void saveWindowState(boundsToPersist(win));
  };

  const debouncedPersist = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(persist, 400);
  };

  win.on("resize", debouncedPersist);
  win.on("move", debouncedPersist);
  win.on("close", () => {
    if (timer) clearTimeout(timer);
    persist();
  });
}

export function applyWindowState(win: BrowserWindow, state: WindowState): void {
  if (state.isMaximized) {
    win.maximize();
  }
}
