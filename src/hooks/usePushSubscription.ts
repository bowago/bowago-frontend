"use client";

/**
 * usePushSubscription — opt-in Web Push (VAPID), no Firebase.
 *
 * Browsers require a user gesture to request Notification permission (you
 * can't silently auto-prompt on page load in most of them), so this is
 * exposed as `{ status, subscribe, unsubscribe }` for a Settings toggle to
 * call — see the "Push Notifications" toggle in dashboard/settings.
 *
 * status:
 *   "unsupported"   — browser doesn't support Push API/Service Workers
 *   "unconfigured"  — backend hasn't set VAPID_PUBLIC_KEY yet
 *   "denied"        — user previously denied the permission prompt
 *   "subscribed"    — active push subscription registered with the backend
 *   "unsubscribed"  — supported + permitted, but not currently subscribed
 *   "loading"       — checking current state
 */

import { useEffect, useState, useCallback } from "react";
import {
  useGetVapidPublicKeyQuery,
  useSubscribeToPushMutation,
  useUnsubscribeFromPushMutation,
} from "@/store/slice/apiSlice";
import { successToast, errorToast } from "@/lib/toast/toast";

type Status =
  | "loading"
  | "unsupported"
  | "unconfigured"
  | "denied"
  | "subscribed"
  | "unsubscribed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
  const [status, setStatus] = useState<Status>("loading");
  const { data: vapidData } = useGetVapidPublicKeyQuery();
  const [subscribeToPush] = useSubscribeToPushMutation();
  const [unsubscribeFromPush] = useUnsubscribeFromPushMutation();

  const publicKey = vapidData?.data?.publicKey;

  const checkStatus = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (!publicKey) {
      setStatus("unconfigured");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const existing = await reg?.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
    } catch {
      setStatus("unsubscribed");
    }
  }, [publicKey]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const subscribe = useCallback(async () => {
    if (!publicKey) {
      errorToast("Push notifications aren't configured yet.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await subscribeToPush({
        subscription: subscription.toJSON() as any,
      }).unwrap();
      setStatus("subscribed");
      successToast("Push notifications enabled");
    } catch (err) {
      console.error("Push subscribe failed:", err);
      errorToast("Couldn't enable push notifications. Try again.");
    }
  }, [publicKey, subscribeToPush]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const existing = await reg?.pushManager.getSubscription();
      if (existing) {
        await unsubscribeFromPush({ endpoint: existing.endpoint }).unwrap();
        await existing.unsubscribe();
      }
      setStatus("unsubscribed");
      successToast("Push notifications disabled");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
      errorToast("Couldn't disable push notifications. Try again.");
    }
  }, [unsubscribeFromPush]);

  return { status, subscribe, unsubscribe };
}
