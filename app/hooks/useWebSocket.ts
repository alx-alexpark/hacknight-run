"use client";
import { useState, useCallback } from "react";
import { Player, Round, WebSocketMessage } from "../types";
import { CONFIG } from "../constants";

export function useWebSocket(playerName: string) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!playerName.trim()) return;

    try {
      const wsUrl = `${CONFIG.WEBSOCKET_URL}?player_name=${encodeURIComponent(playerName)}`;
      const newWs = new WebSocket(wsUrl);
      setWs(newWs);

      newWs.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      newWs.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          if (data.t === "player" && data.player) {
            setPlayer(data.player);
          } else if (data.t === "round" && data.round) {
            setRound(data.round);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      newWs.onclose = () => {
        setIsConnected(false);
      };

      newWs.onerror = () => {
        setError("WebSocket connection failed");
        setIsConnected(false);
      };

      return newWs;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      return null;
    }
  }, [playerName]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  }, [ws]);

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
