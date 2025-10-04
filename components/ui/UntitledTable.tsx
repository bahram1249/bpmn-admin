"use client";
import React from "react";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";

export type TableColumn<T = any> = {
  key: keyof T | string;
  header: React.ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
};

export type SortOrder = "ASC" | "DESC" | undefined;

type UntitledTableProps<T = any> = {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  // sorting
  orderBy?: string;
  sortOrder?: SortOrder;
  onSortChange?: (orderBy: string, sortOrder: Exclude<SortOrder, undefined>) => void;
  // pagination
  page?: number; // zero-based
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function UntitledTable<T = any>({
  columns,
  data,
  loading = false,
  emptyMessage = "No results",
  orderBy,
  sortOrder,
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: UntitledTableProps<T>) {
  const hasTotal = typeof total === "number";
  const canPaginate = typeof page === "number" && typeof pageSize === "number"; // allow paginate without total
  const pageCount = hasTotal ? Math.max(1, Math.ceil((total as number) / (pageSize as number))) : undefined;

  function handleSort(colKey: string, sortable?: boolean) {
    if (!onSortChange || !sortable) return;
    const nextOrder: Exclude<SortOrder, undefined> = orderBy === colKey ? (sortOrder === "ASC" ? "DESC" : "ASC") : "ASC";
    onSortChange(colKey, nextOrder);
  }

  // Build a compact page range with ellipses, centered around the current page
  function getPageItems(current: number, count: number, siblingCount = 1) {
    const totalPageNumbers = siblingCount * 2 + 5; // first, last, current, 2*siblings, 2*ellipses
    if (count <= totalPageNumbers) {
      return Array.from({ length: count }, (_, i) => i + 1);
    }

    const currentPage = current + 1; // convert zero-based to 1-based for display
    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, count);

    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < count - 1;

    const items: Array<number | "ellipsis"> = [];
    // Always show first
    items.push(1);

    if (showLeftEllipsis) items.push("ellipsis");

    // Pages between siblings
    for (let p = Math.max(2, leftSibling); p <= Math.min(count - 1, rightSibling); p++) {
      items.push(p);
    }

    if (showRightEllipsis) items.push("ellipsis");

    // Always show last
    if (count > 1) items.push(count);

    return items;
  }

  return (
    <div className="rounded-xl ring-1 ring-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c, i) => {
                const isActive = orderBy === (c.key as string);
                const showSort = c.sortable && onSortChange;
                return (
                  <th
                    key={i}
                    className={`px-3.5 py-2.5 text-xs font-medium text-gray-600 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}
                    style={{ width: c.width }}
                  >
                    {showSort ? (
                      <span
                        className="inline-flex items-center gap-1 hover:text-gray-900 cursor-pointer select-none"
                        onClick={() => handleSort(c.key as string, c.sortable)}
                      >
                        {c.header}
                      </span>
                    ) : (
                      <span className="inline-block select-none">{c.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 text-sm">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!loading && data.map((row: any, rIndex) => (
              <tr key={rIndex} className="odd:bg-white even:bg-gray-50 hover:bg-gray-50">
                {columns.map((c, cIndex) => (
                  <td
                    key={cIndex}
                    className={`px-3.5 py-2.5 text-sm text-gray-700 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"}`}
                    style={{ width: c.width }}
                  >
                    {c.render ? c.render(row, rIndex) : String(row[c.key as any] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canPaginate && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            {onPageSizeChange && (
              <div className="flex items-center gap-1">
                <span className="text-gray-600">Rows per page:</span>
                <select
                  className="border border-gray-300 rounded-md px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    onPageSizeChange?.(newSize);
                  }}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              Page {(page as number) + 1}{pageCount ? ` of ${pageCount}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onPageChange && onPageChange(Math.max(0, (page as number) - 1))}
              disabled={(page as number) <= 0}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            {pageCount !== undefined && (
              <div className="flex items-center gap-1">
                {getPageItems(page as number, pageCount).map((item, idx) =>
                  item === "ellipsis" ? (
                    <span key={`e-${idx}`} className="px-1 text-gray-400 select-none">…</span>
                  ) : (
                    <Button
                      key={item}
                      size="sm"
                      variant={(item - 1) === (page as number) ? "primary" : "secondary"}
                      onClick={() => onPageChange && onPageChange(item - 1)}
                      aria-current={(item - 1) === (page as number) ? "page" : undefined}
                    >
                      {item}
                    </Button>
                  )
                )}
              </div>
            )}

            <Button
              size="sm"
              variant="secondary"
              onClick={() => onPageChange && onPageChange(((page as number) + 1))}
              disabled={pageCount !== undefined ? (((page as number) + 1) >= pageCount) : (Array.isArray(data) && data.length < (pageSize as number))}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
