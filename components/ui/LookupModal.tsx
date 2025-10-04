"use client";
import React, { useEffect, useMemo, useState } from "react";
import { fetchJson, toDeepQuery } from "../../lib/api";
import { UntitledTable, TableColumn } from "./UntitledTable";
import { Button } from "./Button";
import { X, Check } from "lucide-react";

export type LookupColumn<T> = TableColumn<T>;

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
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [orderBy, setOrderBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const query = useMemo(() => ({
    ...(initialQuery || {}),
    search,
    limit: pageSize,
    offset: page * pageSize,
    orderBy,
    sortOrder,
  }), [search, page, pageSize, orderBy, sortOrder, initialQuery]);

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
        else setTotal(undefined);
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl ring-1 ring-gray-200 w-[min(900px,96vw)] max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <Button aria-label="Close" iconOnly variant="ghost" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-4 py-3 flex gap-2 items-center border-b">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setPage(0); setSearch(e.target.value); }}
            className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 w-full outline-none"
          />
        </div>
        <div className="p-3 flex-1 overflow-auto">
          <UntitledTable
            columns={[
              ...columns,
              {
                key: "__actions__",
                header: "",
                align: "right",
                render: (row: any) => (
                  <Button size="sm" variant="primary" leftIcon={<Check size={14} />} onClick={() => { onSelect(row); onClose(); }} disabled={loading}>Select</Button>
                ),
              },
            ]}
            data={items}
            loading={loading}
            orderBy={orderBy}
            sortOrder={sortOrder}
            onSortChange={(ob, so) => { setOrderBy(ob); setSortOrder(so); setPage(0); }}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
}
