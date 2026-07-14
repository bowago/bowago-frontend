"use client";

import * as React from "react";
import { forwardRef } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { ReactNode } from "react";
import { cn } from "@/utils/cn";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "../field";

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupInputProps {
  label?: string;
  error?: string;
  options: RadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const RadioGroupInput = forwardRef<HTMLDivElement, RadioGroupInputProps>(
  ({ label, error, options, value, onValueChange, className = "" }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-black">{label}</label>
        )}

        <RadioGroup
          ref={ref}
          value={value}
          onValueChange={onValueChange}
          className={`flex flex-col gap-3 ${className}`}
        >
          {options?.map((opt) => (
            <div key={opt?.value} className="flex items-center gap-3">
              <RadioGroupItem value={opt?.value} id={opt?.value} />
              <label
                htmlFor={opt?.value}
                className="text-sm font-medium text-black cursor-pointer"
              >
                {opt?.label}
              </label>
            </div>
          ))}
        </RadioGroup>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  },
);

RadioGroupInput.displayName = "RadioGroupInput";

type Option = {
  label: string;
  description?: string;
  value: string;
  icon?: ReactNode;
};

type RadioGroupCardProps = {
  options: Option[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  label?: string;
  error?: string;
};

export function RadioGroupCard({
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  label,
  error,
}: RadioGroupCardProps) {
  // Controlled: use `value` if provided, otherwise fall back to internal state.
  // No defaultValue means no visual selection until the user actually picks
  // one — falling back to options[0] here was what made an unselected field
  // look selected while the underlying form value stayed undefined.
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const selected = value !== undefined ? value : internalValue;

  const handleSelect = (optValue: string) => {
    if (value === undefined) setInternalValue(optValue);
    onValueChange?.(optValue);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-black">{label}</label>
      )}

      <div className={cn("flex gap-2", className)}>
        {options.map((item) => {
          const isSelected = selected === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item.value)}
              className={cn(
                "flex-1 flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-brand bg-red-50 ring-1 ring-brand"
                  : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <div className={isSelected ? "text-brand" : "text-gray-400"}>
                    {item.icon}
                  </div>
                )}
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-brand" : "text-gray-800",
                    )}
                  >
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Custom radio dot */}
              <span
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  isSelected ? "border-brand" : "border-gray-300",
                )}
              >
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-brand block" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
