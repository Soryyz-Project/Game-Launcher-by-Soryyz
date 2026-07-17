import { useEffect, useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ControllerType } from "../hooks/useGamepad";

interface MediaFile {
  name: string;
  path: string;
  is_image: boolean;
  thumbnail: string | null;
}

interface Props {
  initialTab: "screenshots" | "videos";
  onBack: () => void;
  controller: ControllerType;
  onTabChange?: (tab: "screenshots" | "videos") => void;
}

const TABS = ["screenshots", "videos"] as const;

export function MediaViewer({ initialTab, onBack, controller, onTabChange }: Props) {
  const [tabIdx, setTabIdx] = useState(initialTab === "videos" ? 1 : 0);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => {
    invoke<MediaFile[]>("get_media_files", { dirType: TABS[tabIdx] })
      .then((res) => { if (mountedRef.current) setFiles(res); })
      .catch(() => {});
  }, [tabIdx]);

  const switchTab = useCallback((idx: number) => {
    setTabIdx(idx);
    setSelected(null);
    if (onTabChange) onTabChange(TABS[idx]);
  }, [onTabChange]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (preview) {
        if (e.key === "Escape" || e.key === "Backspace") {
          setPreview(null);
          e.preventDefault();
        }
        return;
      }
      if (e.key === "Escape" || e.key === "Backspace") {
        onBack();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onBack, preview]);

  const handleGamepadAction = useCallback(
    (action: string) => {
      if (!mountedRef.current) return;
      if (preview) {
        if (action === "back" || action === "confirm") {
          setPreview(null);
        }
        return;
      }
      switch (action) {
        case "back":
          onBack();
          break;
        case "left":
          setSelected((i) => (i === null || i <= 0 ? null : i - 1));
          break;
        case "right":
          setSelected((i) =>
            i === null ? (files.length > 0 ? 0 : null) : Math.min(i + 1, files.length - 1)
          );
          break;
        case "up":
          if (selected !== null) {
            const cols = 4;
            setSelected(Math.max(selected - cols, 0));
          }
          break;
        case "down":
          if (selected !== null) {
            const cols = 4;
            setSelected(Math.min(selected + cols, files.length - 1));
          }
          break;
        case "confirm":
          if (selected !== null && files[selected]) {
            setPreview(files[selected]);
          }
          break;
        case "lb":
          switchTab(tabIdx === 0 ? 0 : tabIdx - 1);
          break;
        case "rb":
          switchTab(tabIdx === TABS.length - 1 ? tabIdx : tabIdx + 1);
          break;
      }
    },
    [onBack, files, selected, preview, tabIdx, switchTab]
  );

  useEffect(() => {
    const poll = setInterval(() => {
      const gp = navigator.getGamepads();
      const gamepad = Array.from(gp).find((g) => g !== null);
      if (!gamepad) return;
      for (const cb of callbacks.current) cb(gamepad);
    }, 80);
    const callbacks: { current: ((gp: Gamepad) => void)[] } = { current: [] };
    const prev = new Map<string, number>();
    const check = (gp: Gamepad) => {
      const btnMap: [string, number][] = [
        ["confirm", 0], ["back", 1], ["lb", 4], ["rb", 5],
      ];
      for (const [action, idx] of btnMap) {
        const pressed = gp.buttons[idx]?.pressed ?? false;
        const k = `${action}-${gp.index}`;
        const p = prev.get(k) ?? 0;
        if (pressed && p === 0) { handleGamepadAction(action); prev.set(k, 1); }
        else if (!pressed) { prev.set(k, 0); }
      }
      const ax = gp.axes;
      const dpad: [number, number, string][] = [
        [0, -0.5, "left"], [0, 0.5, "right"], [1, -0.5, "up"], [1, 0.5, "down"],
      ];
      for (const [axis, threshold, action] of dpad) {
        const val = ax[axis] ?? 0;
        if (Math.abs(val) > Math.abs(threshold)) {
          const dir = val < 0 ? "neg" : "pos";
          const dk = `${axis}-${dir}`;
          const p = prev.get(dk) ?? 0;
          if (p === 0) { handleGamepadAction(action); prev.set(dk, 1); }
        } else {
          [0, 1].forEach((a) => { prev.delete(`${a}-neg`); prev.delete(`${a}-pos`); });
        }
      }
    };
    callbacks.current.push(check);
    return () => clearInterval(poll);
  }, [handleGamepadAction]);

  const del = async (path: string) => {
    try {
      await invoke("delete_media_file", { path });
      if (mountedRef.current) { load(); setSelected(null); }
    } catch {}
  };

  const backHint = controller === "ps" ? "○" : controller === "xbox" ? "B" : "Esc";

  if (preview) {
    return (
      <div className="media-preview-overlay" onClick={() => setPreview(null)}>
        <div className="media-preview-toolbar">
          <button className="media-preview-btn" onClick={() => setPreview(null)}>✕</button>
          <span className="media-preview-name">{preview.name}</span>
          <button className="media-preview-btn danger" onClick={() => { del(preview.path); setPreview(null); }}>🗑</button>
        </div>
        {preview.is_image && preview.thumbnail ? (
          <img className="media-preview-image" src={preview.thumbnail} alt={preview.name} onClick={(e) => e.stopPropagation()} />
        ) : (
          <div className="media-preview-video-placeholder" onClick={(e) => e.stopPropagation()}>
            <span className="media-preview-video-icon">🎥</span>
            <span className="media-preview-filename">{preview.name}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="media-viewer">
      {files.length === 0 ? (
        <div className="media-viewer-empty">
          <p>Нет файлов</p>
          <p className="empty-hint">Добавьте {tabIdx === 0 ? "изображения" : "видео"} в папку</p>
        </div>
      ) : (
        <div className="media-viewer-grid">
          {files.map((file, i) => (
            <div
              key={file.path}
              className={`media-viewer-item ${selected === i ? "selected" : ""}`}
              onClick={() => setSelected(i)}
              onDoubleClick={() => setPreview(file)}
            >
              {file.is_image && file.thumbnail ? (
                <img className="media-viewer-thumb" src={file.thumbnail} alt={file.name} />
              ) : (
                <div className="media-viewer-video-thumb"><span>🎥</span></div>
              )}
              <span className="media-viewer-name">{file.name}</span>
              {selected === i && (
                <button className="media-viewer-del" onClick={(e) => { e.stopPropagation(); del(file.path); }}>🗑</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
