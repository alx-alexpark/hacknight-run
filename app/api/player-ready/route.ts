import { NextRequest, NextResponse } from 'next/server';
import { setPlayerReady } from '../../lib/gameState';

export async function POST(request: NextRequest) {
    try {
        const { playerId, isReady } = await request.json();

        if (!playerId || typeof isReady !== 'boolean') {
            return NextResponse.json(
                { error: 'Invalid playerId or isReady value' },
                { status: 400 }
            );
        }

        setPlayerReady(playerId, isReady);

        return NextResponse.json({
            success: true,
            message: `Player ready status updated to ${isReady}`
        });
    } catch (error) {
        console.error('Error setting player ready:', error);
        return NextResponse.json(
            { error: 'Failed to set player ready status' },
            { status: 500 }
        );
    }
}
