"use client";
import React, { useState, useEffect } from "react";
import { CONFIG } from "../constants";
import Link from "next/link";
import { Player, Round } from '../types';

export default function AdminPage() {
  const [gameStatus, setGameStatus] = useState<"idle" | "active">("idle");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{text: string, type: "success" | "error"} | null>(null);

  useEffect(() => {
    // Fetch game status on load
    fetchStatus();

    // Poll status every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error("Failed to fetch status");
      
      const data = await response.json();
      setGameStatus(data.isGameActive ? "active" : "idle");
      setPlayers(data.round?.players || []);
    } catch (err) {
      console.error("Error fetching status:", err);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    setMessage(null);
    if (players.length === 0) {
      setMessage({text: "No players connected. Cannot start game.", type: "error"});
      return;
    }
    try {
      const response = await fetch('/api/start-game', { method: 'POST' });

      // Define a more specific type for the expected success/error response
      type ApiResponse = {
        success?: boolean;
        message?: string;
        round?: Round; // Use the imported Round type
        error?: string;
      };

      let data: ApiResponse;
      try {
        // Attempt to parse the JSON response
        data = await response.json() as ApiResponse;
      } catch (parseError: unknown) {
        // If response.json() fails (e.g., not valid JSON), it's an error.
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`Failed to parse server response (status: ${response.status} ${response.statusText || ''}). Parse Error: ${errorMessage}`);
      }

      // Check if the parsed data is an object and has an 'error' property.
      const apiError = data?.error;

      // If the response was not OK (e.g., 4xx, 5xx status) or if the API explicitly sent an error field
      if (!response.ok || apiError) {
        // Construct a detailed error message.
        // Use the apiError if available, otherwise create a generic one including status and a snippet of the response data.
        const errorMessage = apiError || 
                             `Server error (status: ${response.status} ${response.statusText || ''}). ${
                                 data ? "Response: " + JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? "..." : "") : "No response data."
                             }`;
        throw new Error(errorMessage);
      }

      // If we reach here, the game start was successful according to the API
      setGameStatus("active");
      setMessage({text: data.message || 'Game started successfully!', type: "success"});
      fetchStatus();
    } catch (error: unknown) {
      console.error("startGame error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage({text: `Error: ${errorMessage}`, type: "error"});
    }
  };

  const stopGame = async () => {
    try {
      const response = await fetch('/api/stop-game', { method: 'POST' });
      if (!response.ok) throw new Error("Failed to stop game");
      
      setGameStatus("idle");
      setMessage({text: "Game stopped successfully!", type: "success"});
      fetchStatus();
    } catch (err) {
      console.error("Error stopping game:", err);
      setMessage({text: "Failed to stop game", type: "error"});
    }
  };

  const resetGame = async () => {
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (!response.ok) throw new Error("Failed to reset game");
      
      setMessage({text: "Game reset successfully!", type: "success"});
      fetchStatus();
    } catch (err) {
      console.error("Error resetting game:", err);
      setMessage({text: "Failed to reset game", type: "error"});
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">🎮 Admin Control Panel</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Game Status</h2>
          <span className={`px-4 py-2 rounded-full text-white font-bold ${gameStatus === "active" ? "bg-green-500" : "bg-gray-500"}`}>
            {gameStatus === "active" ? "🎮 ACTIVE" : "⏸️ IDLE"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button 
            onClick={startGame} 
            disabled={gameStatus === "active"}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            🚀 Start Game
          </button>
          
          <button 
            onClick={stopGame}
            disabled={gameStatus === "idle"}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            ⏹️ Stop Game
          </button>
          
          <button 
            onClick={resetGame}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            🔄 Reset Game
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-4">Connected Players</h2>
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : players.length === 0 ? (
          <p className="text-center text-gray-500">No players connected</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border">Name</th>
                  <th className="text-left p-3 border">Status</th>
                  <th className="text-left p-3 border">Items Found</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 border">{player.name}</td>
                    <td className="p-3 border">
                      {(player.itemsFound ?? 0) === 3 ? "✅ Completed" : (player.itemsFound ?? 0) > 0 ? "🔍 Hunting" : "⏳ Waiting"}
                    </td>
                    <td className="p-3 border">{player.itemsFound ?? 0}/3</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-500 hover:underline">Return to Game</Link> | 
          <Link href="/leaderboard" className="ml-4 text-blue-500 hover:underline">View Leaderboard</Link>
        </div>
      </div>
    </div>
  );
}