import { NextResponse } from 'next/server';
import { getLeaderboard } from '../../lib/gameState';

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
