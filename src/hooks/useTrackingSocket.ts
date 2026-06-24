"use client";

/**
 * useTrackingSocket — Sprint 4
 * PRD spec: "Real-Time Movement: Option 1 (preferred): WebSocket (live update every 10 sec).
 *            Option 2 (fallback): Polling (every 5 sec if WebSocket unavailable)."
 *
 * Usage:
 *   const { shipment, isConnected } = useTrackingSocket(trackingNumber);
 *
 * The hook connects to the backend Socket.IO server, joins the
 * `tracking:{trackingNumber}` room, and listens for `shipment:update` events.
 * If the connection fails or is unavailable (e.g. Vercel serverless), the
 * caller's RTK Query poll (30s) continues as the fallback — this hook adds
 * _on-top-of_ the poll, not in place of it.
 */

import { useEffect, useRef, useState } from "react";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api.*$/, "") ||
  "";

export interface TrackingEvent {
  status: string;
  description: string;
  location: string | null;
  timestamp: string;
}

export interface LiveShipmentUpdate {
  trackingNumber: string;
  status: string;
  serviceType: string;
  estimatedDelivery: string | null;
  currentLocation: string | null;
  timeline: TrackingEvent[];
  updatedAt: string;
}

interface UseTrackingSocketResult {
  liveUpdate: LiveShipmentUpdate | null;
  isConnected: boolean;
  connectionError: string | null;
}

export function useTrackingSocket(
  trackingNumber: string | null | undefined
): UseTrackingSocketResult {
  const [liveUpdate, setLiveUpdate] = useState<LiveShipmentUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof import("socket.io-client").io> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!trackingNumber || !WS_URL) return;

    let mounted = true;

    // Dynamic import so socket.io-client is only loaded client-side
    import("socket.io-client").then(({ io }) => {
      if (!mounted) return;

      const socket = io(WS_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        if (!mounted) return;
        setIsConnected(true);
        setConnectionError(null);
        // Join the public tracking room for this shipment
        socket.emit("track:join", trackingNumber);
      });

      socket.on("disconnect", () => {
        if (!mounted) return;
        setIsConnected(false);
      });

      socket.on("connect_error", (err: Error) => {
        if (!mounted) return;
        setIsConnected(false);
        setConnectionError(err.message);
        // Graceful degradation: polling fallback continues via RTK Query
      });

      // The main event — server emits this on every status change
      socket.on("shipment:update", (data: LiveShipmentUpdate) => {
        if (!mounted) return;
        if (data.trackingNumber === trackingNumber.toUpperCase()) {
          setLiveUpdate(data);
        }
      });

      cleanupRef.current = () => {
        socket.emit("track:leave", trackingNumber);
        socket.disconnect();
      };
    }).catch(() => {
      // socket.io-client not available — polling fallback is sufficient
    });

    return () => {
      mounted = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
      socketRef.current = null;
    };
  }, [trackingNumber]);

  return { liveUpdate, isConnected, connectionError };
}
