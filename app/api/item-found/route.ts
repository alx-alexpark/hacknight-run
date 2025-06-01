import { NextRequest, NextResponse } from 'next/server';
import { playerFoundItem } from '../../lib/gameState';

export async function POST(request: NextRequest) {
    try {
        const { playerId, itemIndex, timeTaken } = await request.json();

        if (!playerId || itemIndex === undefined || !timeTaken) {
            return NextResponse.json(
                { error: 'Missing required fields: playerId, itemIndex, timeTaken' },
                { status: 400 }
            );
        }

        playerFoundItem(playerId, itemIndex, timeTaken);

        return NextResponse.json({
            success: true,
            message: "Item found recorded successfully"
        });
    } catch (error) {
        console.error('Error recording item found:', error);
        return NextResponse.json(
            { error: 'Failed to record item found' },
            { status: 500 }
        );
    }
}
