"use client";
import React, { useState, useRef, useEffect } from "react";
import Mascot from "./Mascot";
import CameraFeed from "./CameraFeed";
import { HUNT_ITEMS } from "../constants";

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
  // Use a unique key for each run to prevent Mascot remount/reset
  const [runKey, setRunKey] = useState(() => Date.now());
  // Skip mascot/countdown for instant start
  const [showMascot, setShowMascot] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isProcessingItem, setIsProcessingItem] = useState(false);

  // Track start time for each item
  const itemStartTimeRef = useRef<number | null>(null);

  // For solo mode: pick 3 random items from HUNT_ITEMS
  const [items] = useState(() => {
    // Shuffle and pick 3
    const enabled = HUNT_ITEMS.filter((item) => item.enabled !== false);
    for (let i = enabled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [enabled[i], enabled[j]] = [enabled[j], enabled[i]];
    }
    return enabled.slice(0, 3);
  });

  // Start timing when we begin hunting an item (after mascot countdown)
  useEffect(() => {
    if (!showMascot && !itemStartTimeRef.current) {
      itemStartTimeRef.current = Date.now();
    }
  }, [showMascot]);

  // Reset timing when moving to next item
  useEffect(() => {
    itemStartTimeRef.current = Date.now();
  }, [currentItemIndex]);

  const handleMascotComplete = () => {
    setShowMascot(false);
  };

  // Whenever mascot is shown, reset runKey to force Mascot remount and countdown reset
  useEffect(() => {
    if (showMascot) {
      setRunKey(Date.now());
    }
  }, [showMascot]);

  // When the hunt completes, show mascot for next run
  useEffect(() => {
    if (!isActive) {
      setShowMascot(true);
    }
  }, [isActive]);

  const handleItemFound = async () => {
    if (isProcessingItem) return;
    setIsProcessingItem(true);
    try {
      // Calculate actual time taken for this item
      const timeNow = Date.now();
      const timeTaken = itemStartTimeRef.current
        ? Math.round((timeNow - itemStartTimeRef.current) / 1000)
        : 30;
      console.log(`Item ${currentItemIndex} found in ${timeTaken} seconds`);
      // Move to next item or complete
      if (currentItemIndex < items.length - 1) {
        setCurrentItemIndex((prev) => prev + 1);
        // itemStartTimeRef will be reset by useEffect
      } else {
        // Hunt complete - all items found
        console.log("All items found! Completing hunt...");
        onComplete();
      }
    } finally {
      setIsProcessingItem(false);
    }
  };

  // Call onComplete when all items are found (never call useEffect conditionally)
  useEffect(() => {
    if (currentItemIndex >= items.length) {
      onComplete();
    }
  }, [currentItemIndex, items.length, onComplete]);

  if (!isActive || !items.length) return null;
  if (currentItemIndex < 0 || currentItemIndex >= items.length) {
    // Optionally show a loading spinner or nothing
    return null;
  }

  const currentItem = items[currentItemIndex];
  const totalItems = items.length;
  const itemsCompleted = currentItemIndex; // For solo mode

  return (
    <div className="fixed inset-0 bg-black z-40">
      {/* Mascot countdown overlay */}
      <Mascot
        key={runKey}
        isActive={showMascot}
        onCountdownComplete={handleMascotComplete}
        countdownStart={5}
      />

      {/* Camera feed (shown after mascot countdown) */}
      {/* CameraFeed is always mounted, but hidden when mascot is shown */}
      <div
        className="w-full h-full"
        style={{ display: showMascot ? "none" : "block" }}
      >
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
            <p className="text-sm italic text-gray-300">{currentItem.prompt}</p>
          )}
        </div>

        {/* Completion status for all items */}
        {itemsCompleted === totalItems && (
          <div className="absolute bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg font-bold animate-pulse">
            🎉 All Items Found!
          </div>
        )}
      </div>
    </div>
  );
}
