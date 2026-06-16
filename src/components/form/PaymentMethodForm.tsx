"use client";

import { useState } from "react";
import {
  useGetSavedCardsQuery,
  useSetDefaultCardMutation,
  useDeleteSavedCardMutation,
} from "@/store/slice/apiSlice";

type SavedCard = {
  id: string;
  authorizationCode: string;
  last4: string | null;
  cardType: string | null;
  bank: string | null;
  expMonth: string | null;
  expYear: string | null;
  isDefault: boolean;
};

const VisaLogo = () => (
  <svg
    viewBox="0 0 48 32"
    className="w-10 h-7"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="32" rx="4" fill="#1A1F71" />
    <text
      x="5"
      y="23"
      fontFamily="Arial"
      fontWeight="bold"
      fontSize="16"
      fill="white"
      letterSpacing="1"
    >
      VISA
    </text>
  </svg>
);

const MastercardLogo = () => (
  <svg
    viewBox="0 0 48 32"
    className="w-10 h-7"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="32" rx="4" fill="#252525" />
    <circle cx="18" cy="16" r="9" fill="#EB001B" />
    <circle cx="30" cy="16" r="9" fill="#F79E1B" />
    <path d="M24 9.28a9 9 0 0 1 0 13.44A9 9 0 0 1 24 9.28z" fill="#FF5F00" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const VerveLogo = () => (
  <svg
    viewBox="0 0 48 32"
    className="w-10 h-7"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="32" rx="4" fill="#15783D" />
    <text
      x="6"
      y="20"
      fontFamily="Arial"
      fontWeight="bold"
      fontSize="13"
      fill="white"
      letterSpacing="0.5"
    >
      VERVE
    </text>
  </svg>
);

const GenericCardLogo = () => (
  <svg
    viewBox="0 0 48 32"
    className="w-10 h-7"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="32" rx="4" fill="#6B7280" />
    <rect x="4" y="8" width="40" height="4" fill="#9CA3AF" />
  </svg>
);

function CardLogo({ cardType }: { cardType?: string | null }) {
  const t = (cardType ?? "").toLowerCase();
  if (t.includes("visa")) return <VisaLogo />;
  if (t.includes("master")) return <MastercardLogo />;
  if (t.includes("verve")) return <VerveLogo />;
  return <GenericCardLogo />;
}

export default function PaymentMethodForm() {
  const { data, isLoading, isError } = useGetSavedCardsQuery();
  const [setDefaultCard, { isLoading: settingDefault }] =
    useSetDefaultCardMutation();
  const [deleteSavedCard, { isLoading: deleting }] =
    useDeleteSavedCardMutation();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const cards: SavedCard[] = data?.data?.cards ?? [];

  const handleSetDefault = (id: string) => {
    setDefaultCard({ id });
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    deleteSavedCard({ id }).finally(() => setPendingDeleteId(null));
  };

  return (
    <div className="flex items-start justify-between w-full">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-20 ">
        {/* Left: Card List */}
        <div className="space-y-3">
          {isLoading && (
            <div className="text-center py-10 text-gray-400 text-sm">
              Loading saved cards...
            </div>
          )}

          {isError && (
            <div className="text-center py-10 text-red-400 text-sm">
              Failed to load saved cards.
            </div>
          )}

          {!isLoading &&
            !isError &&
            cards.map((card) => (
              <div
                key={card.id}
                className={`
                bg-white rounded-2xl border px-4 py-3 shadow-sm
                transition-all duration-300
                ${pendingDeleteId === card.id ? "opacity-0 scale-95" : "opacity-100 scale-100"}
                ${card.isDefault ? "border-gray-200" : "border-gray-200 hover:border-gray-300"}
              `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardLogo cardType={card.cardType} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {card.cardType ?? "Card"}
                        {card.bank ? ` · ${card.bank}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 tracking-wider">
                        .... .... {card.last4 ?? "----"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {card.isDefault ? (
                      <span className="text-xs font-medium text-red-500 border border-red-200 bg-red-50 px-2.5 py-1 rounded-full">
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        disabled={settingDefault}
                        className="text-xs font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors duration-150 disabled:opacity-50"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(card.id)}
                      disabled={deleting}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-150 p-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      aria-label="Delete card"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {(card.expMonth || card.expYear) && (
                  <p className="text-xs text-gray-400 mt-2 ml-[52px]">
                    Expires: {card.expMonth ?? "--"}/{card.expYear ?? "--"}
                  </p>
                )}
              </div>
            ))}

          {!isLoading && !isError && cards.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No payment methods added yet. Cards used for a successful
              payment will appear here automatically.
            </div>
          )}
        </div>

        {/* Right: Header + Info */}
        <div className="flex flex-col gap-4 pt-1">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Payment Methods
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your cards and payment options
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-500">
            Cards are saved automatically the next time you pay for a
            shipment with Paystack — there's no manual "add card" step.
            Once saved, you can set a default or remove a card here.
          </div>
        </div>
      </div>
    </div>
  );
}
