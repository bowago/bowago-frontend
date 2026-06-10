"use client";
import { useState } from "react";
import { PersonalInformationForm } from "@/components/form/PersonalInformationForm";
import { CompanyInformationForm } from "@/components/form/CompanyInformationForm";
import { ChangePasswordForm } from "@/components/form/ChangePasswordForm";
import { PaymentMethodForm } from "@/components/form/PaymentMethodForm";
import TwoFASetupSection from "@/components/form/TwoFASetupSection";
import { User, Building2, Lock, CreditCard, Shield } from "lucide-react";

const TABS = [
  { id: "personal",  label: "Personal Info",    icon: User },
  { id: "company",   label: "Company Info",      icon: Building2 },
  { id: "security",  label: "Password",          icon: Lock },
  { id: "twofa",     label: "2FA Security",      icon: Shield },
  { id: "payment",   label: "Payment Method",    icon: CreditCard },
];

export default function SettingsPage() {
  const [active, setActive] = useState("personal");

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
        {active === "personal" && <PersonalInformationForm />}
        {active === "company"  && <CompanyInformationForm />}
        {active === "security" && <ChangePasswordForm />}
        {active === "twofa"    && <TwoFASetupSection />}
        {active === "payment"  && <PaymentMethodForm />}
      </div>
    </div>
  );
}
