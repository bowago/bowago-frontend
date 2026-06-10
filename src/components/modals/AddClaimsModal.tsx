"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CreateClaimForm } from "../form/CreateClaimForm";
import { CreateFAQForm } from "../form/CreateFAQForm";

export default function AddClaimsModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (e: boolean) => void;
}) {
  const handleOpenChange = (v: boolean) => {
    setIsOpen(v);
  };

  return (
    <div className="flex items-center justify-center">
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fadeIn_150ms_ease]" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 focus:outline-none"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-1">
              <Dialog.Close asChild>
                <button className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Dialog.Close>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Add New Claim
              </Dialog.Title>
              <span className="w-6" />
            </div>

            <CreateFAQForm onSuccess={() => setIsOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -46%) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </div>
  );
}
