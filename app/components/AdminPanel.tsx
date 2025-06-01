"use client";
import React, { useState } from "react";

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleStopGame = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stop-game", {
        method: "POST",
      });

      if (response.ok) {
        setMessage({ text: "Game stopped successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to stop game", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Network error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetGame = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reset", {
        method: "POST",
      });

      if (response.ok) {
        setMessage({ text: "Game reset successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to reset game", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Network error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🔧 Admin Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleStopGame}
            disabled={loading}
            className="w-full px-4 py-3 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: loading ? undefined : "#800080" }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.backgroundColor = "#6b006b";
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.backgroundColor = "#800080";
            }}
          >
            {loading ? "Stopping..." : "🛑 Stop Current Game"}
          </button>

          <button
            onClick={handleResetGame}
            disabled={loading}
            className="w-full px-4 py-3 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: loading ? undefined : "#800080" }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.backgroundColor = "#6b006b";
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.backgroundColor = "#800080";
            }}
          >
            {loading ? "Resetting..." : "🔄 Reset Game"}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Stop Game:</strong> Ends the current round immediately
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Reset Game:</strong> Clears all players and resets the
              round
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
