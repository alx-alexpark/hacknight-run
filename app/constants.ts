// Configuration constants
export const CONFIG = {
    // API Configuration
    API_BASE_URL: "http://localhost:8000", // Change this to your actual API URL

    // WebSocket Configuration
    WEBSOCKET_URL: "ws://localhost:8000/ws", // WebSocket URL for the same server

    // Mascot Configuration
    MASCOT_COUNTDOWN_SECONDS: 5,
    MASCOT_FRAME_SWITCH_INTERVAL: 500, // milliseconds between frame switches

    // UI Configuration
    MOBILE_BREAKPOINT: 768,
} as const;

// Hunt Items
export interface FindItem {
    name: string;
    prompt: string;
}

export const HUNT_ITEMS: FindItem[] = [
    {
        name: "light switch",
        prompt: "One little switch and on comes the light / turn me off when the time is night!"
    },
    {
        name: "clock",
        prompt: "My hands move across the hour / check me when you need idk something"
    },
    {
        name: "door",
        prompt: ""
    },
    {
        name: "chair",
        prompt: ""
    },
    {
        name: "light",
        prompt: ""
    },
    {
        name: "paper",
        prompt: ""
    },
    {
        name: "book",
        prompt: ""
    },
    {
        name: "sink",
        prompt: ""
    },
    {
        name: "pencil",
        prompt: ""
    },
    {
        name: "outlet",
        prompt: ""
    },
    {
        name: "door knob",
        prompt: ""
    },
    {
        name: "backpack",
        prompt: ""
    }
];
