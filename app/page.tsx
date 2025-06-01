"use client";
import React, { useState, useEffect } from "react";
import Leaderboard from "./components/Leaderboard";
import Hunting from "./components/Hunting";
import AdminPanel from "./components/AdminPanel";
import { useGameEvents } from "./hooks/useGameEvents";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState<
    "entering" | "camera_permission" | "waiting" | "playing"
  >("entering");
  const [currentView, setCurrentView] = useState<"leaderboard" | "hunting">(
    "leaderboard"
  );
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

  const { player, round, isConnected, error, isRoundActive, announcements } =
    useGameEvents(
      gameState === "waiting" || gameState === "playing" ? playerName : ""
    );

  useEffect(() => {
    if (isRoundActive && gameState === "waiting") {
      setGameState("playing");
      setCurrentView("hunting");
    } else if (!isRoundActive && gameState === "playing") {
      setCurrentView("leaderboard");
    }

    // Auto-complete hunt if player finished all items
    if (gameState === "playing" && player?.itemsFound === 3) {
      console.log("Player completed all items, returning to leaderboard");
      setCurrentView("leaderboard");
    }
  }, [isRoundActive, gameState, player?.itemsFound]);

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

  // Check if countdown is active
  const isCountdownActive =
    round?.countdown !== undefined && round.countdown > 0;

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

  const handleStartGame = async () => {
    if (!player?.id) {
      console.error("No player ID available");
      return;
    }

    console.log(
      "Ready button clicked! Player:",
      player.name,
      "Current ready status:",
      player.isReady
    );

    try {
      const response = await fetch("/api/player-ready", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.id,
          isReady: !player.isReady,
        }),
      });

      if (!response.ok) throw new Error("Failed to set ready status");
      console.log("Ready status updated successfully");
    } catch (err) {
      console.error("Error setting ready status:", err);
    }
  };

  const handleHuntComplete = () => {
    console.log("Hunt completed manually or automatically");
    setCurrentView("leaderboard");

    // Show completion message if player completed all items
    if (player?.itemsFound === 3) {
      // The leaderboard will show the updated scores
      console.log("Player completed all 3 items!");
    }
  };

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
                onClick={handleContinueToWaiting}
                className="w-full px-4 py-3 text-white rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: "#800080" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#6b006b")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#800080")
                }
              >
                Continue to Game 🚀
              </button>
            </div>
          ) : requestingCamera ? (
            // Show loading state while checking permissions
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl animate-spin">🔄</span>
                  <span className="font-semibold text-blue-700">
                    Checking Camera Access...
                  </span>
                </div>
                <p className="text-sm text-blue-600">
                  We&apos;re checking if your camera is already available. This
                  should only take a moment.
                </p>
              </div>
            </div>
          ) : (
            // Initial request for camera access
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔒</span>
                  <span className="font-semibold text-green-700">
                    Privacy First
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  All object detection happens locally on your device. No video
                  or images leave your browser.
                </p>
              </div>
              <button
                onClick={handleCameraPermission}
                disabled={requestingCamera}
                className="w-full px-4 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: requestingCamera ? undefined : "#800080",
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
                {requestingCamera ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Requesting Camera Access...
                  </span>
                ) : (
                  "Enable Camera Access"
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Waiting room screen
  if (gameState === "waiting") {
    const readyCount = round?.players?.filter((p) => p.isReady).length || 0;
    const totalPlayers = round?.players?.length || 0;
    const allReady = totalPlayers > 0 && readyCount === totalPlayers;

    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-white/20">
          {/* Countdown Display */}
          {isCountdownActive && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="text-8xl font-bold text-white mb-4 animate-pulse">
                  {round?.countdown || 0}
                </div>
                <div className="text-2xl text-white font-semibold">
                  {round?.countdown === 0 ? "GO!" : "Get Ready!"}
                </div>
              </div>
            </div>
          )}

          {/* Announcement Banners */}
          {announcements.length > 0 && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 space-y-2">
              {announcements.map((announcement, index) => (
                <div
                  key={`${announcement}-${index}`}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce"
                >
                  {announcement}
                </div>
              ))}
            </div>
          )}

          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🎯 Waiting Room
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome,{" "}
              <span className="font-semibold text-indigo-600">
                {player?.name}
              </span>
              !
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <p className="text-3xl font-bold text-gray-700 mb-4">
                  Players Ready:{" "}
                  <span className="text-indigo-600">
                    {readyCount}/{totalPlayers}
                  </span>
                </p>
                {round?.players && round.players.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-600 mb-3">
                      Current Players:
                    </h3>
                    {round.players.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center py-4 px-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <span className="font-bold text-gray-700 text-lg">
                          {p.name}
                        </span>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                            p.isReady
                              ? "bg-green-100 text-green-700 border-2 border-green-200 animate-pulse"
                              : "bg-yellow-100 text-yellow-700 border-2 border-yellow-200"
                          }`}
                        >
                          {p.isReady ? "✅ READY!" : "⏳ Waiting..."}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {allReady ? (
              <div className="text-center py-4 px-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-600 font-bold text-lg mb-1">
                  🚀 All players ready!
                </div>
                <div className="text-green-500 text-sm animate-pulse">
                  Starting game...
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartGame}
                className="w-full px-8 py-6 rounded-2xl font-black text-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 active:scale-95 border-4 cursor-pointer select-none text-white border-purple-400"
                style={{
                  background: player?.isReady
                    ? `linear-gradient(to right, #800080, #6b006b, #5c005c)`
                    : `linear-gradient(to right, #9500a3, #800080, #6b006b)`,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  boxShadow: "0 20px 40px rgba(128, 0, 128, 0.4)",
                  animation: player?.isReady
                    ? "bounce 1s infinite"
                    : "pulse 2s infinite",
                }}
                onMouseDown={() => console.log("Button pressed down!")}
                onMouseUp={() => console.log("Button released!")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = player?.isReady
                    ? `linear-gradient(to right, #6b006b, #5c005c, #4d004d)`
                    : `linear-gradient(to right, #800080, #6b006b, #5c005c)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = player?.isReady
                    ? `linear-gradient(to right, #800080, #6b006b, #5c005c)`
                    : `linear-gradient(to right, #9500a3, #800080, #6b006b)`;
                }}
              >
                {player?.isReady ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-3xl">❌</span>
                    <span>CANCEL READY</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🚀</span>
                    <span>READY UP!</span>
                  </span>
                )}
              </button>
            )}

            <div className="text-center">
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                  isConnected
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span>{isConnected ? "Connected" : "Connecting..."}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Header */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">🔍 Scavange</h1>
          <div className="text-right">
            {player && (
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{player.name}</span>
              </div>
            )}
            <div
              className={`text-xs ${
                isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      {/* Round status */}
      {round && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 mx-4 mt-4 rounded">
          {isRoundActive ? (
            <div className="text-center font-semibold">
              🚀 Hunt is ACTIVE! {round.players.length} players participating
            </div>
          ) : round.finish ? (
            <div className="text-center">
              🏁 Round finished!{" "}
              {round.winner ? `Winner: ${round.winner.name}` : "No winner yet"}
            </div>
          ) : (
            <div className="text-center">
              ⏳ Waiting for round to start... {round.players.length} players
              ready
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="p-4">
        {currentView === "leaderboard" ? (
          <Leaderboard />
        ) : (
          <Hunting
            isActive={currentView === "hunting"}
            onComplete={handleHuntComplete}
            playerName={playerName}
          />
        )}
      </div>

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </main>
  );
}
