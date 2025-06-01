"use client";
import { useState, useCallback } from "react";
import { Player, Round, WebSocketMessage } from "../types";
import { CONFIG } from "../constants";

export function useWebSocket(playerName: string) {
    const [player, setPlayer] = useState<Player | null>(null);
    const [round, setRound] = useState<Round | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = useCallback(() => {
        if (!playerName.trim()) return;

        try {
            const wsUrl = `${CONFIG.WEBSOCKET_URL}?player_name=${encodeURIComponent(playerName)}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
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

            ws.onclose = () => {
                setIsConnected(false);
            };

            ws.onerror = () => {
                setError("WebSocket connection failed");
                setIsConnected(false);
            };

            return ws;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to connect");
            return null;
        }
    }, [playerName]);

    return {
        player,
        round,
        isConnected,
        error,
        connect,
        isRoundActive: round?.start !== null && round?.finish === null,
    };
}
