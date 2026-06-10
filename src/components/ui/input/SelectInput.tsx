"use client";

import { forwardRef, type ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  placeholder?: string;
  options: { label: string; value: string }[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const SelectInput = forwardRef<HTMLButtonElement, SelectInputProps>(
  (
    {
      label,
      error,
      leftIcon,
      placeholder,
      options,
      value,
      onValueChange,
      className = "",
      disabled,
    },
    ref,
  ) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-black">{label}</label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger
              ref={ref}
              disabled={disabled}
              className={`
                w-full rounded-lg border bg-white px-3 py-5.5 text-sm text-gray-900
                placeholder:text-gray-400 outline-none transition-all duration-200
                ${leftIcon ? "pl-10" : ""}
                ${
                  error
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:ring-2 focus:ring-red-100"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${className}
              `}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt?.value} value={opt?.value}>
                  {opt?.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  },
);

SelectInput.displayName = "SelectInput";
