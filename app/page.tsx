"use client";
import React, { useState, useEffect } from "react";
import Leaderboard from "./components/Leaderboard";
import Hunting from "./components/Hunting";
import { useWebSocket } from "./hooks/useWebSocket";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [currentView, setCurrentView] = useState<"leaderboard" | "hunting">(
    "leaderboard"
  );

  const { player, round, isConnected, error, connect, isRoundActive } =
    useWebSocket(playerName);

  useEffect(() => {
    if (isNameSet && playerName) {
      connect();
    }
  }, [isNameSet, playerName, connect]);

  useEffect(() => {
    if (isRoundActive) {
      setCurrentView("hunting");
    } else {
      setCurrentView("leaderboard");
    }
  }, [isRoundActive]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setIsNameSet(true);
    }
  };

  const handleHuntComplete = () => {
    setCurrentView("leaderboard");
  };

  // Name entry screen
  if (!isNameSet) {
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
