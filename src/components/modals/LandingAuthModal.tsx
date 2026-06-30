"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { LoginForm } from "../form/Login";
import { SignupForm } from "../form/SignupForm";

type Tab = "login" | "signup";

// ─── Landing Auth Modal ─────────────────────────────────────────────────────
//
// Used by the landing page's "Book This Shipment" flow: when a visitor
// clicks it without being logged in, instead of yanking them straight to a
// full-page /auth/login or /auth/signup (losing the landing page context),
// this modal opens right there with both forms available via tabs. Once
// they authenticate (or finish signup → verify → login), the existing
// sessionStorage draft + consumePostAuthRedirect mechanism in
// lib/shipmentDraft.ts takes over and lands them on the prefilled shipment
// page automatically — no extra wiring needed here.
export default function LandingAuthModal({
  isOpen,
  setIsOpen,
  defaultTab = "login",
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  const handleClose = (v: boolean) => {
    setIsOpen(v);
    if (!v) setTab(defaultTab);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[92vw] max-w-md max-h-[90vh] overflow-y-auto z-50 shadow-2xl">
          <div className="px-6 pt-6 pb-1 flex items-start justify-between">
            <Dialog.Title className="sr-only">
              {tab === "login" ? "Login" : "Sign Up"}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Sign in or create an account to continue booking your shipment.
            </Dialog.Description>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mx-auto">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === "login"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === "signup"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                Sign Up
              </button>
            </div>
            <Dialog.Close asChild>
              <button className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 text-gray-400 transition-colors cursor-pointer">
                ✕
              </button>
            </Dialog.Close>
          </div>

          <div className="px-6 pb-6 pt-4">
            <p className="text-center text-xs text-gray-400 -mt-2 mb-4">
              Your shipment details are saved — finish booking right after you{" "}
              {tab === "login" ? "log in" : "sign up"}.
            </p>
            {tab === "login" ? (
              <LoginForm
                onSignupClick={() => setTab("signup")}
                defaultRedirect="/dashboard/shipments?openCreate=1"
              />
            ) : (
              <SignupForm onLogin={() => setTab("login")} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
