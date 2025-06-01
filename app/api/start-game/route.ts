import { NextResponse } from 'next/server';
import { getCurrentRound, setCurrentRound } from '../../lib/gameState';

export async function POST() {
    try {
        const currentRound = getCurrentRound();

        // Only start if there are players and game hasn't started yet
        if (currentRound.players.length > 0 && !currentRound.start) {
            const updatedRound = {
                ...currentRound,
                start: new Date(),
                finish: null,
            };

            setCurrentRound(updatedRound);

            return NextResponse.json({
                success: true,
                message: 'Game started!',
                round: updatedRound
            });
        } else if (currentRound.start) {
            return NextResponse.json(
                { error: 'Game already started' },
                { status: 400 }
            );
        } else {
            return NextResponse.json(
                { error: 'No players in the game' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error starting game:', error);
        return NextResponse.json(
            { error: 'Failed to start game' },
            { status: 500 }
        );
    }
}
