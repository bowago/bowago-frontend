"use client";

import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
}

export function OTPInput({
  value,
  onChange,
  length = 4,
  error,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, "").split("").slice(0, length);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char.slice(-1);
    onChange(newDigits.join("").trimEnd());
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`
              w-12 h-12 text-center text-lg font-bold rounded-lg border outline-none
              transition-all duration-200
              ${
                digits[index]
                  ? "border-brand bg-red-50 text-brand"
                  : "border-gray-200 bg-white text-gray-900"
              }
              ${error ? "border-red-400" : "focus:border-red-500 focus:ring-2 focus:ring-red-100"}
              caret-transparent
            `}
          />
        ))}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
