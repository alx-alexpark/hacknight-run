"use client";
import React, { useRef, useEffect, useState } from "react";
import { ObjectDetector } from "@mediapipe/tasks-vision";
import { FindItem } from "../types";
import { getObjectDetector } from "../lib/modelCache";

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

  // Simple consecutive detection logic - just need 2 detections in a row
  const consecutiveDetectionsRef = useRef<number>(0);
  const itemFoundTriggeredRef = useRef(false);
  const [detectionCount, setDetectionCount] = useState(0);

  // Reset detection state when item changes
  useEffect(() => {
    consecutiveDetectionsRef.current = 0;
    itemFoundTriggeredRef.current = false;
    setDetectionCount(0);
  }, [currentItem?.name]); // Use currentItem.name as dependency for stability

  // Always use the latest currentItem in the detection loop
  const currentItemRef = useRef(currentItem);
  useEffect(() => {
    currentItemRef.current = currentItem;
  }, [currentItem]);

  // Only set up the camera stream and detector once, on mount
  useEffect(() => {
    let stream: MediaStream | null = null;
    let detector: ObjectDetector | null = null;
    let animationId: number;
    let isMounted = true;

    async function setup() {
      try {
        // Camera support check
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Camera access is not supported in this environment. Please use a modern browser over HTTPS."
          );
        }

        // Use cached AI model instead of downloading each time
        console.log("🤖 Getting cached AI model for CameraFeed...");
        detector = await getObjectDetector();

        // Try to use the same camera device as the test (CameraObjectDetection)
        let constraints: MediaStreamConstraints = {
          video: { facingMode: "environment" },
        };
        const lastDeviceId = localStorage.getItem("preferredCameraDeviceId");
        if (lastDeviceId) {
          constraints = { video: { deviceId: { exact: lastDeviceId } } };
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata to be loaded before calling play()
          await new Promise<void>((resolve) => {
            videoRef.current!.onloadedmetadata = () => {
              resolve();
            };
          });
          await videoRef.current.play();
        }
        setLoading(false);
        detectFrame();
      } catch (err: any) {
        setError(err.message || "Camera or model error");
        setLoading(false);
      }
    }

    async function detectFrame() {
      if (!videoRef.current || !canvasRef.current || !detector) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Always match canvas size to video display size (CSS and buffer)
      const videoRect = video.getBoundingClientRect();
      canvas.style.width = videoRect.width + "px";
      canvas.style.height = videoRect.height + "px";
      canvas.width = videoRect.width;
      canvas.height = videoRect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling and offset for object-fit: cover
      const videoAspect = video.videoWidth / video.videoHeight;
      const displayAspect = videoRect.width / videoRect.height;
      let scale, xOffset, yOffset;
      if (displayAspect > videoAspect) {
        // Video covers width, crop top/bottom
        scale = videoRect.width / video.videoWidth;
        xOffset = 0;
        yOffset = (videoRect.height - video.videoHeight * scale) / 2;
      } else {
        // Video covers height, crop sides
        scale = videoRect.height / video.videoHeight;
        xOffset = (videoRect.width - video.videoWidth * scale) / 2;
        yOffset = 0;
      }

      // Run MediaPipe detection
      const detections = await detector.detect(video);
      let targetDetected = false;
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

        // Highlight target item in green, others in blue
        const isTargetItem =
          label.toLowerCase().includes(currentItemRef.current.name.toLowerCase()) ||
          currentItemRef.current.name.toLowerCase().includes(label.toLowerCase());

        ctx.strokeStyle = isTargetItem ? "#00FF00" : "#0080FF";
        ctx.lineWidth = isTargetItem ? 4 : 2;
        // Scale and offset bounding box to match displayed video
        ctx.strokeRect(
          box.originX * scale + xOffset,
          box.originY * scale + yOffset,
          box.width * scale,
          box.height * scale
        );
        ctx.font = "16px Arial";
        ctx.fillStyle = isTargetItem ? "#00FF00" : "#0080FF";
        ctx.fillText(
          `${label} (${Math.round(score * 100)}%)${isTargetItem ? " ✓" : ""}`,
          box.originX * scale + xOffset,
          box.originY * scale + yOffset > 20
            ? box.originY * scale + yOffset - 5
            : 10
        );

        // Check if target item is found with good confidence
        const requiredConfidence = currentItemRef.current.confidence || 0.5;
        if (isTargetItem && score > requiredConfidence) {
          targetDetected = true;
        }
      });
      // Simple consecutive detection logic - 2 detections in a row = found
      if (targetDetected && !itemFoundTriggeredRef.current) {
        consecutiveDetectionsRef.current += 1;
        setDetectionCount(consecutiveDetectionsRef.current);
        console.log(
          `🎯 Target detected! Count: ${consecutiveDetectionsRef.current}/2`
        );

        if (consecutiveDetectionsRef.current >= 2) {
          console.log("✅ Found! Two consecutive detections.");
          itemFoundTriggeredRef.current = true;
          onItemFound();
        }
      } else if (!targetDetected) {
        consecutiveDetectionsRef.current = 0;
        setDetectionCount(0);
      }

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
  }, []); // FIX: Only run once on mount

  return (
    <div className="w-full h-full relative">
      {/* Item prompt */}
      <div className="absolute top-4 left-4 right-4 z-10 bg-black bg-opacity-75 text-white p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-2">Find: {currentItem.name}</h3>
        {currentItem.prompt && (
          <p className="text-sm italic">{currentItem.prompt}</p>
        )}

        {/* Simple detection indicator */}
        {detectionCount > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">Detecting...</span>
              <span className="text-sm">{detectionCount}/2</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${(detectionCount / 2) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Need 2 consecutive detections
            </p>
          </div>
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
          style={{
            background: "transparent",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Manual next button (fallback) */}
      {/* {<button
        onClick={onItemFound}
        className="absolute bottom-4 right-4 px-6 py-3 text-white rounded-lg font-bold transition-colors"
        style={{ backgroundColor: "#800080" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#6b006b")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#800080")
        }
      >
        Next →
      </button>} */}
    </div>
  );
}
