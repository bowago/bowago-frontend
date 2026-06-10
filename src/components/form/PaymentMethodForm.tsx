"use client";

import { useState } from "react";

type Card = {
  id: number;
  type: "visa" | "mastercard";
  last4: string;
  expiry: string;
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

const initialCards: Card[] = [
  { id: 1, type: "visa", last4: "2348", expiry: "12/24", isDefault: true },
  {
    id: 2,
    type: "mastercard",
    last4: "2348",
    expiry: "12/24",
    isDefault: false,
  },
  {
    id: 3,
    type: "mastercard",
    last4: "2348",
    expiry: "12/24",
    isDefault: false,
  },
];

export default function PaymentMethodForm() {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const setDefault = (id: number) => {
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const deleteCard = (id: number) => {
    setDeletingId(id);
    setTimeout(() => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
    }, 300);
  };

  return (
    <div className="flex items-start justify-between w-full">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-20 ">
        {/* Left: Card List */}
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`
                bg-white rounded-2xl border px-4 py-3 shadow-sm
                transition-all duration-300
                ${deletingId === card.id ? "opacity-0 scale-95" : "opacity-100 scale-100"}
                ${card.isDefault ? "border-gray-200" : "border-gray-200 hover:border-gray-300"}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {card.type === "visa" ? <VisaLogo /> : <MastercardLogo />}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 capitalize">
                      {card.type === "visa" ? "Visa" : "Mastercard"}
                    </p>
                    <p className="text-xs text-gray-400 tracking-wider">
                      .... .... {card.last4}
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
                      onClick={() => setDefault(card.id)}
                      className="text-xs font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors duration-150"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-150 p-1 rounded-lg hover:bg-red-50"
                    aria-label="Delete card"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2 ml-[52px]">
                Expires: {card.expiry}
              </p>
            </div>
          ))}

          {cards.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No payment methods added yet.
            </div>
          )}
        </div>

        {/* Right: Header + CTA */}
        <div className="flex flex-col gap-4 pt-1">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Payment Methods
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your cards and payment options
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl px-5 py-3.5 shadow-md shadow-red-200 transition-all duration-150 w-full">
            <PlusIcon />
            Add New Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}
