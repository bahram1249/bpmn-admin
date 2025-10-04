"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchJson, toDeepQuery } from "../../lib/api";
import { LookupModal } from "../ui/LookupModal";
import { UntitledTable } from "../ui/UntitledTable";
import { Button } from "../ui/Button";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export interface NodeCommandItem {
  id: number;
  nodeId: number;
  name: string;
  nodeCommandTypeId: number;
  nodeCommandType?: { id: number; name: string };
  route?: string;
}

export type NodeCommandsPanelProps = {
  fixedNodeId: number;
  modalZIndex?: number;
};

export function NodeCommandsPanel({ fixedNodeId, modalZIndex = 50 }: NodeCommandsPanelProps) {
  const [items, setItems] = useState<NodeCommandItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [name, setName] = useState("");
  const [nodeCommandTypeId, setNodeCommandTypeId] = useState<number | "">("");
  const [nodeCommandTypeName, setNodeCommandTypeName] = useState("");
  const [route, setRoute] = useState<string>("");

  const [showTypeLookup, setShowTypeLookup] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<NodeCommandItem | null>(null);

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
      const res = await fetchJson<{ result: NodeCommandItem[]; total: number }>(`/api/bpmn/node-commands${q}`);
      setItems(res.result);
      setTotal(res.total ?? 0);
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
      await fetchJson(`/api/bpmn/node-commands/`, {
        method: "POST",
        body: {
          nodeId: fixedNodeId,
          name: name || undefined,
          nodeCommandTypeId: nodeCommandTypeId === "" ? undefined : Number(nodeCommandTypeId),
          route: route || undefined,
        },
      });
      setShowCreate(false);
      setName("");
      setNodeCommandTypeId("");
      setNodeCommandTypeName("");
      setRoute("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function update(item: NodeCommandItem) {
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/node-commands/${item.id}`, {
        method: "PUT",
        body: {
          name: name || undefined,
          nodeCommandTypeId: nodeCommandTypeId === "" ? undefined : Number(nodeCommandTypeId),
          route: route || undefined,
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

  async function remove(item: NodeCommandItem) {
    if (!confirm("Delete this node command?")) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/node-commands/${item.id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, orderBy, sortOrder, pageSize, fixedNodeId]);

  return (
    <div className="space-y-3">
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12 }}>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Add command</Button>
      </div>

      <LookupModal
        title="Select Command Type"
        fetchUrl="/api/bpmn/node-command-types/lookup"
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'name', header: 'Name' },
        ]}
        isOpen={showTypeLookup}
        onClose={() => setShowTypeLookup(false)}
        onSelect={(row: any) => { setNodeCommandTypeId(row.id); setNodeCommandTypeName(row.name); }}
      />

      <UntitledTable
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'nodeCommandType', header: 'Type', render: (r: any) => r.nodeCommandType?.name ?? r.nodeCommandTypeId },
          { key: 'route', header: 'Route' },
          { key: '__actions__', header: '', align: 'right', render: (p: any) => (
            <div className="flex items-center justify-end gap-2">
              <Button
                aria-label="Edit"
                title="Edit"
                iconOnly
                variant="secondary"
                onClick={() => {
                  setEditItem(p);
                  setName(p.name ?? '');
                  setNodeCommandTypeId(p.nodeCommandTypeId);
                  setNodeCommandTypeName(p.nodeCommandType?.name ?? '');
                  setRoute(p.route ?? '');
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
        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
      />

      {(showCreate || editItem) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: modalZIndex }}>
          <div className="bg-white rounded-lg shadow-xl w-[min(800px,96vw)] p-4 space-y-3">
            <h3 className="text-lg font-semibold">{editItem ? `Edit Command #${editItem.id}` : "Add Command"}</h3>
            <div className="container" style={{ gap: 8, flexWrap: "wrap" as const }}>
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
                style={{ minWidth: 240 }}
              />
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowTypeLookup(true)}>Pick Command Type</Button>
                <span className="text-sm text-gray-600">{nodeCommandTypeName || (nodeCommandTypeId ? `ID: ${nodeCommandTypeId}` : 'None')}</span>
              </div>
              <input
                placeholder="Route"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
                style={{ minWidth: 240 }}
              />
            </div>
            <div className="container" style={{ gap: 8, justifyContent: "flex-end" }}>
              <Button variant="secondary" leftIcon={<X size={16} />} onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              {editItem ? (
                <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => update(editItem)} disabled={loading || !name || !nodeCommandTypeId}>Save</Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={create} disabled={loading || !name || !nodeCommandTypeId}>Create</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
