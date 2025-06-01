"use client";
import React, { useState } from "react";
import Mascot from "./Mascot";
import CameraFeed from "./CameraFeed";
import { HUNT_ITEMS } from "../constants";

interface HuntingProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function Hunting({ isActive, onComplete }: HuntingProps) {
  const [showMascot, setShowMascot] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const handleMascotComplete = () => {
    setShowMascot(false);
  };

  const handleItemFound = () => {
    if (currentItemIndex < HUNT_ITEMS.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);
    } else {
      // Hunt complete
      onComplete();
    }
  };

  if (!isActive) return null;

  const currentItem = HUNT_ITEMS[currentItemIndex];

  return (
    <div className="fixed inset-0 bg-black z-40">
      {/* Mascot countdown overlay */}
      <Mascot
        isActive={showMascot}
        onCountdownComplete={handleMascotComplete}
      />

      {/* Camera feed (shown after mascot countdown) */}
      {!showMascot && (
        <div className="w-full h-full">
          <CameraFeed currentItem={currentItem} onItemFound={handleItemFound} />

          {/* Progress indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
            {currentItemIndex + 1} / {HUNT_ITEMS.length}
          </div>

          {/* Exit button */}
          <button
            onClick={onComplete}
            className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors z-20"
          >
            Exit Hunt
          </button>
        </div>
      )}
    </div>
  );
}
