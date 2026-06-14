/**
 * src/components/ui/Select.tsx — Select Dropdown Primitive
 */

"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helper,
      options,
      placeholder,
      id,
      className,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-lg border bg-[var(--color-brand-surface)] text-[var(--color-text-primary)] text-sm",
              "px-3 py-2.5 pr-9",
              "transition-all duration-[var(--duration-base)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent",
              error
                ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
                : "border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)]">
            <ChevronDown className="h-4 w-4" />
          </div>
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
Select.displayName = "Select";
