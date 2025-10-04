"use client";
import React from "react";
import { Button } from "./Button";

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
}: UntitledTableProps<T>) {
  const hasTotal = typeof total === "number";
  const canPaginate = typeof page === "number" && typeof pageSize === "number"; // allow paginate without total
  const pageCount = hasTotal ? Math.max(1, Math.ceil((total as number) / (pageSize as number))) : undefined;

  function handleSort(colKey: string, sortable?: boolean) {
    if (!onSortChange || !sortable) return;
    const nextOrder: Exclude<SortOrder, undefined> = orderBy === colKey ? (sortOrder === "ASC" ? "DESC" : "ASC") : "ASC";
    onSortChange(colKey, nextOrder);
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
          <div>
            Page {((page as number) + 1)}{pageCount ? ` of ${pageCount}` : ""}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onPageChange && onPageChange(Math.max(0, (page as number) - 1))}
              disabled={(page as number) <= 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onPageChange && onPageChange(((page as number) + 1))}
              disabled={pageCount !== undefined ? (((page as number) + 1) >= pageCount) : (Array.isArray(data) && data.length < (pageSize as number))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
