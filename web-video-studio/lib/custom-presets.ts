/**
 * Global custom style presets — user-level, NOT project-level.
 * Stored in a JSON file keyed by user ID.
 */
import fs from "fs";
import path from "path";
import type { CustomPreset } from "./illustration-style";

interface CustomPresetsStore {
  [userId: string]: Record<string, { name: string; visualDna: string; characterDescription: string }>;
}

const STORE_PATH = path.resolve(process.cwd(), "data", "custom-presets.json");

function readStore(): CustomPresetsStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    }
  } catch {}
  return {};
}

function writeStore(store: CustomPresetsStore) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

let _counter = 0;
export function generatePresetId(): string {
  _counter++;
  return `custom-${Date.now().toString(36)}-${_counter}`;
}

/** Get all custom presets for a user */
export function getUserPresets(userId: string): Record<string, CustomPreset> {
  return readStore()[userId] ?? {};
}

/** Save one custom preset for a user, returns its ID */
export function saveUserPreset(
  userId: string,
  preset: { name: string; visualDna: string; characterDescription: string },
  presetId?: string,
): string {
  const store = readStore();
  if (!store[userId]) store[userId] = {};
  const id = presetId || generatePresetId();
  store[userId][id] = preset;
  writeStore(store);
  return id;
}

/** Delete one custom preset for a user */
export function deleteUserPreset(userId: string, presetId: string): boolean {
  const store = readStore();
  if (!store[userId]?.[presetId]) return false;
  delete store[userId][presetId];
  writeStore(store);
  return true;
}
