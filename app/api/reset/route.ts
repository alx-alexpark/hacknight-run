import { NextResponse } from 'next/server';
import { setCurrentRound } from '../../lib/gameState';

export async function POST() {
  try {
    // Reset the game state
    const resetRound = {
      players: [],
      start: null,
      finish: null,
      winner: null,
    };
    
    setCurrentRound(resetRound);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Game state reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting game:', error);
    return NextResponse.json(
      { error: 'Failed to reset game state' },
      { status: 500 }
    );
  }
}
