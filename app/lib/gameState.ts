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

let countdownInterval: NodeJS.Timeout | null = null;

export function getCurrentRound(): Round {
    return { ...currentRound };
}

export function setCurrentRound(round: Round): void {
    currentRound = { ...round };
    // broadcastRoundUpdate();
}

export function addPlayerToRound(player: Player): void {
    if (!currentRound.players.find(p => p.id === player.id)) {
        currentRound.players.push({ ...player, isReady: false });
        // broadcastRoundUpdate();
    }
}

export function removePlayerFromRound(playerId: string): void {
    const index = currentRound.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
        currentRound.players.splice(index, 1);
        // broadcastRoundUpdate();
    }
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

        // broadcastRoundUpdate();
    }
}

export function startCountdown(): void {
    currentRound.countdown = 5;
    currentRound.currentItems = selectRandomItems();
    // broadcastRoundUpdate();

    countdownInterval = setInterval(() => {
        if (currentRound.countdown && currentRound.countdown > 1) {
            currentRound.countdown--;
            // broadcastRoundUpdate();
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

            // broadcastAnnouncement({
            //     message: "Game Started! Find the items!",
            //     type: "game_start"
            // });
            // broadcastRoundUpdate();
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

    // broadcastAnnouncement({
    //     message: "Game stopped by admin",
    //     type: "game_end"
    // });
    // broadcastRoundUpdate();
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

        // broadcastAnnouncement({
        //     message: `${player.name} found ${itemName}!`,
        //     type: "item_found",
        //     playerName: player.name,
        //     itemName: itemName,
        //     itemCount: player.itemsFound
        // });

        // broadcastRoundUpdate();
    }
}

export function getReadyPlayerCount(): number {
    return currentRound.players.filter(p => p.isReady).length;
}

export function areAllPlayersReady(): boolean {
    return currentRound.players.length > 0 &&
        currentRound.players.every(p => p.isReady);
}

// function broadcastRoundUpdate(): void {
//     const message = {
//         t: "round",
//         round: currentRound
//     };

//     // Assuming connectedClients is a global or higher scoped variable
//     connectedClients.forEach((playerId, controller) => {
//         try {
//             controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
//         } catch (error) {
//             console.error('Error broadcasting to SSE client:', error);
//             connectedClients.delete(controller);
//         }
//     });
// }

// function broadcastAnnouncement(announcement: {
//     message: string;
//     type: "item_found" | "game_start" | "game_end";
//     playerName?: string;
//     itemName?: string;
//     itemCount?: number;
// }): void {
//     const message = {
//         t: "announcement",
//         announcement
//     };

//     // Assuming connectedClients is a global or higher scoped variable
//     connectedClients.forEach((playerId, controller) => {
//         try {
//             controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
//         } catch (error) {
//             console.error('Error broadcasting announcement to SSE client:', error);
//             connectedClients.delete(controller);
//         }
//     });
// }
