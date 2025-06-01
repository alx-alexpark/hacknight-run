// Game state management for the scavenger hunt
import { Player, Round, LeaderboardEntry, FindItem } from '../types';
import { HUNT_ITEMS } from '../constants';

// In-memory storage (in production, you'd use a database)
let currentRound: Round = {
    players: [],
    start: null,
    finish: null,
    winner: null,
};

const leaderboardData: LeaderboardEntry[] = [
    {
        name: "Julian",
        timestamp: "2025-02-05T00:00:00.000Z",
        speed: 44
    },
    {
        name: "Julian 2",
        timestamp: "2025-02-06T00:00:00.000Z",
        speed: 60
    },
    {
        name: "Julian 3",
        timestamp: "2025-02-07T00:00:00.000Z",
        speed: 99
    },
    {
        name: "Julian 4",
        timestamp: "2025-04-15T00:00:00.000Z",
        speed: 200
    }
];

// Connected SSE clients with their player IDs
const connectedClients = new Map<ReadableStreamDefaultController, string>();

export function getCurrentRound(): Round {
    return { ...currentRound };
}

export function setCurrentRound(round: Round): void {
    currentRound = { ...round };
    broadcastRoundUpdate();
}

export function addPlayerToRound(player: Player): void {
    if (!currentRound.players.find(p => p.id === player.id)) {
        currentRound.players.push({ ...player, isReady: false });
        broadcastRoundUpdate();
    }
}

export function removePlayerFromRound(playerId: string): void {
    const index = currentRound.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
        currentRound.players.splice(index, 1);
        broadcastRoundUpdate();
    }
}

export function getLeaderboard(): LeaderboardEntry[] {
    return [...leaderboardData].sort((a, b) => b.speed - a.speed);
}

export function addToLeaderboard(item: LeaderboardEntry): void {
    leaderboardData.push(item);
}

export function setPlayerReady(playerId: string, isReady: boolean): void {
    const player = currentRound.players.find(p => p.id === playerId);
    if (player) {
        player.isReady = isReady;

        // Auto-start countdown if all players are ready and there are at least 1 player
        const allReady = currentRound.players.length > 0 &&
            currentRound.players.every(p => p.isReady);

        if (allReady && !currentRound.start && !currentRound.countdown) {
            startCountdown();
        }

        broadcastRoundUpdate();
    }
}

let countdownInterval: NodeJS.Timeout | null = null;

export function startCountdown(): void {
    currentRound.countdown = 5;
    currentRound.currentItems = selectRandomItems();
    broadcastRoundUpdate();

    countdownInterval = setInterval(() => {
        if (currentRound.countdown && currentRound.countdown > 1) {
            currentRound.countdown--;
            broadcastRoundUpdate();
        } else {
            // Countdown finished, start the game
            currentRound.countdown = 0;
            currentRound.start = new Date().toISOString();
            currentRound.gameActive = true;

            // Clear countdown interval
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }

            broadcastAnnouncement({
                message: "Game Started! Find the items!",
                type: "game_start"
            });
            broadcastRoundUpdate();
        }
    }, 1000);
}

export function selectRandomItems(): FindItem[] {
    const enabledItems = HUNT_ITEMS.filter(item => item.enabled);
    const shuffled = [...enabledItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

export function stopGame(): void {
    currentRound.finish = new Date().toISOString();
    currentRound.gameActive = false;

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    broadcastAnnouncement({
        message: "Game stopped by admin",
        type: "game_end"
    });
    broadcastRoundUpdate();
}

export function playerFoundItem(playerId: string, itemIndex: number, timeTaken: number): void {
    const player = currentRound.players.find(p => p.id === playerId);
    if (player) {
        if (!player.itemTimes) player.itemTimes = [];
        if (!player.itemsFound) player.itemsFound = 0;

        player.itemTimes[itemIndex] = timeTaken;
        player.itemsFound++;

        // Calculate total time (average of completed items)
        const completedTimes = player.itemTimes.filter(time => time !== undefined);
        player.totalTime = completedTimes.reduce((sum, time) => sum + time, 0) / completedTimes.length;

        const itemName = currentRound.currentItems?.[itemIndex]?.name || "item";

        broadcastAnnouncement({
            message: `${player.name} found ${itemName}!`,
            type: "item_found",
            playerName: player.name,
            itemName: itemName,
            itemCount: player.itemsFound
        });

        // Check if player completed all items
        if (player.itemsFound === 3) {
            addToLeaderboard({
                name: player.name,
                timestamp: new Date().toISOString(),
                speed: Math.round(player.totalTime || 0)
            });
        }

        broadcastRoundUpdate();
    }
}

export function getReadyPlayerCount(): number {
    return currentRound.players.filter(p => p.isReady).length;
}

export function areAllPlayersReady(): boolean {
    return currentRound.players.length > 0 &&
        currentRound.players.every(p => p.isReady);
}

// ...existing code...

export function addSSEClient(controller: ReadableStreamDefaultController, playerId: string): void {
    connectedClients.set(controller, playerId);
}

export function removeSSEClient(controller: ReadableStreamDefaultController): void {
    const playerId = connectedClients.get(controller);
    connectedClients.delete(controller);

    // Also remove the player from the round if they disconnect
    if (playerId) {
        removePlayerFromRound(playerId);
    }
}

function broadcastRoundUpdate(): void {
    const message = {
        t: "round",
        round: currentRound
    };

    connectedClients.forEach((playerId, controller) => {
        try {
            controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
            console.error('Error broadcasting to SSE client:', error);
            connectedClients.delete(controller);
        }
    });
}

function broadcastAnnouncement(announcement: {
    message: string;
    type: "item_found" | "game_start" | "game_end";
    playerName?: string;
    itemName?: string;
    itemCount?: number;
}): void {
    const message = {
        t: "announcement",
        announcement
    };

    connectedClients.forEach((playerId, controller) => {
        try {
            controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
            console.error('Error broadcasting announcement to SSE client:', error);
            connectedClients.delete(controller);
        }
    });
}
