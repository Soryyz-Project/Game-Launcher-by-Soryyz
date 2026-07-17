import { useEffect, useState, useCallback } from "react";
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
}

export function MediaViewer({ initialTab, onBack, controller }: Props) {
  const [tab, setTab] = useState(initialTab === "videos" ? 1 : 0);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [preview, setPreview] = useState<MediaFile | null>(null);

  const tabs = ["screenshots", "videos"] as const;

  const load = useCallback(() => {
    invoke<MediaFile[]>("get_media_files", { dirType: tabs[tab] })
      .then(setFiles)
      .catch(() => {});
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

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
          setTab((t) => (t === 0 ? 0 : t - 1));
          setSelected(null);
          break;
        case "rb":
          setTab((t) => (t === tabs.length - 1 ? t : t + 1));
          setSelected(null);
          break;
      }
    },
    [onBack, files, selected, preview]
  );

  useEffect(() => {
    const poll = setInterval(() => {
      const gp = navigator.getGamepads();
      const gamepad = Array.from(gp).find((g) => g !== null);
      if (!gamepad) return;
      for (const cb of buttonCallbacks.current) cb(gamepad);
    }, 80);
    const buttonCallbacks: { current: ((gp: Gamepad) => void)[] } = { current: [] };
    const prevButtons = new Map<string, number>();
    const check = (gp: Gamepad) => {
      const btnMap: [string, number, string][] = [
        ["confirm", 0, "lb"],
        ["back", 1, "rb"],
        ["lb", 4, "lb"],
        ["rb", 5, "rb"],
      ];
      for (const [action, idx] of btnMap) {
        const pressed = gp.buttons[idx]?.pressed ?? false;
        const key = `${action}-${gp.index}`;
        const prev = prevButtons.get(key) ?? 0;
        if (pressed && prev === 0) {
          handleGamepadAction(action);
          prevButtons.set(key, 1);
        } else if (!pressed) {
          prevButtons.set(key, 0);
        }
      }
      // DPad
      const ax = gp.axes;
      const dpadActions: [number, number, string][] = [
        [0, -0.5, "left"],
        [0, 0.5, "right"],
        [1, -0.5, "up"],
        [1, 0.5, "down"],
      ];
      for (const [axis, threshold, action] of dpadActions) {
        const val = ax[axis] ?? 0;
        const key = `axis-${axis}-${gp.index}`;
        const prev = prevButtons.get(key) ?? 0;
        if ((axis === 0 || axis === 1) && Math.abs(val) > Math.abs(threshold)) {
          const dir = val < 0 ? "negative" : "positive";
          const dirKey = `${key}-${dir}`;
          const p = prevButtons.get(dirKey) ?? 0;
          if (p === 0) {
            handleGamepadAction(action);
            prevButtons.set(dirKey, 1);
          }
        } else {
          prevButtons.set(`${key}-negative`, 0);
          prevButtons.set(`${key}-positive`, 0);
        }
      }
    };
    buttonCallbacks.current.push(check);
    return () => clearInterval(poll);
  }, [handleGamepadAction]);

  const del = async (path: string) => {
    try {
      await invoke("delete_media_file", { path });
      load();
      setSelected(null);
    } catch {}
  };

  const currentFiles = files;

  if (preview) {
    return (
      <div className="media-preview-overlay" onClick={() => setPreview(null)}>
        <div className="media-preview-toolbar">
          <button className="media-preview-btn" onClick={() => setPreview(null)}>
            ✕
          </button>
          <span className="media-preview-name">{preview.name}</span>
          <button className="media-preview-btn danger" onClick={() => { del(preview.path); setPreview(null); }}>
            🗑
          </button>
        </div>
        {preview.is_image && preview.thumbnail ? (
          <img
            className="media-preview-image"
            src={preview.thumbnail}
            alt={preview.name}
            onClick={(e) => e.stopPropagation()}
          />
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
      {currentFiles.length === 0 ? (
        <div className="media-viewer-empty">
          <p>Нет файлов</p>
          <p className="empty-hint">
            Добавьте {tab === 0 ? "изображения" : "видео"} в папку
          </p>
        </div>
      ) : (
        <div className="media-viewer-grid">
          {currentFiles.map((file, i) => (
            <div
              key={file.path}
              className={`media-viewer-item ${selected === i ? "selected" : ""}`}
              onClick={() => setSelected(i)}
              onDoubleClick={() => setPreview(file)}
            >
              {file.is_image && file.thumbnail ? (
                <img
                  className="media-viewer-thumb"
                  src={file.thumbnail}
                  alt={file.name}
                />
              ) : (
                <div className="media-viewer-video-thumb">
                  <span>🎥</span>
                </div>
              )}
              <span className="media-viewer-name">{file.name}</span>
              {selected === i && (
                <button
                  className="media-viewer-del"
                  onClick={(e) => { e.stopPropagation(); del(file.path); }}
                >
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
