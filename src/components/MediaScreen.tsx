import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { GameEntry } from "../types";

interface Props {
  games: GameEntry[];
  onOpenViewer: (tab: "screenshots" | "videos") => void;
  onOpenLibrary: () => void;
}

interface Counts {
  screenshots: number;
  videos: number;
}

export function MediaScreen({ games, onOpenViewer, onOpenLibrary }: Props) {
  const [counts, setCounts] = useState<Counts>({ screenshots: 0, videos: 0 });
  const recent = games.slice(0, 5);

  useEffect(() => {
    invoke<Counts>("get_media_counts").then(setCounts).catch(() => {});
    const id = setInterval(() => {
      invoke<Counts>("get_media_counts").then(setCounts).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="media-screen">
      <h2 className="media-title">Медиа</h2>

      {recent.length > 0 && (
        <section className="media-section">
          <h3 className="media-section-title">Недавние игры</h3>
          <div className="media-recent-list">
            {recent.map((game) => (
              <div key={game.path} className="media-recent-card" onClick={onOpenLibrary}>
                <div className="media-recent-icon">
                  {game.name.charAt(0).toUpperCase()}
                </div>
                <div className="media-recent-body">
                  <span className="media-recent-name">{game.name}</span>
                  <span className="media-recent-meta">{game.source}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="media-section">
        <h3 className="media-section-title">Библиотека медиа</h3>
        <div className="media-grid">
          <div
            className="media-grid-card"
            onClick={() => onOpenViewer("screenshots")}
          >
            <span className="media-grid-icon">📸</span>
            <div className="media-grid-info">
              <span className="media-grid-label">Скриншоты</span>
              <span className="media-grid-count">
                {counts.screenshots} {counts.screenshots === 1 ? "файл" : "файлов"}
              </span>
            </div>
            <span className="media-grid-arrow">→</span>
          </div>
          <div
            className="media-grid-card"
            onClick={() => onOpenViewer("videos")}
          >
            <span className="media-grid-icon">🎥</span>
            <div className="media-grid-info">
              <span className="media-grid-label">Видео</span>
              <span className="media-grid-count">
                {counts.videos} {counts.videos === 1 ? "файл" : "файлов"}
              </span>
            </div>
            <span className="media-grid-arrow">→</span>
          </div>
        </div>
      </section>
    </div>
  );
}
