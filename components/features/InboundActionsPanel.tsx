"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchJson, toDeepQuery } from "../../lib/api";
import { LookupModal } from "../ui/LookupModal";
import { UntitledTable } from "../ui/UntitledTable";
import { Button } from "../ui/Button";
import { Plus, Pencil, Trash2, Check, X, ArrowDown } from "lucide-react";

export interface InboundActionItem {
  id: number;
  activityId: number;
  actionId: number;
  priority?: number;
  activity?: { id: number; name: string };
  action?: { id: number; name: string };
}

export type InboundActionsPanelProps = {
  fixedActivityId?: number;
  modalZIndex?: number;
  variant?: 'page' | 'modal';
  showToolbar?: boolean;
  className?: string;
};

export function InboundActionsPanel({ fixedActivityId, modalZIndex = 50, variant = 'page', showToolbar = true, className = '' }: InboundActionsPanelProps) {
  const [items, setItems] = useState<InboundActionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [actionId, setActionId] = useState<number | "">("");
  const [actionName, setActionName] = useState("");
  const [priority, setPriority] = useState<number | "">("");

  const [showActionLookup, setShowActionLookup] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<InboundActionItem | null>(null);

  const queryObj = useMemo(() => ({
    limit: pageSize,
    offset: page * pageSize,
    orderBy,
    sortOrder,
    ...(fixedActivityId ? { activityId: fixedActivityId } : {}),
  }), [page, pageSize, orderBy, sortOrder, fixedActivityId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery(queryObj);
      const res = await fetchJson<{ result: InboundActionItem[]; total: number }>(`/api/bpmn/inbound-actions${q}`);
      setItems(res.result);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/inbound-actions/`, {
        method: "POST",
        body: {
          activityId: fixedActivityId,
          actionId: actionId === "" ? undefined : Number(actionId),
          priority: priority === "" ? undefined : Number(priority),
        },
      });
      setShowCreate(false);
      setActionId("");
      setActionName("");
      setPriority("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function update(id: number) {
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/inbound-actions/${id}`, {
        method: "PUT",
        body: {
          actionId: actionId === "" ? undefined : Number(actionId),
          priority: priority === "" ? undefined : Number(priority),
        },
      });
      setEditItem(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this inbound action?")) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/inbound-actions/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, orderBy, sortOrder, pageSize, fixedActivityId]);

  const toolbarStyle = { marginBottom: variant === 'modal' ? 8 : 12 } as const;

  return (
    <div className={"space-y-3 " + (className || '')}>
      {error && <div className="alert">{error}</div>}
      {showToolbar && (
        <div className="container" style={toolbarStyle}>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Create inbound</Button>
        </div>
      )}

      <LookupModal
        title="Select Action"
        fetchUrl="/api/bpmn/actions/lookup"
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'name', header: 'Name' },
        ]}
        isOpen={showActionLookup}
        onClose={() => setShowActionLookup(false)}
        onSelect={(row: any) => { setActionId(row.id); setActionName(row.name); }}
      />

      <UntitledTable
        columns={[
          { key: 'id', header: 'ID', width: 80, sortable: true },
          { key: 'action', header: 'Action', render: (r: any) => r.action?.name ?? r.actionId },
          { key: 'priority', header: 'Priority' },
          { key: '__actions__', header: '', align: 'right', render: (p: any) => (
            <div className="flex items-center justify-end gap-2">
              <Button
                aria-label="Edit"
                title="Edit"
                iconOnly
                variant="secondary"
                onClick={() => {
                  setEditItem(p);
                  setActionId(p.actionId);
                  setActionName(p.action?.name ?? '');
                  setPriority(p.priority ?? '');
                }}
              >
                <Pencil size={16} />
              </Button>
              <Button aria-label="Delete" title="Delete" iconOnly variant="danger" onClick={() => remove(p.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ) },
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
        onPageSizeChange={variant === 'page' ? ((s) => { setPageSize(s); setPage(0); }) : undefined}
      />

      {(showCreate || editItem) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: modalZIndex }}>
          <div className="bg-white rounded-lg shadow-xl w-[min(800px,96vw)] p-4 space-y-3">
            <h3 className="text-lg font-semibold">{editItem ? `Edit Inbound #${editItem.id}` : "Create Inbound"}</h3>
            <div className="container" style={{ gap: 8, flexWrap: "wrap" as const }}>
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowActionLookup(true)}>Pick Action</Button>
                <span className="text-sm text-gray-600">{actionName || (actionId ? `ID: ${actionId}` : 'None')}</span>
              </div>
              <input
                placeholder="Priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value === '' ? '' : Number(e.target.value))}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
                style={{ width: 160 }}
              />
            </div>
            <div className="container" style={{ gap: 8, justifyContent: "flex-end" }}>
              <Button variant="secondary" leftIcon={<X size={16} />} onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              {editItem ? (
                <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => update(editItem.id)} disabled={loading || !actionId}>Save</Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={create} disabled={loading || !actionId}>Create</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
