"use client";

import { cx } from "@/utils/cx";

export type DotSize = "sm" | "md" | "lg";

interface DotProps {
  size?: DotSize;
  className?: string;
}

// A tiny circular dot that inherits its color from currentColor
// and supports three sizes to align with badge sizing.
export function Dot({ size = "md", className = "" }: DotProps) {
  const px = size === "sm" ? 8 : size === "lg" ? 12 : 10; // sm:8px, md:10px, lg:12px
  return (
    <span
      className={cx("inline-block rounded-full align-middle", className)}
      style={{ width: px, height: px, backgroundColor: "currentColor" }}
    />
  );
}
