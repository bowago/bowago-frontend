// ─── Shipment draft carry-over ─────────────────────────────────────────────
//
// Problem: a visitor fills in route + package details on the landing page
// (or the Request Quote modal) before they're signed in. Previously, clicking
// "Book This Shipment" / "Create Shipment" just sent them to /auth/login and
// threw away everything they'd typed — forcing them to retype it all once
// they landed in the dashboard.
//
// Fix: persist whatever was entered (predefined box OR custom L/W/H,
// weight, service type, etc.) to sessionStorage right before redirecting to
// signup/login. Once the user is authenticated and lands back on the
// shipments page, the draft is read, used to prefill CreateShipmentModal,
// and cleared.
//
// sessionStorage (not localStorage) is used deliberately — the draft should
// not outlive the browser tab/session it was created in.

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export type ShipmentDraft = {
  fromCity?: string;
  toCity?: string;
  serviceType?: string;
  boxSize?: string; // boxDimensionId, when a predefined box was chosen
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  cartons?: number;
  tons?: number;
  isCustomDimension?: boolean;
};

const DRAFT_KEY = "bowago_shipment_draft";
const REDIRECT_FLAG_KEY = "bowago_post_auth_redirect";

export function saveShipmentDraft(draft: ShipmentDraft) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    // Marks that the next successful login/signup-verification should land
    // the user on the shipments page with the modal pre-opened, rather than
    // the default dashboard landing page.
    sessionStorage.setItem(
      REDIRECT_FLAG_KEY,
      "/dashboard/shipments?openCreate=1",
    );
  } catch {
    // sessionStorage can throw in private-browsing contexts — non-fatal,
    // the user just won't get the prefill.
  }
}

export function loadShipmentDraft(): ShipmentDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ShipmentDraft) : null;
  } catch {
    return null;
  }
}

export function clearShipmentDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem(REDIRECT_FLAG_KEY);
  } catch {
    // ignore
  }
}

// Returns the post-auth destination to redirect to (e.g. after login), or
// null if there's no pending draft to resume.
export function consumePostAuthRedirect(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(REDIRECT_FLAG_KEY);
  } catch {
    return null;
  }
}

// ─── React hook: resume a saved draft on the shipments page ───────────────
//
// Usage on /dashboard/shipments:
//   const { shouldAutoOpen, prefill, consumed } = useResumeShipmentDraft();
//   useEffect(() => { if (shouldAutoOpen) { setCreateOpen(true); consumed(); } }, [shouldAutoOpen]);
//
// Looks for ?openCreate=1 in the URL (set when redirecting here after
// signup/login) and a matching draft in sessionStorage. Call consumed()
// once the modal has been opened with the prefill so it doesn't reopen on
// every render or re-visit.
export function useResumeShipmentDraft() {
  const searchParams = useSearchParams();
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);
  const [prefill, setPrefill] = useState<ShipmentDraft | null>(null);

  useEffect(() => {
    if (searchParams.get("openCreate") !== "1") return;
    const draft = loadShipmentDraft();
    if (draft) {
      setPrefill(draft);
      setShouldAutoOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumed = () => {
    setShouldAutoOpen(false);
    clearShipmentDraft();
  };

  return { shouldAutoOpen, prefill, consumed };
}
