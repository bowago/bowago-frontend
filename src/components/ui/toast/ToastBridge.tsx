"use client";
import { useEffect } from "react";
import { useToast, setToastInstance } from "./ToastProvider";

// Registers the toast context into the singleton so apiSlice mutations can call it
export function ToastBridge() {
  const toast = useToast();
  useEffect(() => {
    setToastInstance(toast);
  }, [toast]);
  return null;
}
