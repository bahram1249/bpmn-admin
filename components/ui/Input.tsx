"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/utils/cx";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, size = "sm", fullWidth = false, className, id, ...rest },
  ref,
) {
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-3.5 py-2.5 text-[15px]",
  } as const;

  const inputId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <label className={cx("inline-flex flex-col gap-1", fullWidth && "w-full")}
      htmlFor={inputId}
    >
      {label && <span className="text-sm font-medium text-secondary select-none">{label}</span>}
      <input
        ref={ref}
        id={inputId}
        {...rest}
        className={cx(
          "rounded-md border bg-white outline-none border-gray-300 placeholder:text-gray-400",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30",
          "disabled:bg-disabled_subtle disabled:text-fg-disabled disabled:border-disabled",
          sizes[size],
          fullWidth ? "w-full" : undefined,
          error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/30" : undefined,
          className,
        )}
      />
      {hint && !error && <span className="text-xs text-tertiary">{hint}</span>}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
});
