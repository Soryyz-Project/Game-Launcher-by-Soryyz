import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { GameEntry } from "../types";

export function useGames() {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await invoke<GameEntry[]>("scan_games");
        setGames(result);
      } catch (e) {
        console.error("Failed to scan games:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const launch = async (path: string) => {
    try {
      await invoke("launch_game", { path });
    } catch (e) {
      console.error("Failed to launch:", e);
    }
  };

  return { games, loading, launch };
}
