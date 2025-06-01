"use client";
import React, { useState, useEffect } from "react";
import { LeaderboardEntry } from "../types";
import { CONFIG } from "../constants";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();

    // Auto-refresh every 10 seconds to show updated scores
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONFIG.API_BASE_URL}/leaderboard`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");

      const data = await response.json();
      setLeaderboard(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-lg">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 min-h-[200px] flex flex-col justify-center">
        <div className="text-lg mb-4">Error: {error}</div>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 text-white rounded mx-auto"
          style={{ backgroundColor: "#800080" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#6b006b")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#800080")
          }
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        🏆 Leaderboard
      </h2>

      {leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No players yet. Be the first to compete!
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={`${entry.name}-${index}`}
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                index === 0
                  ? "border-yellow-400 bg-yellow-50"
                  : index === 1
                  ? "border-gray-400 bg-gray-50"
                  : index === 2
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`text-xl font-bold ${
                    index === 0
                      ? "text-yellow-600"
                      : index === 1
                      ? "text-gray-600"
                      : index === 2
                      ? "text-orange-600"
                      : "text-gray-500"
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <div className="font-semibold text-gray-800">
                    {entry.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTime(entry.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  {entry.speed}s
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchLeaderboard}
        className="w-full mt-6 px-4 py-2 text-white rounded-lg transition-colors"
        style={{ backgroundColor: "#800080" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#6b006b")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#800080")
        }
      >
        🔄 Refresh
      </button>
    </div>
  );
}
