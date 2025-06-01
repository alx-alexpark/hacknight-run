"use client";
import React, { useState, useEffect } from "react";
import Hunting from "./components/Hunting";
import AdminPanel from "./components/AdminPanel";
import Countdown from "./components/Countdown";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState<
    "entering" | "camera_permission" | "ready" | "playing" | "finished" | "waiting"
  >("entering");
  const [timer, setTimer] = useState(0); // ms
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showFinalTime, setShowFinalTime] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  // Timer logic for solo run
  useEffect(() => {
    if (gameState === "playing") {
      const interval = setInterval(() => {
        setTimer((t) => t + 100);
      }, 100);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Handler to go from camera preview to ready screen
  const handleContinueToReady = () => {
    // Do NOT stop the camera stream here; keep it alive for the run
    setShowingPreview(false);
    setGameState("ready");
  };

  // Handler for when the hunt is complete
  const handleHuntComplete = () => {
    if (timerInterval) clearInterval(timerInterval);
    setGameState("finished");
    setShowFinalTime(true);
  };
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showingPreview, setShowingPreview] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">(
    "environment"
  );
  const [cameraInfo, setCameraInfo] = useState<{
    resolution?: string;
    deviceLabel?: string;
  } | null>(null);

  // Multiplayer/game event logic removed for solo mode

  // Multiplayer/game event logic removed for solo mode

  // Check camera permissions when entering camera_permission state
  useEffect(() => {
    const checkCameraPermissions = async () => {
      if (gameState !== "camera_permission") return;

      // Reset states when entering camera permission
      setCameraError(null);
      setShowingPreview(false);
      setRequestingCamera(true);

      try {
        // First, try to check permission status using the Permissions API
        if ("permissions" in navigator) {
          try {
            const permission = await navigator.permissions.query({
              name: "camera" as PermissionName,
            });
            if (permission.state === "granted") {
              // Permission already granted, directly request camera
              console.log(
                "Camera permission already granted, requesting camera..."
              );

              // Directly request camera instead of calling handleCameraPermission to avoid dependency
              try {
                const stream = await navigator.mediaDevices.getUserMedia({
                  video: {
                    facingMode: cameraFacing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  },
                });

                setCameraStream(stream);
                setShowingPreview(true);
                setCameraError(null);

                // Get camera info
                const videoTrack = stream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                setCameraInfo({
                  resolution: `${settings.width}×${settings.height}`,
                  deviceLabel: videoTrack.label || "Camera",
                });
              } catch (streamError) {
                console.error(
                  "Failed to get camera stream despite permission:",
                  streamError
                );
                setCameraError("Failed to access camera. Please try again.");
              }

              setRequestingCamera(false);
              return;
            } else if (permission.state === "denied") {
              // Permission denied, show error
              setCameraError(
                "Camera access was denied. Please click the camera icon in your browser's address bar and allow camera access, then reload the page."
              );
              setRequestingCamera(false);
              return;
            }
          } catch {
            console.log(
              "Permissions API not fully supported, trying direct access..."
            );
          }
        }

        // Fallback: Try to directly access camera to check if permission exists
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: cameraFacing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          // If we get here, permission is granted
          console.log("Camera access successful on direct test");
          setCameraStream(testStream);
          setShowingPreview(true);

          // Get camera info
          const videoTrack = testStream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          setCameraInfo({
            resolution: `${settings.width}×${settings.height}`,
            deviceLabel: videoTrack.label || "Camera",
          });
        } catch (directError) {
          console.log(
            "Direct camera access failed, need to request permission:",
            directError
          );
          // Permission not granted yet, user needs to click the button
        }
      } catch (error) {
        console.error("Error checking camera permissions:", error);
      } finally {
        setRequestingCamera(false);
      }
    };

    checkCameraPermissions();
  }, [gameState, cameraFacing]);

  // Cleanup camera stream when component unmounts or state changes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Multiplayer/game event logic removed for solo mode

  // Admin panel key sequence: "admin"
  useEffect(() => {
    let keySequence: string[] = [];

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keySequence = [...keySequence, key].slice(-5); // Keep last 5 keys
      if (keySequence.join("") === "admin") {
        setShowAdminPanel(true);
        keySequence = [];
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setGameState("camera_permission");
    }
  };

  const handleCameraPermission = async () => {
    setRequestingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraStream(stream);
      setShowingPreview(true);
      setCameraError(null);

      // Get camera info
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      setCameraInfo({
        resolution: `${settings.width}×${settings.height}`,
        deviceLabel: videoTrack.label || "Camera",
      });
    } catch (error) {
      console.error("Camera permission denied:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setCameraError(
            "Camera access was denied. Please click the camera icon in your browser's address bar and allow camera access, then reload the page."
          );
        } else if (error.name === "NotFoundError") {
          setCameraError(
            "No camera found on your device. This game requires a camera to detect objects."
          );
        } else if (error.name === "NotReadableError") {
          setCameraError(
            "Camera is already in use by another application. Please close other apps using your camera and try again."
          );
        } else {
          setCameraError(
            "Camera access failed. Please check your camera permissions and try again."
          );
        }
      } else {
        setCameraError(
          "Camera access is required for this game. Please enable camera access and reload the page."
        );
      }
    } finally {
      setRequestingCamera(false);
    }
  };

  const handleFlipCamera = async () => {
    // Stop current stream
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    // Switch camera facing
    const newFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(newFacing);

    // Request new stream with different camera
    setRequestingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setCameraStream(stream);

      // Update camera info
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      setCameraInfo({
        resolution: `${settings.width}×${settings.height}`,
        deviceLabel: videoTrack.label || "Camera",
      });
    } catch (error) {
      console.error("Failed to switch camera:", error);
      // If switching fails, try to get any camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setCameraStream(stream);

        // Update camera info for fallback
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        setCameraInfo({
          resolution: `${settings.width}×${settings.height}`,
          deviceLabel: videoTrack.label || "Camera",
        });
      } catch (fallbackError) {
        console.error("Fallback camera failed:", fallbackError);
        setCameraError(
          "Failed to switch camera. Please reload the page and try again."
        );
      }
    } finally {
      setRequestingCamera(false);
    }
  };

  const handleContinueToWaiting = () => {
    // Stop the camera stream and proceed to waiting room
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowingPreview(false);
    setGameState("waiting");
  };

  // No longer needed since admin now starts the game
  // (Removed old multiplayer handleHuntComplete)

  // Name entry screen
  if (gameState === "entering") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            🔍 Scavange
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Enter your name to join the hunt!
          </p>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full px-4 py-3 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: !playerName.trim() ? undefined : "#800080",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = "#6b006b";
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = "#800080";
              }}
            >
              Join Game
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Camera permission screen
  if (gameState === "camera_permission") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-purple-500 to-pink-600">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            📷 Camera Access
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Hi {playerName}! We need camera access to detect objects in your
            hunt.
          </p>

          {cameraError ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">❌</span>
                <span className="font-semibold">Camera Access Denied</span>
              </div>
              <p className="text-sm mb-3">{cameraError}</p>
              <p className="text-sm text-gray-600">
                <strong>
                  This game processes everything locally on your device.
                </strong>{" "}
                No video or images are sent to any server.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full px-4 py-3 text-white rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: "#800080" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#6b006b")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#800080")
                }
              >
                Reload Page & Try Again
              </button>
            </div>
          ) : showingPreview && cameraStream ? (
            // Show camera preview
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={(video) => {
                    if (video && cameraStream) {
                      video.srcObject = cameraStream;
                      video.play().catch(console.error);
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-72 sm:h-64 object-cover border-4 border-green-200"
                  style={{
                    transform: cameraFacing === "user" ? "scaleX(-1)" : "none",
                  }}
                />
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg">
                  📹 Camera Active
                </div>
                <button
                  onClick={handleFlipCamera}
                  disabled={requestingCamera}
                  className="absolute top-2 right-2 text-white p-2 rounded-lg transition-colors disabled:opacity-50 shadow-lg"
                  style={{ backgroundColor: "#800080" }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled)
                      e.currentTarget.style.backgroundColor = "#6b006b";
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled)
                      e.currentTarget.style.backgroundColor = "#800080";
                  }}
                  title={`Switch to ${
                    cameraFacing === "environment" ? "front" : "back"
                  } camera`}
                  aria-label={`Switch to ${
                    cameraFacing === "environment" ? "front" : "back"
                  } camera`}
                >
                  {requestingCamera ? "⏳" : "🔄"}
                </button>
                {/* Camera type indicator */}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  {cameraFacing === "environment"
                    ? "📱 Back Camera"
                    : "🤳 Front Camera"}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✅</span>
                  <span className="font-semibold text-green-700">
                    Camera Ready!
                  </span>
                </div>
                <p className="text-sm text-green-600 mb-2">
                  Your camera is working perfectly. You can see the preview
                  above.
                  {cameraFacing === "environment"
                    ? " Using back camera (recommended for object detection)."
                    : " Using front camera."}
                </p>
                {cameraInfo && (
                  <div className="text-xs text-green-500 bg-green-100 p-2 rounded border">
                    📹 {cameraInfo.deviceLabel} • {cameraInfo.resolution}{" "}
                    resolution
                  </div>
                )}
              </div>

              <button
                onClick={handleContinueToReady}
                className="w-full px-4 py-3 text-white rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: "#800080" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#6b006b")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#800080")
                }
              >
                Continue
              </button>
            </div>
          ) : requestingCamera ? (
            // Show loading state while checking permissions
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl animate-spin">🔄</span>
                  <span className="font-semibold text-blue-700">
                    Checking camera permissions...
                  </span>
                </div>
                <p className="text-sm text-blue-600">
                  Please allow camera access if prompted.
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCameraPermission}
              className="w-full px-4 py-3 text-white rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: "#800080" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6b006b")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#800080")}
              disabled={requestingCamera}
            >
              {requestingCamera ? "Requesting Camera..." : "Allow Camera Access"}
            </button>
          )}
        </div>
      </main>
    );
  }

  // Ready screen (after camera, before run)
  if (gameState === "ready") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Ready to Run?</h1>
          <p className="mb-6 text-gray-600">Hi {playerName}! When you click below, your scavenger run will begin and the timer will start. Find all items as fast as you can!</p>
          <button
            className="w-full px-4 py-3 text-white rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: "#800080" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#6b006b")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#800080")}
            onClick={() => {
              setShowCountdown(true);
            }}
            disabled={showCountdown}
          >
            Start Run 🚦
          </button>
          {showCountdown && (
            <Countdown
              onComplete={() => {
                setShowCountdown(false);
                setTimer(0);
                setShowFinalTime(false);
                setGameState("playing");
              }}
            />
          )}
        </div>
      </main>
    );
  }

  // Finished screen
  if (gameState === "finished" && showFinalTime) {
    // Format timer as mm:ss.SS
    const ms = timer % 1000;
    const totalSeconds = Math.floor(timer / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((timer % 1000) / 10);
    const pad = (n: number, l = 2) => n.toString().padStart(l, l === 2 ? "0" : "00");
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-green-400 to-blue-600">
        <div className="bg-white rounded-2xl shadow-2xl p-12 w-full max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">🏁 Run Complete!</h1>
          <div className="text-7xl font-mono font-extrabold text-purple-700 mb-6 tracking-widest">
            {pad(minutes)}:{pad(seconds)}.{pad(centiseconds)}
          </div>
          <div className="text-lg text-gray-600 mb-8">Your time</div>
          <button
            className="w-full px-4 py-3 text-white rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: "#800080" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#6b006b")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#800080")}
            onClick={() => {
              setGameState("entering");
              setPlayerName("");
              setTimer(0);
              setShowFinalTime(false);
            }}
          >
            Run Again
          </button>
        </div>
      </main>
    );
  }

  // Main run screen
  if (gameState === "playing") {
    return (
      <Hunting
        isActive={true}
        onComplete={handleHuntComplete}
        playerName={playerName}
      />
    );
  }
  // Removed: leaderboard, multiplayer, and round status UI for solo mode
}
