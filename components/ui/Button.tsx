"use client";
import React from "react";

type Variant = "primary" | "secondary" | "tertiary" | "danger" | "ghost";
type Size = "sm" | "md";

export type UIButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const Button: React.FC<UIButtonProps> = ({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes: Record<Size, string> = {
    sm: iconOnly ? "p-2 text-sm" : "px-2.5 py-1.5 text-sm",
    md: iconOnly ? "p-2.5 text-sm" : "px-3.5 py-2.5 text-sm",
  };

  const variants: Record<Variant, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    tertiary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {iconOnly ? (
        children ? (
          <span className="shrink-0">{children}</span>
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
