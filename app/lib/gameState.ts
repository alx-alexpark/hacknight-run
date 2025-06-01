// Game state management for the scavenger hunt
import { Player, Round, LeaderboardEntry } from '../types';

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
    
    // Auto-start game if all players are ready and there are at least 1 player
    const allReady = currentRound.players.length > 0 && 
                     currentRound.players.every(p => p.isReady);
    
    if (allReady && !currentRound.start) {
      currentRound.start = new Date().toISOString();
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
