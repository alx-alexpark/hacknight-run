"use client";
import React, { useState, useEffect } from "react";
import Leaderboard from "./components/Leaderboard";
import Hunting from "./components/Hunting";
import { useGameEvents } from "./hooks/useGameEvents";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState<"entering" | "waiting" | "playing">("entering");
  const [currentView, setCurrentView] = useState<"leaderboard" | "hunting">(
    "leaderboard"
  );

  const {
    player,
    round,
    isConnected,
    error,
    isRoundActive,
  } = useGameEvents(gameState === "waiting" || gameState === "playing" ? playerName : "");

  useEffect(() => {
    if (isRoundActive && gameState === "waiting") {
      setGameState("playing");
      setCurrentView("hunting");
    } else if (!isRoundActive && gameState === "playing") {
      setCurrentView("leaderboard");
    }
  }, [isRoundActive, gameState]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setGameState("waiting");
    }
  };

  const handleStartGame = async () => {
    if (!player?.id) return;
    
    try {
      const response = await fetch('/api/player-ready', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: player.id,
          isReady: !player.isReady,
        }),
      });
      if (!response.ok) throw new Error('Failed to set ready status');
    } catch (err) {
      console.error('Error setting ready status:', err);
    }
  };

  const handleHuntComplete = () => {
    setCurrentView("leaderboard");
  };

  // Name entry screen
  if (gameState === "entering") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            🔍 Scavange
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Enter your name to join the hunt!
          </p>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Join Game
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Waiting room screen
  if (gameState === "waiting") {
    const readyCount = round?.players?.filter(p => p.isReady).length || 0;
    const totalPlayers = round?.players?.length || 0;
    const allReady = totalPlayers > 0 && readyCount === totalPlayers;
    
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-white/20">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🎯 Waiting Room
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome, <span className="font-semibold text-indigo-600">{player?.name}</span>!
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <p className="text-2xl font-bold text-gray-700 mb-3">
                  Players Ready: <span className="text-indigo-600">{readyCount}/{totalPlayers}</span>
                </p>
                {round?.players && round.players.length > 0 && (
                  <div className="space-y-2">
                    {round.players.map((p) => (
                      <div key={p.id} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-100">
                        <span className="font-semibold text-gray-700">{p.name}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          p.isReady 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {p.isReady ? '✅ Ready' : '⏳ Waiting'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {allReady ? (
              <div className="text-center py-4 px-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-600 font-bold text-lg mb-1">
                  🚀 All players ready!
                </div>
                <div className="text-green-500 text-sm animate-pulse">
                  Starting game...
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartGame}
                className={`w-full px-6 py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 ${
                  player?.isReady
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-200 border-2 border-red-400'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-200 border-2 border-green-400 animate-pulse'
                }`}
              >
                {player?.isReady ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">❌</span>
                    <span>Cancel Ready</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">✅</span>
                    <span>READY UP!</span>
                  </span>
                )}
              </button>
            )}

            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Header */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">🔍 Scavange</h1>
          <div className="text-right">
            {player && (
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{player.name}</span>
              </div>
            )}
            <div
              className={`text-xs ${
                isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      {/* Round status */}
      {round && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 mx-4 mt-4 rounded">
          {isRoundActive ? (
            <div className="text-center font-semibold">
              🚀 Hunt is ACTIVE! {round.players.length} players participating
            </div>
          ) : round.finish ? (
            <div className="text-center">
              🏁 Round finished!{" "}
              {round.winner ? `Winner: ${round.winner.name}` : "No winner yet"}
            </div>
          ) : (
            <div className="text-center">
              ⏳ Waiting for round to start... {round.players.length} players
              ready
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="p-4">
        {currentView === "leaderboard" ? (
          <Leaderboard />
        ) : (
          <Hunting
            isActive={currentView === "hunting"}
            onComplete={handleHuntComplete}
          />
        )}
      </div>
    </main>
  );
}
