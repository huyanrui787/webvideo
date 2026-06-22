-- Migration: Add illustration_shots table for illustration-video mode
-- Run: sqlite3 data/studio.db < lib/db/migrations/0001_illustration_shots.sql

CREATE TABLE IF NOT EXISTS illustration_shots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  chapter_id TEXT NOT NULL,
  step_idx INTEGER NOT NULL DEFAULT 0,
  theme TEXT NOT NULL,
  structure_type TEXT NOT NULL,
  core_idea TEXT NOT NULL,
  xiaohei_action TEXT,
  elements TEXT NOT NULL DEFAULT '[]',
  labels TEXT NOT NULL DEFAULT '[]',
  prompt_en TEXT,
  asset_filename TEXT,
  asset_url TEXT,
  generation_status TEXT NOT NULL DEFAULT 'pending',
  generation_error TEXT,
  ken_burns_scale INTEGER,
  ken_burns_pan_x INTEGER DEFAULT 0,
  ken_burns_pan_y INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_illustration_shots_project ON illustration_shots(project_id);
CREATE INDEX IF NOT EXISTS idx_illustration_shots_status ON illustration_shots(project_id, generation_status);
