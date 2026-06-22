/**
 * PrimitiveTuner — Visual parameter tuning panel for primitives.
 *
 * Renders a sidebar with sliders/inputs that let you tweak primitive
 * parameters and see the result in real-time. Intended for use during
 * development and review — not shown during recording.
 */

import { useState, useCallback, type CSSProperties } from "react";

export interface TunableParam {
  key: string;
  label: string;
  type: "number" | "text" | "select" | "color" | "boolean" | "range";
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  onChange: (value: any) => void;
}

interface PrimitiveTunerProps {
  title: string;
  params: TunableParam[];
  onReset?: () => void;
  style?: CSSProperties;
}

export function PrimitiveTuner({ title, params, onReset, style }: PrimitiveTunerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const renderControl = (p: TunableParam) => {
    switch (p.type) {
      case "range":
      case "number":
        return (
          <div key={p.key} className="tuner-row">
            <label>{p.label}</label>
            <div className="tuner-row-control">
              <input
                type="range"
                min={p.min ?? 0}
                max={p.max ?? 100}
                step={p.step ?? 1}
                value={p.value}
                onChange={(e) => p.onChange(Number(e.target.value))}
              />
              <span className="tuner-val mono">{p.value}</span>
            </div>
          </div>
        );
      case "text":
        return (
          <div key={p.key} className="tuner-row">
            <label>{p.label}</label>
            <input
              type="text"
              value={p.value}
              onChange={(e) => p.onChange(e.target.value)}
              className="tuner-input"
            />
          </div>
        );
      case "select":
        return (
          <div key={p.key} className="tuner-row">
            <label>{p.label}</label>
            <select
              value={p.value}
              onChange={(e) => p.onChange(e.target.value)}
              className="tuner-select"
            >
              {p.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        );
      case "color":
        return (
          <div key={p.key} className="tuner-row">
            <label>{p.label}</label>
            <input
              type="color"
              value={p.value}
              onChange={(e) => p.onChange(e.target.value)}
              className="tuner-color"
            />
          </div>
        );
      case "boolean":
        return (
          <div key={p.key} className="tuner-row">
            <label>{p.label}</label>
            <input
              type="checkbox"
              checked={p.value}
              onChange={(e) => p.onChange(e.target.checked)}
            />
          </div>
        );
    }
  };

  return (
    <div
      className={`tuner-panel ${collapsed ? "tuner-collapsed" : ""}`}
      style={style}
      data-no-advance
    >
      <div className="tuner-header" onClick={() => setCollapsed(!collapsed)} data-no-advance>
        <span className="tuner-title">{title}</span>
        <span className="tuner-toggle">{collapsed ? "▶" : "▼"}</span>
      </div>
      {!collapsed && (
        <div className="tuner-body">
          {params.map(renderControl)}
          {onReset && (
            <button
              className="tuner-reset"
              onClick={onReset}
              data-no-advance
            >
              Reset defaults
            </button>
          )}
        </div>
      )}
      <style>{`
        .tuner-panel {
          position: fixed;
          right: 16px;
          top: 16px;
          width: 280px;
          max-height: 80vh;
          background: var(--surface);
          border: 1px solid var(--rule);
          border-radius: var(--radius-md, 8px);
          box-shadow: var(--shadow-lg);
          z-index: 9999;
          overflow: hidden;
          font-family: var(--font-body);
          font-size: 12px;
        }
        .tuner-collapsed { width: auto; }
        .tuner-header {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--surface-2);
          cursor: pointer;
          user-select: none;
        }
        .tuner-title { font-weight: 600; color: var(--text); }
        .tuner-toggle { color: var(--text-mute); }
        .tuner-body { padding: 8px 12px; overflow-y: auto; max-height: calc(80vh - 40px); }
        .tuner-row { margin-bottom: 8px; }
        .tuner-row label { display: block; color: var(--text-2); margin-bottom: 2px; font-size: 11px; }
        .tuner-row-control { display: flex; align-items: center; gap: 8px; }
        .tuner-row-control input[type="range"] { flex: 1; }
        .tuner-val { font-family: var(--font-mono); font-size: 11px; color: var(--accent); min-width: 32px; text-align: right; }
        .tuner-input, .tuner-select { width: 100%; padding: 4px 6px; border: 1px solid var(--rule); border-radius: var(--radius-sm, 4px); background: var(--shell); color: var(--text); font-size: 12px; }
        .tuner-color { width: 32px; height: 24px; border: none; cursor: pointer; }
        .tuner-reset { margin-top: 8px; width: 100%; padding: 4px; background: var(--surface-2); border: 1px solid var(--rule); border-radius: var(--radius-sm, 4px); color: var(--text-2); cursor: pointer; font-size: 11px; }
        .tuner-reset:hover { background: var(--surface-3); }
      `}</style>
    </div>
  );
}
