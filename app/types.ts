// Type definitions for the app
export interface Player {
    id: string;
    name: string;
}

export interface FindItem {
    name: string;
    prompt: string;
}

export interface LeaderboardEntry {
    name: string;
    timestamp: string;
    speed: number;
}

export interface Round {
    start: number | null;
    finish: number | null;
    players: Player[];
    winner: Player | null;
}

export interface WebSocketMessage {
    t: "player" | "round";
    player?: Player;
    round?: Round;
}

export interface AppState {
    currentView: "leaderboard" | "hunting";
    currentItemIndex: number;
    isHuntingActive: boolean;
}
