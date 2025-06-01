"use client";
import React, { useState, useEffect } from "react";
import { CONFIG } from "../constants";

interface MascotProps {
  onCountdownComplete: () => void;
  isActive: boolean;
  serverCountdown?: number; // Use server countdown if provided
  repositionToCorner?: boolean; // Whether to reposition to corner after countdown
  countdownStart?: number; // For solo/local mode, force countdown reset
}

export default function Mascot({
  onCountdownComplete,
  isActive,
  serverCountdown,
  repositionToCorner = false,
  countdownStart,
}: MascotProps) {
  const [countdown, setCountdown] = useState<number>(
    serverCountdown ?? countdownStart ?? CONFIG.MASCOT_COUNTDOWN_SECONDS
  );
  // Reset countdown when mascot is shown (isActive becomes true)
  useEffect(() => {
    if (isActive && serverCountdown === undefined) {
      setCountdown(countdownStart ?? CONFIG.MASCOT_COUNTDOWN_SECONDS);
      setIsShrunken(false);
    }
  }, [isActive, countdownStart, serverCountdown]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isShrunken, setIsShrunken] = useState(false);

  // Mascot frames - simple emoji animation for now (can be replaced with actual images)
  const mascotFrames = ["🦊", "🐺", "🦝", "🐱"];

  // Update countdown from server if provided
  useEffect(() => {
    if (serverCountdown !== undefined) {
      setCountdown(serverCountdown);
      if (serverCountdown === 0 && repositionToCorner) {
        setIsShrunken(true);
        setTimeout(() => {
          onCountdownComplete();
        }, 1000);
      }
    }
  }, [serverCountdown, repositionToCorner, onCountdownComplete]);

  useEffect(() => {
    if (!isActive) return;

    // Frame switching animation
    const frameInterval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % mascotFrames.length);
    }, CONFIG.MASCOT_FRAME_SWITCH_INTERVAL);

    // Only run local countdown if no server countdown is provided
    let countdownInterval: NodeJS.Timeout | undefined;
    if (serverCountdown === undefined) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (repositionToCorner) {
              setIsShrunken(true);
            }
            setTimeout(
              () => {
                onCountdownComplete();
              },
              repositionToCorner ? 1000 : 0
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(frameInterval);
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [
    isActive,
    onCountdownComplete,
    mascotFrames.length,
    serverCountdown,
    repositionToCorner,
  ]);

  if (!isActive) return null;

  return (
    <div
      className={`fixed z-50 ${
        isShrunken && repositionToCorner
          ? "bottom-4 left-4"
          : "inset-0 flex items-center justify-center bg-black bg-opacity-50"
      }`}
    >
      <div
        className={`transition-all duration-1000 ease-in-out ${
          isShrunken ? "w-16 h-16" : "w-48 h-48"
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
