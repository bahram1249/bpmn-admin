"use client";
import { useEffect, useState } from 'react';
import { fetchJson, toDeepQuery } from '../../lib/api';
import { LookupModal } from '../../components/ui/LookupModal';
import { UntitledTable } from '../../components/ui/UntitledTable';
import { Button } from '../../components/ui/Button';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { NodeConditionsPanel } from '../../components/features/NodeConditionsPanel';
import { NodeCommandsPanel } from '../../components/features/NodeCommandsPanel';

interface NodeItem {
  id: number;
  fromActivityId: number;
  toActivityId: number;
  autoIterate: boolean;
  referralTypeId: number;
  conditionFailedActionRunnerId?: number;
  roleId?: number;
  userId?: number;
  injectForm?: string;
  name?: string;
  description?: string;
  eventCall?: boolean;
  fromActivity?: { id: number; name: string };
  toActivity?: { id: number; name: string };
  referralType?: { id: number; name: string };
  role?: { id: number; roleName: string };
  user?: { id: number; username: string; firstname?: string; lastname?: string };
}

export default function NodesPage() {
  const [items, setItems] = useState<NodeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState<'id' | 'name'>('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [fromActivityId, setFromActivityId] = useState<number | ''>('');
  const [fromActivityName, setFromActivityName] = useState('');
  const [toActivityId, setToActivityId] = useState<number | ''>('');
  const [toActivityName, setToActivityName] = useState('');
  const [referralTypeId, setReferralTypeId] = useState<number | ''>('');
  const [referralTypeName, setReferralTypeName] = useState('');
  const [autoIterate, setAutoIterate] = useState(false);
  const [name, setName] = useState('');

  const [showFromActivityLookup, setShowFromActivityLookup] = useState(false);
  const [showToActivityLookup, setShowToActivityLookup] = useState(false);
  const [showReferralTypeLookup, setShowReferralTypeLookup] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<NodeItem | null>(null);
  const [conditionsNode, setConditionsNode] = useState<NodeItem | null>(null);
  const [commandsNode, setCommandsNode] = useState<NodeItem | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: pageSize, offset: page * pageSize, orderBy, sortOrder });
      const res = await fetchJson<{ result: NodeItem[]; total: number }>(`/api/bpmn/nodes${q}`);
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
      await fetchJson(`/api/bpmn/nodes/`, {
        method: 'POST',
        body: {
          fromActivityId: fromActivityId === '' ? undefined : Number(fromActivityId),
          toActivityId: toActivityId === '' ? undefined : Number(toActivityId),
          referralTypeId: referralTypeId === '' ? undefined : Number(referralTypeId),
          autoIterate,
          name: name || undefined,
        },
      });
      setShowCreate(false);
      setFromActivityId('');
      setFromActivityName('');
      setToActivityId('');
      setToActivityName('');
      setReferralTypeId('');
      setReferralTypeName('');
      setAutoIterate(false);
      setName('');
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
      await fetchJson(`/api/bpmn/nodes/${id}`, {
        method: 'PUT',
        body: {
          fromActivityId: fromActivityId === '' ? undefined : Number(fromActivityId),
          toActivityId: toActivityId === '' ? undefined : Number(toActivityId),
          referralTypeId: referralTypeId === '' ? undefined : Number(referralTypeId),
          autoIterate,
          name: name || undefined,
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
    if (!confirm('Delete this node?')) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/nodes/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, orderBy, sortOrder, pageSize]);

  return (
    <div>
      <h1>Nodes</h1>
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12 }}>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Create node</Button>
      </div>

      <LookupModal
        title="Select From Activity"
        fetchUrl="/api/bpmn/activities/lookup"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'name', header: 'Name' }]}
        isOpen={showFromActivityLookup}
        onClose={() => setShowFromActivityLookup(false)}
        onSelect={(row: any) => { setFromActivityId(row.id); setFromActivityName(row.name); }}
      />
      <LookupModal
        title="Select To Activity"
        fetchUrl="/api/bpmn/activities/lookup"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'name', header: 'Name' }]}
        isOpen={showToActivityLookup}
        onClose={() => setShowToActivityLookup(false)}
        onSelect={(row: any) => { setToActivityId(row.id); setToActivityName(row.name); }}
      />
      <LookupModal
        title="Select Referral Type"
        fetchUrl="/api/bpmn/referral-types/lookup"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'name', header: 'Name' }]}
        isOpen={showReferralTypeLookup}
        onClose={() => setShowReferralTypeLookup(false)}
        onSelect={(row: any) => { setReferralTypeId(row.id); setReferralTypeName(row.name); }}
      />

      <UntitledTable
        columns={[
          { key: 'id', header: 'ID', width: 80, sortable: true },
          { key: 'fromActivity', header: 'From', render: (r: any) => r.fromActivity?.name ?? r.fromActivityId },
          { key: 'toActivity', header: 'To', render: (r: any) => r.toActivity?.name ?? r.toActivityId },
          { key: 'referralType', header: 'Referral', render: (r: any) => r.referralType?.name ?? r.referralTypeId },
          { key: 'autoIterate', header: 'Auto', render: (r: any) => (r.autoIterate ? 'Yes' : 'No') },
          {
            key: '__actions__',
            header: '',
            align: 'right',
            render: (p: any) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConditionsNode(p)}
                >
                  Conditions
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCommandsNode(p)}
                >
                  Commands
                </Button>
                <Button
                  aria-label="Edit"
                  title="Edit"
                  iconOnly
                  variant="secondary"
                  onClick={() => {
                    setEditItem(p);
                    setFromActivityId(p.fromActivityId);
                    setFromActivityName(p.fromActivity?.name ?? '');
                    setToActivityId(p.toActivityId);
                    setToActivityName(p.toActivity?.name ?? '');
                    setReferralTypeId(p.referralTypeId);
                    setReferralTypeName(p.referralType?.name ?? '');
                    setAutoIterate(p.autoIterate);
                    setName(p.name ?? '');
                  }}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  aria-label="Delete"
                  title="Delete"
                  iconOnly
                  variant="danger"
                  onClick={() => remove(p.id)}
                >
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
        onSortChange={(ob, so) => { setOrderBy(ob as any); setSortOrder(so); setPage(0); }}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
      />

      {conditionsNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[min(1000px,96vw)] max-h-[95vh] p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conditions for Node #{conditionsNode.id}</h3>
              <Button aria-label="Close" iconOnly variant="ghost" onClick={() => setConditionsNode(null)}>
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <NodeConditionsPanel fixedNodeId={conditionsNode.id} modalZIndex={60} />
            </div>
          </div>
        </div>
      )}

      {commandsNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[min(1000px,96vw)] max-h-[95vh] p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Commands for Node #{commandsNode.id}</h3>
              <Button aria-label="Close" iconOnly variant="ghost" onClick={() => setCommandsNode(null)}>
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <NodeCommandsPanel fixedNodeId={commandsNode.id} modalZIndex={60} />
            </div>
          </div>
        </div>
      )}

      {(showCreate || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[min(900px,96vw)] p-4 space-y-3">
            <h3 className="text-lg font-semibold">{editItem ? `Edit Node #${editItem.id}` : 'Create Node'}</h3>
            <div className="container" style={{ gap: 8, flexWrap: 'wrap' as const }}>
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowFromActivityLookup(true)}>Pick From Activity</Button>
                <span className="text-sm text-gray-600">{fromActivityName || (fromActivityId ? `ID: ${fromActivityId}` : 'None')}</span>
              </div>
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowToActivityLookup(true)}>Pick To Activity</Button>
                <span className="text-sm text-gray-600">{toActivityName || (toActivityId ? `ID: ${toActivityId}` : 'None')}</span>
              </div>
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowReferralTypeLookup(true)}>Pick Referral Type</Button>
                <span className="text-sm text-gray-600">{referralTypeName || (referralTypeId ? `ID: ${referralTypeId}` : 'None')}</span>
              </div>
              <label className="container" style={{ gap: 6 }}>
                <input type="checkbox" checked={autoIterate} onChange={(e) => setAutoIterate(e.target.checked)} />
                <span>Auto Iterate</span>
              </label>
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
              />
            </div>
            <div className="container" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" leftIcon={<X size={16} />} onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              {editItem ? (
                <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => update(editItem.id)} disabled={loading || !fromActivityId || !toActivityId || !referralTypeId}>Save</Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={create} disabled={loading || !fromActivityId || !toActivityId || !referralTypeId}>Create</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
