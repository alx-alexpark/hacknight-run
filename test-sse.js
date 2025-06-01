// Test script to verify SSE connection and player functionality
const { EventSource } = require('eventsource');

console.log('🧪 Testing SSE connection...');

// Test 1: Connect as a player
const playerName = 'TestPlayer' + Math.random().toString(36).substring(7);
const url = `http://localhost:3000/api/events?player_name=${encodeURIComponent(playerName)}`;

console.log(`Connecting to: ${url}`);

const eventSource = new EventSource(url);

eventSource.onopen = () => {
    console.log('✅ SSE connected successfully');
};

eventSource.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log('📨 Received message:', data);
        
        if (data.t === 'player') {
            console.log(`👤 Player data: ${data.player.name} (ID: ${data.player.id})`);
            
            // Test 2: Set player ready
            setTimeout(() => {
                console.log('🚀 Setting player ready...');
                fetch('http://localhost:3000/api/player-ready', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: data.player.id,
                        isReady: true
                    })
                }).then(res => {
                    if (res.ok) {
                        console.log('✅ Player ready status set successfully');
                    } else {
                        console.error('❌ Failed to set player ready:', res.status);
                    }
                }).catch(err => {
                    console.error('❌ Error setting player ready:', err.message);
                });
            }, 2000);
        } else if (data.t === 'round') {
            console.log(`🎯 Round data: ${data.round.players.length} players, ${data.round.players.filter(p => p.isReady).length} ready`);
            if (data.round.players.length > 0) {
                data.round.players.forEach(p => {
                    console.log(`   - ${p.name}: ${p.isReady ? 'READY' : 'waiting'}`);
                });
            }
        } else if (data.t === 'announcement') {
            console.log(`📢 Announcement: ${data.announcement.message}`);
        }
    } catch (err) {
        console.error('❌ Failed to parse message:', err.message);
    }
};

eventSource.onerror = (event) => {
    console.error('❌ SSE error:', event);
};

// Close connection after 10 seconds
setTimeout(() => {
    console.log('🔌 Closing connection...');
    eventSource.close();
    process.exit(0);
}, 10000);
