"use client";

import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { apiSlice } from "@/store/slice/apiSlice";
import { infoToast } from "@/lib/toast/toast";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api.*$/, "") ||
  "";

export function useNotificationSocket() {
  const dispatch = useDispatch();
  const userId = useSelector((s: RootState) => (s.auth.user as any)?.id);
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const socketRef = useRef<ReturnType<
    typeof import("socket.io-client").io
  > | null>(null);

  useEffect(() => {
    if (!userId || !token || !WS_URL) return;

    let mounted = true;

    import("socket.io-client")
      .then(({ io }) => {
        if (!mounted) return;

        const socket = io(WS_URL, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          timeout: 10000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          if (!mounted) return;
          socket.emit("user:join", userId);
        });

        // Reconnect after a drop needs to re-join the room — Socket.IO
        // doesn't remember room membership across a fresh connection.
        socket.on("reconnect", () => {
          if (!mounted) return;
          socket.emit("user:join", userId);
        });

        socket.on(
          "notification:new",
          (notification: { title?: string; body?: string }) => {
            if (!mounted) return;
            infoToast(
              notification.title
                ? `${notification.title}${notification.body ? ` — ${notification.body}` : ""}`
                : notification.body || "You have a new notification",
            );
            // Refetch immediately rather than waiting for the next 30s poll.
            dispatch(apiSlice.util.invalidateTags(["Notification"]));
          },
        );
      })
      .catch(() => {
        // socket.io-client not available — the existing 30s poll is the
        // fallback, so notifications still arrive, just not instantly.
      });

    return () => {
      mounted = false;
      socketRef.current?.emit("user:leave", userId);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId, token, dispatch]);
}
