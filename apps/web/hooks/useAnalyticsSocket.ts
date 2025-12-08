"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface LiveClickEvent {
  linkId: string;
  timestamp: Date;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  source?: string;
}

export interface UseAnalyticsSocketOptions {
  linkId?: string; // Subscribe to specific link
  dashboard?: boolean; // Subscribe to dashboard (all user links)
  enabled?: boolean; // Enable/disable connection
}

export interface UseAnalyticsSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  liveClicks: LiveClickEvent[];
  clickCount: number;
  subscribeToLink: (targetLinkId: string) => void;
  unsubscribeFromLink: (targetLinkId: string) => void;
  clearLiveClicks: () => void;
}

export function useAnalyticsSocket(options: UseAnalyticsSocketOptions = {}): UseAnalyticsSocketReturn {
  const { linkId, dashboard = false, enabled = true } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveClicks, setLiveClicks] = useState<LiveClickEvent[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found for WebSocket connection");
      return;
    }

    // Create WebSocket connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const newSocket = io(`${apiUrl}/analytics`, {
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection handlers
    newSocket.on("connect", () => {
      console.log("✅ Connected to analytics WebSocket");
      setIsConnected(true);

      // Subscribe based on options
      if (linkId) {
        newSocket.emit("subscribe:link", linkId);
        console.log(`📡 Subscribed to link: ${linkId}`);
      } else if (dashboard) {
        newSocket.emit("subscribe:dashboard", "me");
        console.log("📡 Subscribed to dashboard");
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from analytics WebSocket:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("error", (error: any) => {
      console.error("WebSocket error:", error);
    });

    // Subscription confirmation
    newSocket.on("subscribed", (data) => {
      console.log("✅ Subscription confirmed:", data);
    });

    newSocket.on("connected", (data) => {
      console.log("✅ Server confirmed connection:", data);
    });

    // Click event handler
    newSocket.on("click", (data: LiveClickEvent) => {
      console.log("🖱️ New click event:", data);

      // Update live clicks list (keep last 20)
      setLiveClicks((prev) => [data, ...prev].slice(0, 20));

      // Increment count
      setClickCount((prev) => prev + 1);
    });

    // Dashboard update handler (optional)
    newSocket.on("dashboard:update", (metrics: any) => {
      console.log("📊 Dashboard update:", metrics);
    });

    // Cleanup on unmount or dependency change
    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up WebSocket connection");

        // Unsubscribe before disconnecting
        if (linkId) {
          socketRef.current.emit("unsubscribe:link", linkId);
        } else if (dashboard) {
          socketRef.current.emit("unsubscribe:dashboard");
        }

        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [linkId, dashboard, enabled]);

  // Manual subscription methods
  const subscribeToLink = useCallback(
    (targetLinkId: string) => {
      if (socket && isConnected) {
        socket.emit("subscribe:link", targetLinkId);
      }
    },
    [socket, isConnected]
  );

  const unsubscribeFromLink = useCallback(
    (targetLinkId: string) => {
      if (socket && isConnected) {
        socket.emit("unsubscribe:link", targetLinkId);
      }
    },
    [socket, isConnected]
  );

  const clearLiveClicks = useCallback(() => {
    setLiveClicks([]);
    setClickCount(0);
  }, []);

  return {
    socket,
    isConnected,
    liveClicks,
    clickCount,
    subscribeToLink,
    unsubscribeFromLink,
    clearLiveClicks,
  };
}
