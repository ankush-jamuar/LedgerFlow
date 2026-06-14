/**
 * src/components/ui/Input.tsx — Text Input Primitive
 */

"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      id,
      className,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm",
              "px-3 py-2.5 placeholder:text-[var(--color-text-muted)]",
              "transition-all duration-[var(--duration-base)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent",
              error
                ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
                : "border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-[var(--color-danger-light)]" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-xs text-[var(--color-text-muted)]">{helper}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
