import { NextResponse } from 'next/server';
import { getCurrentRound, getReadyPlayerCount, areAllPlayersReady } from '../../lib/gameState';

export async function GET() {
    try {
        const round = getCurrentRound();
        const readyCount = getReadyPlayerCount();
        const allReady = areAllPlayersReady();

        return NextResponse.json({
            round,
            readyCount,
            totalPlayers: round.players.length,
            allReady,
            isGameActive: !!round.start,
        });
    } catch (error) {
        console.error('Error getting game status:', error);
        return NextResponse.json(
            { error: 'Failed to get game status' },
            { status: 500 }
        );
    }
}
