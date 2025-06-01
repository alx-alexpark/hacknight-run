// Simple test script to simulate multiple players
const EventSource = require('eventsource');

async function testPlayer(playerName) {
  console.log(`\n=== ${playerName} connecting ===`);
  
  const eventSource = new EventSource(`http://localhost:3000/api/events?player_name=${encodeURIComponent(playerName)}`);
  
  let playerId = null;
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.t === "player") {
      playerId = data.player.id;
      console.log(`${playerName}: Got player ID ${playerId}`);
    } else if (data.t === "round") {
      console.log(`${playerName}: Round update - ${data.round.players.length} players, ${data.round.players.filter(p => p.isReady).length} ready`);
      if (data.round.start) {
        console.log(`${playerName}: GAME STARTED!`);
      }
    }
  };
  
  eventSource.onerror = (error) => {
    console.log(`${playerName}: Connection error`, error);
  };
  
  // After 2 seconds, set player as ready
  setTimeout(async () => {
    if (playerId) {
      console.log(`${playerName}: Setting ready status...`);
      try {
        const response = await fetch('http://localhost:3000/api/player-ready', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, isReady: true })
        });
        console.log(`${playerName}: Ready request sent, status: ${response.status}`);
      } catch (error) {
        console.log(`${playerName}: Error setting ready:`, error.message);
      }
    }
  }, 2000);
  
  return { eventSource, getPlayerId: () => playerId };
}

async function main() {
  console.log("Testing multi-player functionality...");
  
  // Create 3 test players
  const player1 = await testPlayer("Alice");
  const player2 = await testPlayer("Bob");
  const player3 = await testPlayer("Charlie");
  
  // Keep running for 10 seconds
  setTimeout(() => {
    console.log("\n=== Disconnecting all players ===");
    player1.eventSource.close();
    player2.eventSource.close();
    player3.eventSource.close();
    
    // Check final status
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/status');
        const status = await response.json();
        console.log("Final status:", JSON.stringify(status, null, 2));
        process.exit(0);
      } catch (error) {
        console.log("Error getting final status:", error.message);
        process.exit(1);
      }
    }, 1000);
  }, 10000);
}

main().catch(console.error);
