/**
 * src/components/ui/Button.tsx — Button Primitive
 *
 * Polymorphic button with variants: primary, secondary, ghost, danger, outline.
 * Sizes: sm, md, lg. Loading state shows an inline spinner.
 */

"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon-md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-primary)] text-white font-semibold",
    "hover:bg-[var(--color-primary-light)]",
    "shadow-[0_0_24px_var(--color-primary-glow)]",
    "hover:shadow-[0_0_32px_var(--color-primary-glow)]",
    "disabled:bg-[var(--color-primary-dark)] disabled:shadow-none",
  ].join(" "),
  secondary: [
    "bg-[var(--glass-bg)] text-[var(--color-text-primary)] font-medium",
    "border border-[var(--glass-border)]",
    "hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-border-hover)]",
    "disabled:opacity-50",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--color-text-secondary)] font-medium",
    "hover:bg-white/5 hover:text-[var(--color-text-primary)]",
    "disabled:opacity-50",
  ].join(" "),
  danger: [
    "bg-[var(--color-danger-ghost)] text-[var(--color-danger-light)] font-semibold",
    "border border-[var(--color-danger-ghost)]",
    "hover:bg-[var(--color-danger)] hover:text-white hover:border-[var(--color-danger)]",
    "disabled:opacity-50",
  ].join(" "),
  outline: [
    "bg-transparent text-[var(--color-text-primary)] font-medium",
    "border border-[var(--glass-border)]",
    "hover:bg-white/[0.04] hover:border-[var(--glass-border-hover)]",
    "disabled:opacity-50",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-5 text-sm rounded-xl gap-2",
  "icon-sm": "h-8 w-8 rounded-lg",
  "icon-md": "h-10 w-10 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex items-center justify-center",
          "transition-all duration-[var(--duration-base)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-brand-bg)]",
          "disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
