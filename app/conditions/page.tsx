"use client";
import { useEffect, useState } from "react";
import { fetchJson, toDeepQuery } from "../../lib/api";
import { UntitledTable } from "../../components/ui/UntitledTable";
import { Button } from "../../components/ui/Button";
import { LookupModal } from "../../components/ui/LookupModal";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface ConditionItem {
  id: number;
  name: string;
  conditionTypeId: number;
  conditionSource?: string;
  conditionText?: string;
  conditionType?: { id: number; name: string };
}

export default function ConditionsPage() {
  const [items, setItems] = useState<ConditionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [orderBy, setOrderBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [name, setName] = useState("");
  const [conditionTypeId, setConditionTypeId] = useState<number | "">("");
  const [conditionTypeName, setConditionTypeName] = useState("");
  const [conditionSource, setConditionSource] = useState<string>("");
  const [conditionText, setConditionText] = useState<string>("");

  const [showTypeLookup, setShowTypeLookup] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<ConditionItem | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: pageSize, offset: page * pageSize, orderBy, sortOrder });
      const res = await fetchJson<{ result: ConditionItem[]; total: number }>(`/api/bpmn/conditions${q}`);
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
      await fetchJson(`/api/bpmn/conditions/`, {
        method: "POST",
        body: {
          name,
          conditionTypeId: conditionTypeId === "" ? undefined : Number(conditionTypeId),
          conditionSource: conditionSource || undefined,
          conditionText: conditionText || undefined,
        },
      });
      setShowCreate(false);
      setName("");
      setConditionTypeId("");
      setConditionTypeName("");
      setConditionSource("");
      setConditionText("");
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
      await fetchJson(`/api/bpmn/conditions/${id}`, {
        method: "PUT",
        body: {
          name,
          conditionTypeId: conditionTypeId === "" ? undefined : Number(conditionTypeId),
          conditionSource: conditionSource || undefined,
          conditionText: conditionText || undefined,
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
    if (!confirm("Delete this condition?")) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/conditions/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, orderBy, sortOrder]);

  return (
    <div>
      <h1>Conditions</h1>
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12 }}>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Create condition</Button>
      </div>

      <LookupModal
        title="Select Condition Type"
        fetchUrl="/api/bpmn/condition-types/lookup"
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'name', header: 'Name' },
        ]}
        isOpen={showTypeLookup}
        onClose={() => setShowTypeLookup(false)}
        onSelect={(row: any) => { setConditionTypeId(row.id); setConditionTypeName(row.name); }}
      />

      <UntitledTable
        columns={[
          { key: 'id', header: 'ID', width: 80, sortable: true },
          { key: 'name', header: 'Name', sortable: true },
          { key: 'conditionType', header: 'Type', render: (r: any) => r.conditionType?.name ?? r.conditionTypeId },
          { key: 'conditionSource', header: 'Source' },
          { key: 'conditionText', header: 'Text' },
          {
            key: '__actions__',
            header: '',
            align: 'right',
            render: (p: any) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  aria-label="Edit"
                  title="Edit"
                  iconOnly
                  variant="secondary"
                  onClick={() => {
                    setEditItem(p);
                    setName(p.name);
                    setConditionTypeId(p.conditionTypeId);
                    setConditionTypeName(p.conditionType?.name ?? '');
                    setConditionSource(p.conditionSource ?? '');
                    setConditionText(p.conditionText ?? '');
                  }}
                >
                  <Pencil size={16} />
                </Button>
                <Button aria-label="Delete" title="Delete" iconOnly variant="danger" onClick={() => remove(p.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
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

      {(showCreate || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[min(900px,96vw)] p-4 space-y-3">
            <h3 className="text-lg font-semibold">{editItem ? `Edit Condition #${editItem.id}` : 'Create Condition'}</h3>
            <div className="container" style={{ gap: 8, flexWrap: 'wrap' as const }}>
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
              />
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowTypeLookup(true)}>Pick Condition Type</Button>
                <span className="text-sm text-gray-600">{conditionTypeName || (conditionTypeId ? `ID: ${conditionTypeId}` : 'None')}</span>
              </div>
              <input
                placeholder="Condition Source"
                value={conditionSource}
                onChange={(e) => setConditionSource(e.target.value)}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
                style={{ width: 320 }}
              />
              <input
                placeholder="Condition Text"
                value={conditionText}
                onChange={(e) => setConditionText(e.target.value)}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
                style={{ width: 320 }}
              />
            </div>
            <div className="container" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" leftIcon={<X size={16} />} onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              {editItem ? (
                <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => update(editItem.id)} disabled={loading || !name || !conditionTypeId}>Save</Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={create} disabled={loading || !name || !conditionTypeId}>Create</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
