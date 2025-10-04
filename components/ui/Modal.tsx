"use client";

import { ReactNode, useEffect } from "react";
import { Button } from "./Button";
import { X } from "lucide-react";
import { cx } from "@/utils/cx";

export type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
  bodyClassName?: string;
  zIndexClass?: string; // e.g. z-[1000]
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  headerActions,
  footer,
  size = "lg",
  className,
  bodyClassName,
  zIndexClass = "z-[1000]",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths: Record<ModalSize, string> = {
    sm: "w-[min(500px,96vw)]",
    md: "w-[min(700px,96vw)]",
    lg: "w-[min(1100px,96vw)]",
    xl: "w-[min(1300px,96vw)]",
  };

  return (
    <div
      className={cx("fixed inset-0 flex items-center justify-center bg-black/40", zIndexClass)}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "bg-white rounded-xl shadow-xl ring-1 ring-gray-200 max-h-[95vh] flex flex-col",
          widths[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || headerActions) && (
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <div className="flex items-center gap-2">
              {headerActions}
              <Button aria-label="Close" iconOnly variant="ghost" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
          </div>
        )}
        <div className={cx("p-4 flex-1 overflow-auto", bodyClassName)}>{children}</div>
        {footer && <div className="px-4 py-3 border-t flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
