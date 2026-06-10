"use client";

import {
  forwardRef,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(
  (
    { label, error, leftIcon, rightElement, className = "", ...props },
    ref,
  ) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-black">
            {label}
          </label>
        )}

        <div className="relative flex items-start">
          {/* Left Icon */}
          {leftIcon && (
            <span className="absolute left-3 top-3 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <textarea
            ref={ref}
            className={`
              w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900
              placeholder:text-gray-400 outline-none transition-all duration-200
              resize-none min-h-[100px]
              ${leftIcon ? "pl-10" : ""}
              ${rightElement ? "pr-10" : ""}
              ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              }
              ${className}
            `}
            {...props}
          />

          {/* Right Element */}
          {rightElement && (
            <span className="absolute right-3 top-3">
              {rightElement}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  },
);


export default TextArea;
TextArea.displayName = "TextArea";