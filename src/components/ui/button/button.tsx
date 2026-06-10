"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "social";
  fullWidth?: boolean;
  size?: "big";
}

export function Button({
  children,
  isLoading = false,
  variant = "primary",
  fullWidth = false,
  className = "",
  size = "big",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary:
      "bg-brand hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500 shadow-sm hover:shadow-md",
    secondary:
      "bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-200 focus:ring-gray-300",
    ghost: "text-red-600 hover:bg-red-50 active:bg-red-100 focus:ring-red-300",
    social:
      "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 focus:ring-gray-300 shadow-sm",
  };
  const sizes = {
    big: "py-4 px-4 text-lg",
  };

  return (
    <button
      className={`
        px-4 py-2.5
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
