"use client";
import React, { useState, useRef, useEffect } from "react";
import Mascot from "./Mascot";
import CameraFeed from "./CameraFeed";
import { useGameEvents } from "../hooks/useGameEvents";

interface HuntingProps {
  isActive: boolean;
  onComplete: () => void;
  playerName: string;
}

export default function Hunting({
  isActive,
  onComplete,
  playerName,
}: HuntingProps) {
  const [showMascot, setShowMascot] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isProcessingItem, setIsProcessingItem] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Track start time for each item
  const itemStartTimeRef = useRef<number | null>(null);

  // Get real-time game data
  const { round, player } = useGameEvents(playerName);

  // Start timing when we begin hunting an item (after mascot countdown)
  useEffect(() => {
    if (!showMascot && round?.gameActive && !itemStartTimeRef.current) {
      itemStartTimeRef.current = Date.now();
    }
  }, [showMascot, round?.gameActive]);

  // Reset timing when moving to next item
  useEffect(() => {
    itemStartTimeRef.current = Date.now();
  }, [currentItemIndex]);

  const handleMascotComplete = () => {
    setShowMascot(false);
  };

  const handleItemFound = async () => {
    if (!player?.id || !round?.currentItems || isProcessingItem) return;

    setIsProcessingItem(true);

    try {
      // Calculate actual time taken for this item
      const timeNow = Date.now();
      const timeTaken = itemStartTimeRef.current
        ? Math.round((timeNow - itemStartTimeRef.current) / 1000) // Convert to seconds
        : 30; // Fallback to 30 seconds if timing failed

      console.log(`Item ${currentItemIndex} found in ${timeTaken} seconds`);

      // Record the item found on the server with retry logic
      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const response = await fetch("/api/item-found", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerId: player.id,
              itemIndex: currentItemIndex,
              timeTaken: timeTaken,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          success = true;
        } catch (error) {
          retries--;
          console.warn(
            `Failed to record item found (${3 - retries}/3):`,
            error
          );

          if (retries > 0) {
            // Wait 1 second before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (!success) {
        console.error("Failed to record item found after 3 retries");
        setNetworkError(
          "Failed to save progress. Your hunt will continue offline."
        );
        // Clear error after 5 seconds
        setTimeout(() => setNetworkError(null), 5000);
      } else {
        setNetworkError(null);
      }

      // Move to next item or complete
      if (currentItemIndex < round.currentItems.length - 1) {
        setCurrentItemIndex((prev) => prev + 1);
        // itemStartTimeRef will be reset by useEffect
      } else {
        // Hunt complete - all 3 items found
        console.log("All items found! Completing hunt...");
        onComplete();
      }
    } catch (error) {
      console.error("Error in handleItemFound:", error);
      // Still allow progression on error
      if (currentItemIndex < (round?.currentItems?.length || 3) - 1) {
        setCurrentItemIndex((prev) => prev + 1);
      } else {
        onComplete();
      }
    } finally {
      setIsProcessingItem(false);
    }
  };

  if (!isActive || !round?.currentItems) return null;

  const currentItem = round.currentItems[currentItemIndex];
  const totalItems = round.currentItems.length;
  const itemsCompleted = player?.itemsFound || 0;

  return (
    <div className="fixed inset-0 bg-black z-40">
      {/* Mascot countdown overlay */}
      <Mascot
        isActive={showMascot}
        onCountdownComplete={handleMascotComplete}
        serverCountdown={round?.countdown}
        repositionToCorner={true}
      />

      {/* Camera feed (shown after mascot countdown) */}
      {!showMascot && (
        <div className="w-full h-full">
          <CameraFeed currentItem={currentItem} onItemFound={handleItemFound} />

          {/* Enhanced Progress indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg border-2 border-green-400">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {currentItemIndex + 1} / {totalItems}
              </div>
              <div className="text-xs text-gray-300">Items Found</div>
              {itemsCompleted > 0 && (
                <div className="text-xs text-green-300 mt-1">
                  ✅ Completed: {itemsCompleted}
                </div>
              )}
            </div>
          </div>

          {/* Current item details */}
          <div className="absolute top-4 left-4 right-20 bg-black bg-opacity-90 text-white p-4 rounded-lg border border-blue-400">
            <h3 className="text-lg font-bold mb-2 text-blue-400">
              Find: {currentItem.name}
            </h3>
            {currentItem.prompt && (
              <p className="text-sm italic text-gray-300">
                {currentItem.prompt}
              </p>
            )}
          </div>

          {/* Network error indicator */}
          {networkError && (
            <div className="absolute top-20 left-4 right-4 bg-red-500 text-white p-3 rounded-lg border border-red-600 animate-pulse">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span className="text-sm">{networkError}</span>
              </div>
            </div>
          )}

          {/* Exit button */}
          <button
            onClick={onComplete}
            className="absolute bottom-4 left-4 px-4 py-2 text-white rounded-lg transition-colors z-20 font-semibold"
            style={{ backgroundColor: "#800080" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#6b006b")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#800080")
            }
          >
            Exit Hunt
          </button>

          {/* Completion status for all items */}
          {itemsCompleted === totalItems && (
            <div className="absolute bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg font-bold animate-pulse">
              🎉 All Items Found! Returning to leaderboard...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
