// Type definitions for the app
export interface Player {
  id: string;
  name: string;
  isReady?: boolean;
  itemsFound?: number;
  itemTimes?: number[]; // Time taken for each item in seconds
  totalTime?: number;
}

export interface FindItem {
  name: string;
  prompt: string;
  confidence?: number; // Detection confidence threshold
  enabled?: boolean;
}

export interface LeaderboardEntry {
  name: string;
  timestamp: string;
  speed: number;
}

export interface Round {
  start: string | null; // ISO datetime string
  finish: string | null; // ISO datetime string  
  players: Player[];
  winner: Player | null;
  countdown?: number; // Countdown seconds remaining
  currentItems?: FindItem[]; // 3 random items for this round
  gameActive?: boolean;
}

export interface WebSocketMessage {
  t: "player" | "round" | "announcement";
  player?: Player;
  round?: Round;
  announcement?: {
    message: string;
    type: "item_found" | "game_start" | "game_end";
    playerName?: string;
    itemName?: string;
    itemCount?: number;
  };
}

export interface AppState {
  currentView: "leaderboard" | "hunting";
  currentItemIndex: number;
  isHuntingActive: boolean;
}
