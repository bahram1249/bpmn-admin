"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchJson, toDeepQuery } from "../../lib/api";
import { LookupModal } from "../ui/LookupModal";
import { UntitledTable } from "../ui/UntitledTable";
import { Button } from "../ui/Button";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export interface NodeConditionItem {
  nodeId: number;
  conditionId: number;
  priority?: number;
  node?: { id: number; name?: string };
  condition?: { id: number; name: string };
}

export type NodeConditionsPanelProps = {
  fixedNodeId: number;
  modalZIndex?: number;
};

export function NodeConditionsPanel({ fixedNodeId, modalZIndex = 50 }: NodeConditionsPanelProps) {
  const [items, setItems] = useState<NodeConditionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [orderBy, setOrderBy] = useState<string>("conditionId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [conditionId, setConditionId] = useState<number | "">("");
  const [conditionName, setConditionName] = useState("");
  const [priority, setPriority] = useState<number | "">("");

  const [showConditionLookup, setShowConditionLookup] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<NodeConditionItem | null>(null);

  const queryObj = useMemo(() => ({
    limit: pageSize,
    offset: page * pageSize,
    orderBy,
    sortOrder,
    nodeId: fixedNodeId,
  }), [page, pageSize, orderBy, sortOrder, fixedNodeId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery(queryObj);
      const res = await fetchJson<{ result: NodeConditionItem[]; total: number }>(`/api/bpmn/node-conditions${q}`);
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
      await fetchJson(`/api/bpmn/node-conditions/`, {
        method: "POST",
        body: {
          nodeId: fixedNodeId,
          conditionId: conditionId === "" ? undefined : Number(conditionId),
          priority: priority === "" ? undefined : Number(priority),
        },
      });
      setShowCreate(false);
      setConditionId("");
      setConditionName("");
      setPriority("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function update(item: NodeConditionItem) {
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/node-conditions/${item.nodeId}/${item.conditionId}`, {
        method: "PUT",
        body: {
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

  async function remove(item: NodeConditionItem) {
    if (!confirm("Delete this node condition?")) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/node-conditions/${item.nodeId}/${item.conditionId}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, orderBy, sortOrder, fixedNodeId]);

  return (
    <div className="space-y-3">
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12 }}>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Add condition</Button>
      </div>

      <LookupModal
        title="Select Condition"
        fetchUrl="/api/bpmn/conditions/lookup"
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'name', header: 'Name' },
        ]}
        isOpen={showConditionLookup}
        onClose={() => setShowConditionLookup(false)}
        onSelect={(row: any) => { setConditionId(row.id); setConditionName(row.name); }}
      />

      <UntitledTable
        columns={[
          { key: 'condition', header: 'Condition', render: (r: any) => r.condition?.name ?? r.conditionId },
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
                  setConditionId(p.conditionId);
                  setConditionName(p.condition?.name ?? '');
                  setPriority(p.priority ?? '');
                }}
              >
                <Pencil size={16} />
              </Button>
              <Button aria-label="Delete" title="Delete" iconOnly variant="danger" onClick={() => remove(p)}>
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
      />

      {(showCreate || editItem) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: modalZIndex }}>
          <div className="bg-white rounded-lg shadow-xl w-[min(800px,96vw)] p-4 space-y-3">
            <h3 className="text-lg font-semibold">{editItem ? `Edit Condition #${editItem.conditionId}` : "Add Condition"}</h3>
            <div className="container" style={{ gap: 8, flexWrap: "wrap" as const }}>
              {!editItem && (
                <div className="container" style={{ gap: 6 }}>
                  <Button variant="secondary" onClick={() => setShowConditionLookup(true)}>Pick Condition</Button>
                  <span className="text-sm text-gray-600">{conditionName || (conditionId ? `ID: ${conditionId}` : 'None')}</span>
                </div>
              )}
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
                <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => update(editItem)} disabled={loading}>Save</Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={create} disabled={loading || !conditionId}>Create</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
