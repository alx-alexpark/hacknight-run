"use client";
import React, { useState, useEffect } from "react";
import { CONFIG } from "../constants";

interface MascotProps {
  onCountdownComplete: () => void;
  isActive: boolean;
}

export default function Mascot({ onCountdownComplete, isActive }: MascotProps) {
  const [countdown, setCountdown] = useState<number>(
    CONFIG.MASCOT_COUNTDOWN_SECONDS
  );
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isShrunken, setIsShrunken] = useState(false);

  // Mascot frames - simple emoji animation for now (can be replaced with actual images)
  const mascotFrames = ["🦊", "🐺", "🦝", "🐱"];

  useEffect(() => {
    if (!isActive) return;

    // Frame switching animation
    const frameInterval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % mascotFrames.length);
    }, CONFIG.MASCOT_FRAME_SWITCH_INTERVAL);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsShrunken(true);
          setTimeout(() => {
            onCountdownComplete();
          }, 1000); // Allow time for shrink animation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(frameInterval);
      clearInterval(countdownInterval);
    };
  }, [isActive, onCountdownComplete, mascotFrames.length]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className={`transition-all duration-1000 ease-in-out ${
          isShrunken ? "fixed bottom-4 left-4 w-16 h-16" : "w-48 h-48"
        }`}
      >
        <div className="bg-white rounded-full w-full h-full flex items-center justify-center shadow-2xl border-4 border-blue-500">
          <div className="text-center">
            <div
              className={`${
                isShrunken ? "text-2xl" : "text-6xl"
              } transition-all duration-1000`}
            >
              {mascotFrames[currentFrame]}
            </div>
            {!isShrunken && (
              <div className="text-2xl font-bold text-gray-800 mt-2">
                {countdown > 0 ? countdown : "GO!"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
