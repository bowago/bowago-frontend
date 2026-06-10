"use client";

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, leftIcon, rightElement, className = "", type, ...props },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm  font-medium text-black">{label}</label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            type={inputType}
            // h-[58px]
            className={`
              w-full rounded-lg border bg-white px-3 py-2.5  text-sm text-gray-900
              placeholder:text-gray-400 outline-none transition-all duration-200
              ${leftIcon ? "pl-10" : ""}
              ${isPassword || rightElement ? "pr-10" : ""}
              ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              }
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {rightElement && !isPassword && (
            <span className="absolute right-3">{rightElement}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  },
);

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-[10px] text-red-500">{message}</p> : null;

Input.displayName = "Input";
