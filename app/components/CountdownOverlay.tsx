import React, { useState } from "react";

interface CountdownOverlayProps {
  onComplete: () => void;
}

const countdownImages = [
  "/sprites/countdown3.png",
  "/sprites/countdown2.png",
  "/sprites/countdown1.png",
];

export default function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [step, setStep] = useState(0);

  React.useEffect(() => {
    if (step < countdownImages.length) {
      const timeout = setTimeout(() => setStep(step + 1), 1000);
      return () => clearTimeout(timeout);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  if (step >= countdownImages.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <img
        src={countdownImages[step]}
        alt={`Countdown ${3 - step}`}
        className="w-48 h-48 object-contain animate-pulse"
      />
    </div>
  );
}
