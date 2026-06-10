"use client";

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
};

export function RadioGroupCard({
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  label,
}: RadioGroupCardProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-black">{label}</label>
      )}

      <RadioGroup
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        className={cn("w-full space-x-3", className)}
      >
        {options.map((item) => (
          <FieldLabel key={item.value} htmlFor={item.value}>
            <Field
              orientation="horizontal"
              className="justify-between items-center border rounded-lg px-4 py-3 cursor-pointer hover:border-gray-300 transition"
            >
              <FieldContent className="flex items-center gap-3">
                {item.icon && <div className="text-gray-500">{item.icon}</div>}

                <div>
                  <FieldTitle>{item.label}</FieldTitle>
                  {item.description && (
                    <FieldDescription>{item.description}</FieldDescription>
                  )}
                </div>
              </FieldContent>

              <RadioGroupItem value={item.value} id={item.value} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </div>
  );
}
