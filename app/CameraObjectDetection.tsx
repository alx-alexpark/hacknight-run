"use client";
import React, { useRef, useEffect, useState } from "react";


// MediaPipe Object Detector
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export default function CameraObjectDetection() {

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

        // Load MediaPipe Object Detector

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/efficientdet_lite0.tflite", // local path in public/
            delegate: "GPU",
          },
          scoreThreshold: 0.3,
        });

        // Request camera
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Run MediaPipe detection
      const detections = await detector.detect(video);
      detections.detections.forEach((det: any) => {
        const box = det.boundingBox;
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.strokeRect(box.originX, box.originY, box.width, box.height);
        ctx.font = "16px Arial";
        ctx.fillStyle = "#00FF00";
        const label = det.categories[0]?.categoryName || "object";
        const score = det.categories[0]?.score ? Math.round(det.categories[0].score * 100) : "";
        ctx.fillText(`${label} (${score}%)`, box.originX, box.originY > 20 ? box.originY - 5 : 10);
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
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 480, margin: "auto" }}>
      {loading && <p>Loading camera and model...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <video ref={videoRef} style={{ width: "100%", display: loading ? "none" : "block" }} playsInline muted />
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", pointerEvents: "none" }} />
    </div>
  );
}
