import { NextRequest } from 'next/server';
import { getCurrentRound, addPlayerToRound } from '../../lib/gameState';
import { Player } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
    // Multiplayer/SSE is no longer supported
    return new Response('Multiplayer and SSE are no longer supported.', { status: 410 });
}
