import React, { useEffect, useState } from "react";
import Image from "next/image";

interface CountdownProps {
  onComplete: () => void;
}

const images = [
  "/sprites/countdown3.png",
  "/sprites/countdown2.png",
  "/sprites/countdown1.png",
];

export default function Countdown({ onComplete }: CountdownProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < images.length) {
      const timeout = setTimeout(() => setStep(step + 1), 1000);
      return () => clearTimeout(timeout);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  if (step >= images.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700 bg-opacity-90">
      <Image
        src={images[step]}
        alt={`Countdown ${3 - step}`}
        width={192}
        height={192}
        className="object-contain drop-shadow-2xl"
        priority
      />
    </div>
  );
}
