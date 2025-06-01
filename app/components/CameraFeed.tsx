"use client";
import React, { useRef, useEffect, useState } from "react";
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { FindItem } from "../types";

interface CameraFeedProps {
  currentItem: FindItem;
  onItemFound: () => void;
}

export default function CameraFeed({
  currentItem,
  onItemFound,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let detector: ObjectDetector | null = null;
    let animationId: number;
    let isMounted = true;

    async function setup() {
      try {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error("Camera access not supported");
        }

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/efficientdet_lite0.tflite",
            delegate: "GPU",
          },
          scoreThreshold: 0.3,
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setLoading(false);
        detectFrame();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Camera error");
        setLoading(false);
      }
    }

    async function detectFrame() {
      if (!videoRef.current || !canvasRef.current || !detector) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const detections = await detector.detect(video);
      const currentFoundObjects: string[] = [];

      detections.detections.forEach((det: unknown) => {
        const detection = det as {
          boundingBox: {
            originX: number;
            originY: number;
            width: number;
            height: number;
          };
          categories: { categoryName: string; score: number }[];
        };
        const box = detection.boundingBox;
        const label = detection.categories[0]?.categoryName || "object";
        const score = detection.categories[0]?.score || 0;

        currentFoundObjects.push(label);

        // Highlight target item in green, others in blue
        const isTargetItem =
          label.toLowerCase().includes(currentItem.name.toLowerCase()) ||
          currentItem.name.toLowerCase().includes(label.toLowerCase());

        ctx.strokeStyle = isTargetItem ? "#00FF00" : "#0080FF";
        ctx.lineWidth = isTargetItem ? 4 : 2;
        ctx.strokeRect(box.originX, box.originY, box.width, box.height);

        ctx.font = "16px Arial";
        ctx.fillStyle = isTargetItem ? "#00FF00" : "#0080FF";
        ctx.fillText(
          `${label} (${Math.round(score * 100)}%)${isTargetItem ? " ✓" : ""}`,
          box.originX,
          box.originY > 20 ? box.originY - 5 : 10
        );

        // Check if target item is found with good confidence
        if (isTargetItem && score > 0.5) {
          setTimeout(() => onItemFound(), 1000); // Small delay for user to see detection
        }
      });

      if (isMounted) {
        animationId = requestAnimationFrame(detectFrame);
      }
    }

    setup();
    return () => {
      isMounted = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [currentItem, onItemFound]);

  return (
    <div className="w-full h-full relative">
      {/* Item prompt */}
      <div className="absolute top-4 left-4 right-4 z-10 bg-black bg-opacity-75 text-white p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-2">Find: {currentItem.name}</h3>
        {currentItem.prompt && (
          <p className="text-sm italic">{currentItem.prompt}</p>
        )}
      </div>

      {/* Camera feed */}
      <div className="w-full h-full">
        {loading && (
          <div className="flex justify-center items-center h-full bg-gray-900 text-white">
            Loading camera...
          </div>
        )}
        {error && (
          <div className="flex justify-center items-center h-full bg-red-900 text-white">
            Error: {error}
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: loading ? "none" : "block" }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Manual next button (fallback) */}
      <button
        onClick={onItemFound}
        className="absolute bottom-4 right-4 px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
