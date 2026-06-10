"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/utils/cn";
import { Percent, FileText, Layers } from "lucide-react";
import AddStandardRateModal from "./AddStandardRateModal";
import ContractRateModal from "./AddContractRateModal";
import AddPromoRateModal from "./AddPromoRateModal";

export type RateType = "standard" | "contract" | "promo";

export default function CreateRateModal({
  isOpen,
  setIsOpen,
  defaultRate,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  defaultRate: RateType;
}) {
  const [selected, setSelected] = useState<RateType>(defaultRate);
  const [isOpenAddPromoRateModal, setIsOpenAddPromoRateModal] = useState(false);
  const [isOpenStandardRateModal, setIsOpenStandardRateModal] = useState(false);
  const [isOpenContractRateModal, setIsOpenContractRateModal] = useState(false);

  useEffect(() => {
    setSelected(defaultRate);
  }, [defaultRate]);

  const openStandardRateModal = () => {
    setIsOpenStandardRateModal(true);
    setIsOpen(false);
  };
  const openContractRateModal = () => {
    setIsOpenContractRateModal(true);
    setIsOpen(false);
  };
  const openPromoRateModal = () => {
    setIsOpenAddPromoRateModal(true);
    setIsOpen(false);
  };
  const handleContinue = () => {
    if (selected === "standard") openStandardRateModal();
    if (selected === "contract") openContractRateModal();
    if (selected === "promo") openPromoRateModal();

    console.log("Selected:", selected);
    // 👉 route or open next modal
  };

  const options = [
    {
      key: "standard",
      title: "Standard Rate",
      description: "Standard rate is the default rate applied to all users",
      icon: Layers,
    },
    {
      key: "contract",
      title: "Contract Rate",
      description: "Special rate assigned to specific users based on agreement",
      icon: FileText,
    },
    {
      key: "promo",
      title: "Promo Rate",
      description: "Discounted rate used for promotions or campaigns",
      icon: Percent,
    },
  ];

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-semibold text-gray-900">
                Create Rate
              </Dialog.Title>

              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                  ✕
                </button>
              </Dialog.Close>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {options?.map((item) => {
                console.log(selected, item.key);
                const Icon = item.icon;
                const isActive = selected === item.key;

                return (
                  <div
                    key={item.key}
                    onClick={() => setSelected(item.key as RateType)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-6 transition-all duration-200 flex flex-col gap-4",
                      isActive
                        ? "border-red-500 ring-2 ring-red-100 bg-red-50"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg",
                        isActive
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      <Icon size={20} />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end mt-8">
              <Button
                onClick={handleContinue}
                className="px-6 py-2.5 text-sm font-medium"
              >
                Continue
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AddStandardRateModal
        isOpen={isOpenStandardRateModal}
        setIsOpen={setIsOpenStandardRateModal}
      />

      <ContractRateModal
        isOpen={isOpenContractRateModal}
        setIsOpen={setIsOpenContractRateModal}
      />
      <AddPromoRateModal
        isOpen={isOpenAddPromoRateModal}
        setIsOpen={setIsOpenAddPromoRateModal}
      />
    </>
  );
}
