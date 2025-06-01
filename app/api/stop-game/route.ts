import { NextRequest, NextResponse } from 'next/server';
import { stopGame } from '../../lib/gameState';

export async function POST(request: NextRequest) {
    try {
        stopGame();

        return NextResponse.json({
            success: true,
            message: "Game stopped successfully"
        });
    } catch (error) {
        console.error('Error stopping game:', error);
        return NextResponse.json(
            { error: 'Failed to stop game' },
            { status: 500 }
        );
    }
}
