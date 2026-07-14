"use client";
import { useState, useEffect } from "react";
import { PersonalInformationForm } from "@/components/form/PersonalInformationForm";
import { CompanyInformationForm } from "@/components/form/CompanyInformationForm";
import { ChangePasswordForm } from "@/components/form/ChangePasswordForm";
import PaymentMethodForm from "@/components/form/PaymentMethodForm";
import TwoFASetupSection from "@/components/form/TwoFASetupSection";
import {
  User,
  Building2,
  Lock,
  CreditCard,
  Shield,
  Trash2,
  AlertTriangle,
  Bell,
  Loader2,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useDeleteAccountMutation } from "@/store/slice/apiSlice";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/slice/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { usePushSubscription } from "@/hooks/usePushSubscription";

const TABS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "company", label: "Company Info", icon: Building2 },
  { id: "security", label: "Password", icon: Lock },
  { id: "twofa", label: "2FA Security", icon: Shield },
  { id: "payment", label: "Payment Method", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function NotificationSettingsSection() {
  const { status, subscribe, unsubscribe } = usePushSubscription();

  return (
    <div className="max-w-md">
      <h3 className="font-semibold text-gray-800 mb-1">Push Notifications</h3>
      <p className="text-sm text-gray-500 mb-5">
        Get notified on this device the moment your shipment status changes —
        picked up, out for delivery, delivered, or delayed — even when BowaGO
        isn&apos;t open.
      </p>

      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking status…
        </div>
      )}

      {status === "unsupported" && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
          Push notifications aren&apos;t supported on this browser/device.
          You&apos;ll still get every update by email.
        </p>
      )}

      {status === "unconfigured" && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
          Push notifications aren&apos;t available yet — you&apos;ll still get
          every update by email.
        </p>
      )}

      {status === "denied" && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          You previously blocked notifications for this site. Enable them in
          your browser&apos;s site settings, then refresh this page.
        </p>
      )}

      {status === "unsubscribed" && (
        <button
          onClick={subscribe}
          className="bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Enable Push Notifications
        </button>
      )}

      {status === "subscribed" && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
          <span className="text-sm text-green-700 font-medium">
            ✓ Push notifications are on for this device
          </span>
          <button
            onClick={unsubscribe}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 underline"
          >
            Turn off
          </button>
        </div>
      )}
    </div>
  );
}

function DeleteAccountSection() {
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const router = useRouter();
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();

  const handleDelete = async () => {
    if (!password) {
      setError("Enter your current password to confirm.");
      return;
    }
    setError("");
    try {
      await deleteAccount({ password }).unwrap();
      dispatch(logoutUser());
      router.push("/auth/signup");
    } catch (e: any) {
      setError(
        e.error?.data?.message ||
          e.data?.message ||
          "Failed to delete account. Check your password.",
      );
    }
  };

  if (!confirm) {
    return (
      <div className="border-t border-red-100 pt-8 mt-8">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              Delete Account
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Permanently delete your account and all associated data. This
              cannot be undone.
            </p>
            <button
              onClick={() => setConfirm(true)}
              className="mt-3 text-sm text-red-600 border border-red-200 hover:bg-red-50 px-4 py-1.5 rounded-lg transition-colors"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-red-100 pt-8 mt-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> This action is permanent and
          cannot be reversed.
        </p>
        <p className="text-xs text-red-700">
          All your shipment history, saved cards, and account data will be
          permanently deleted.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm with your password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setConfirm(false);
              setPassword("");
              setError("");
            }}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" /> Permanently Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState("personal");
  const user = useSelector((s: RootState) => s.auth.user);
  const isCustomer = user?.role === "CUSTOMER";
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) {
      setActive(tab);
    }
  }, [searchParams]);

  return (
    <div className="pb-10 max-w-4xl">
      <div className="text-dashboard-heading mb-6">Settings</div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-8 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                active === tab.id
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        {active === "personal" && (
          <>
            <PersonalInformationForm />
            {/* Delete account only shown on Personal Info tab for customers */}
            {isCustomer && <DeleteAccountSection />}
          </>
        )}
        {active === "company" && <CompanyInformationForm />}
        {active === "security" && <ChangePasswordForm />}
        {active === "twofa" && <TwoFASetupSection />}
        {active === "payment" && <PaymentMethodForm />}
        {active === "notifications" && <NotificationSettingsSection />}
      </div>
    </div>
  );
}
