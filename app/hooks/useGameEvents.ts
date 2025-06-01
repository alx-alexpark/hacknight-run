"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Player, Round, WebSocketMessage } from "../types";
import { CONFIG } from "../constants";

export function useGameEvents(playerName: string) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!playerName.trim()) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const url = `${CONFIG.EVENTS_URL}?player_name=${encodeURIComponent(playerName)}`;
      console.log("Connecting to SSE:", url);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connected successfully");
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log("Received SSE message:", data);

          if (data.t === "player" && data.player) {
            setPlayer(data.player);
          } else if (data.t === "round" && data.round) {
            setRound(data.round);
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = (event) => {
        console.error("SSE error:", event);
        setError("Connection failed");
        setIsConnected(false);
        
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (playerName.trim()) {
            console.log("Attempting to reconnect...");
            connect();
          }
        }, 3000);
      };

    } catch (err: unknown) {
      console.error("Failed to create SSE connection:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [playerName]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect when playerName changes and is valid
  useEffect(() => {
    if (playerName.trim()) {
      console.log("Connecting with player name:", playerName);
      connect();
    } else {
      // Disconnect if no player name
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [playerName, connect, disconnect]);

  return {
    player,
    round,
    isConnected,
    error,
    connect,
    disconnect,
    isRoundActive: round?.start !== null && round?.finish === null,
  };
}
