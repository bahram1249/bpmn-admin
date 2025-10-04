"use client";
import { useEffect, useState } from 'react';
import { fetchJson, toDeepQuery } from '../../lib/api';
import { LookupModal } from '../ui/LookupModal';
import { UntitledTable } from '../ui/UntitledTable';
import { Button } from '../ui/Button';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export interface RequestItem {
  id: number;
  userId: number;
  processId: number;
  organizationId?: number;
  user?: { id: number; username: string; firstname?: string; lastname?: string };
  process?: { id: number; name: string };
  organization?: { id: number; name: string };
}

export type RequestsPanelProps = {
  variant?: 'page' | 'modal';
  showToolbar?: boolean;
  className?: string;
  modalZIndex?: number;
};

export function RequestsPanel({ variant = 'page', showToolbar = true, className = '', modalZIndex = 50 }: RequestsPanelProps) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [userId, setUserId] = useState<number | ''>('');
  const [userName, setUserName] = useState('');
  const [processId, setProcessId] = useState<number | ''>('');
  const [processName, setProcessName] = useState('');
  const [organizationId, setOrganizationId] = useState<number | ''>('');
  const [organizationName, setOrganizationName] = useState('');
  const [description, setDescription] = useState('');

  const [showUserLookup, setShowUserLookup] = useState(false);
  const [showProcessLookup, setShowProcessLookup] = useState(false);
  const [showOrganizationLookup, setShowOrganizationLookup] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<RequestItem | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: pageSize, offset: page * pageSize, orderBy, sortOrder });
      const res = await fetchJson<{ result: RequestItem[]; total: number }>(`/api/bpmn/requests${q}`);
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
      await fetchJson(`/api/bpmn/requests/`, {
        method: 'POST',
        body: {
          userId: userId === '' ? undefined : Number(userId),
          processId: processId === '' ? undefined : Number(processId),
          organizationId: organizationId === '' ? undefined : Number(organizationId),
          description: description || undefined,
        },
      });
      setShowCreate(false);
      setUserId('');
      setUserName('');
      setProcessId('');
      setProcessName('');
      setOrganizationId('');
      setOrganizationName('');
      setDescription('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function update(id: number, payload: Partial<RequestItem>) {
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/requests/${id}`, { method: 'PUT', body: payload });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this request?')) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/requests/${id}`, { method: 'DELETE' });
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

  const toolbarStyle = { marginBottom: variant === 'modal' ? 8 : 12 } as const;

  return (
    <div className={'space-y-3 ' + (className || '')}>
      {error && <div className="alert">{error}</div>}
      {showToolbar && (
        <div className="container" style={toolbarStyle}>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Create request</Button>
        </div>
      )}

      <LookupModal
        title="Select User"
        fetchUrl="/api/core/admin/users"
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'username', header: 'Username' },
          { key: 'firstname', header: 'First' },
          { key: 'lastname', header: 'Last' },
        ]}
        isOpen={showUserLookup}
        onClose={() => setShowUserLookup(false)}
        onSelect={(row: any) => {
          setUserId(row.id);
          setUserName(row.username ?? `${row.firstname ?? ''} ${row.lastname ?? ''}`.trim());
        }}
      />
      <LookupModal
        title="Select Process"
        fetchUrl="/api/bpmn/processes/lookup"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'name', header: 'Name' }]}
        isOpen={showProcessLookup}
        onClose={() => setShowProcessLookup(false)}
        onSelect={(row: any) => { setProcessId(row.id); setProcessName(row.name); }}
      />
      <LookupModal
        title="Select Organization"
        fetchUrl="/api/bpmn/organizations/lookup"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'name', header: 'Name' }]}
        isOpen={showOrganizationLookup}
        onClose={() => setShowOrganizationLookup(false)}
        onSelect={(row: any) => { setOrganizationId(row.id); setOrganizationName(row.name); }}
      />

      <UntitledTable
        columns={[
          { key: 'id', header: 'ID', width: 80, sortable: true },
          { key: 'user', header: 'User', render: (r: any) => ((r.user?.username ?? `${r.user?.firstname ?? ''} ${r.user?.lastname ?? ''}`.trim()) || (r.userId ?? '')) },
          { key: 'process', header: 'Process', render: (r: any) => r.process?.name ?? r.processId },
          { key: 'organization', header: 'Organization', render: (r: any) => r.organization?.name ?? r.organizationId ?? '' },
          {
            key: '__actions__',
            header: '',
            align: 'right',
            render: (p: any) => (
              <div className="flex items-center justify-end gap-2">
                <Button aria-label="Edit" title="Edit" iconOnly variant="secondary" onClick={() => {
                  setEditItem(p);
                  setUserId(p.userId);
                  setUserName(p.user?.username ?? '');
                  setProcessId(p.processId);
                  setProcessName(p.process?.name ?? '');
                  setOrganizationId(p.organizationId ?? '');
                  setOrganizationName(p.organization?.name ?? '');
                  setDescription('');
                }}>
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
        onPageSizeChange={variant === 'page' ? ((s) => { setPageSize(s); setPage(0); }) : undefined}
      />

      {(showCreate || editItem) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: modalZIndex }}>
          <div className="bg-white rounded-lg shadow-xl w-[min(900px,96vw)] p-4 space-y-3">
            <h3 className="text-lg font-semibold">{editItem ? `Edit Request #${editItem.id}` : 'Create Request'}</h3>
            <div className="container" style={{ gap: 8, flexWrap: 'wrap' as const }}>
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowUserLookup(true)}>Pick User</Button>
                <span className="text-sm text-gray-600">{userName || (userId ? `ID: ${userId}` : 'None')}</span>
              </div>
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowProcessLookup(true)}>Pick Process</Button>
                <span className="text-sm text-gray-600">{processName || (processId ? `ID: ${processId}` : 'None')}</span>
              </div>
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowOrganizationLookup(true)}>Pick Organization</Button>
                <span className="text-sm text-gray-600">{organizationName || (organizationId ? `ID: ${organizationId}` : 'None')}</span>
              </div>
              <input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
                style={{ width: 300 }}
              />
            </div>
            <div className="container" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" leftIcon={<X size={16} />} onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              {editItem ? (
                <Button
                  variant="primary"
                  leftIcon={<Check size={16} />}
                  onClick={() => update(editItem.id, {
                    userId: userId === '' ? undefined : Number(userId),
                    processId: processId === '' ? undefined : Number(processId),
                    organizationId: organizationId === '' ? undefined : Number(organizationId),
                  })}
                  disabled={loading || !userId || !processId}
                >
                  Save
                </Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={create} disabled={loading || !userId || !processId}>Create</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
