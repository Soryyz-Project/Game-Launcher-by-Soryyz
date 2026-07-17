export interface GameEntry {
  name: string;
  path: string;
  cover: string;
  source: string;
}

export type Screen = "home" | "games" | "media" | "settings";

export interface FocusState {
  section: number;
  item: number;
}
