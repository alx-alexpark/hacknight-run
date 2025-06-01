import { NextResponse } from 'next/server';
import { getLeaderboard, addToLeaderboard } from '../../lib/gameState';

export async function GET() {
    try {
        const leaderboard = getLeaderboard();
        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const entry = await request.json();
        if (!entry || !entry.name || !entry.timestamp || typeof entry.speed !== 'number') {
            return NextResponse.json(
                { error: 'Invalid leaderboard entry' },
                { status: 400 }
            );
        }
        addToLeaderboard(entry);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding leaderboard entry:', error);
        return NextResponse.json(
            { error: 'Failed to add leaderboard entry' },
            { status: 500 }
        );
    }
}
