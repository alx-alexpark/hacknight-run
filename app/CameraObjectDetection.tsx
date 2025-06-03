"use client";
import React, { useRef, useEffect, useState } from "react";

// MediaPipe Object Detector
import { ObjectDetector } from "@mediapipe/tasks-vision";
import { getObjectDetector } from "./lib/modelCache";

export default function CameraObjectDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

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
        console.log("🤖 Getting cached AI model for CameraObjectDetection...");
        detector = await getObjectDetector();

        // Request camera
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        let selectedDeviceId: string | undefined;
        if (videoDevices.length > 0) {
          // Prefer environment-facing if available
          const envCam = videoDevices.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("environment")
          );
          selectedDeviceId = envCam?.deviceId || videoDevices[0].deviceId;
        }
        let constraints: MediaStreamConstraints = {
          video: { facingMode: "environment" },
        };
        if (selectedDeviceId) {
          constraints = { video: { deviceId: { exact: selectedDeviceId } } };
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (selectedDeviceId) {
          localStorage.setItem("preferredCameraDeviceId", selectedDeviceId);
        }
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
      if (!videoRef.current || !canvasRef.current || !detector || isPaused)
        return;
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
      let found = false;
      detections.detections.forEach((det: any) => {
        const box = det.boundingBox;
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        // Scale and offset bounding box to match displayed video
        ctx.strokeRect(
          box.originX * scale + xOffset,
          box.originY * scale + yOffset,
          box.width * scale,
          box.height * scale
        );
        ctx.font = "16px Arial";
        ctx.fillStyle = "#00FF00";
        const label = det.categories[0]?.categoryName || "object";
        const score = det.categories[0]?.score
          ? Math.round(det.categories[0].score * 100)
          : "";
        ctx.fillText(
          `${label} (${score}%)`,
          box.originX * scale + xOffset,
          box.originY * scale + yOffset > 20
            ? box.originY * scale + yOffset - 5
            : 10
        );
        found = true;
      });
      if (found) {
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 3000);
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
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 480,
        margin: "auto",
      }}
    >
      {loading && <p>Loading camera and model...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <video
        ref={videoRef}
        style={{ width: "100%", display: loading ? "none" : "block" }}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "transparent",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
