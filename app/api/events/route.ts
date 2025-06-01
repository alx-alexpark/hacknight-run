import { NextRequest } from 'next/server';
import { getCurrentRound, addPlayerToRound, addSSEClient, removeSSEClient } from '../../lib/gameState';
import { Player } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerName = searchParams.get('player_name');
  
  if (!playerName) {
    return new Response('Missing player_name parameter', { status: 400 });
  }

  // Create a new player
  const player: Player = {
    id: uuidv4(),
    name: playerName,
  };

  // Add player to current round
  addPlayerToRound(player);

  const stream = new ReadableStream({
    start(controller) {
      // Add this controller to our clients with the player ID
      addSSEClient(controller, player.id);

      // Send initial player data
      controller.enqueue(`data: ${JSON.stringify({
        t: "player",
        player: player
      })}\n\n`);

      // Send initial round data
      controller.enqueue(`data: ${JSON.stringify({
        t: "round", 
        round: getCurrentRound()
      })}\n\n`);

      // Set up periodic round updates
      const interval = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({
            t: "round",
            round: getCurrentRound()
          })}\n\n`);
        } catch (error) {
          console.error('Error sending round update:', error);
          clearInterval(interval);
          removeSSEClient(controller);
        }
      }, 1000);

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        removeSSEClient(controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
