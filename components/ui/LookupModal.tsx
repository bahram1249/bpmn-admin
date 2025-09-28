"use client";
import React, { useEffect, useMemo, useState } from "react";
import { fetchJson, toDeepQuery } from "../../lib/api";

export type LookupColumn<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: number | string;
};

type LookupModalProps<T = any> = {
  title: string;
  fetchUrl: string; // e.g., /api/bpmn/processes/lookup
  columns: LookupColumn<T>[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (row: T) => void;
  initialQuery?: Record<string, any>;
};

export function LookupModal<T = any>({
  title,
  fetchUrl,
  columns,
  isOpen,
  onClose,
  onSelect,
  initialQuery,
}: LookupModalProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const query = useMemo(() => ({
    ...(initialQuery || {}),
    search,
    limit: pageSize,
    offset: page * pageSize,
    orderBy: "id",
    sortOrder: "DESC",
  }), [search, page, pageSize, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const q = toDeepQuery(query);
        const res = await fetchJson<{ result: T[]; total?: number }>(`${fetchUrl}${q}`);
        if (!active) return;
        setItems(res.result ?? []);
        if (typeof (res as any).total === "number") setTotal((res as any).total);
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchUrl, JSON.stringify(query), isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[min(900px,96vw)] max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        </div>
        <div className="p-3 flex gap-2 items-center border-b">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setPage(0); setSearch(e.target.value); }}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div className="overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 text-gray-700 text-sm">
              <tr>
                {columns.map((c, idx) => (
                  <th key={idx} className="text-left font-medium px-4 py-2" style={{ width: c.width }}>{c.header}</th>
                ))}
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((row: any, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  {columns.map((c, idx) => (
                    <td key={idx} className="px-4 py-2 text-sm">
                      {c.render ? c.render(row) : String(row[c.key as any] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">
                    <button
                      className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => { onSelect(row); onClose(); }}
                      disabled={loading}
                    >Select</button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-gray-500">
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t flex items-center justify-between text-sm">
          <div className="text-gray-600">{loading ? "Loading..." : error ? <span className="text-red-600">{error}</span> : `${items.length} results`}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={loading || page === 0}
            >Previous</button>
            <span>Page {page + 1}</span>
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || (total > 0 && (page + 1) * pageSize >= total)}
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
