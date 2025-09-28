"use client";
import { useEffect, useState } from 'react';
import { fetchJson, toDeepQuery } from '../../lib/api';
import { LookupModal } from '../../components/ui/LookupModal';

interface RequestItem {
  id: number;
  userId: number;
  processId: number;
  organizationId?: number;
  user?: { id: number; username: string; firstname?: string; lastname?: string };
  process?: { id: number; name: string };
  organization?: { id: number; name: string };
}

export default function RequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: 25, offset: 0, orderBy: 'id', sortOrder: 'DESC' });
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
  }, []);

  return (
    <div>
      <h1>Requests</h1>
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12, flexWrap: 'wrap' as const, gap: 8 }}>
        <div className="container" style={{ gap: 6 }}>
          <button className="btn" onClick={() => setShowUserLookup(true)}>Pick User</button>
          <span className="text-sm text-gray-600">{userName || (userId ? `ID: ${userId}` : 'None')}</span>
        </div>
        <div className="container" style={{ gap: 6 }}>
          <button className="btn" onClick={() => setShowProcessLookup(true)}>Pick Process</button>
          <span className="text-sm text-gray-600">{processName || (processId ? `ID: ${processId}` : 'None')}</span>
        </div>
        <div className="container" style={{ gap: 6 }}>
          <button className="btn" onClick={() => setShowOrganizationLookup(true)}>Pick Organization</button>
          <span className="text-sm text-gray-600">{organizationName || (organizationId ? `ID: ${organizationId}` : 'None')}</span>
        </div>
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: 260 }}
        />
        <button onClick={create} disabled={loading || !userId || !processId}>
          Create
        </button>
      </div>

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

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Process</th>
            <th>Organization</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.user?.username ?? `${(p.user as any)?.firstname ?? ''} ${(p.user as any)?.lastname ?? ''}`.trim() || p.userId}</td>
              <td>{p.process?.name ?? p.processId}</td>
              <td>{p.organization?.name ?? p.organizationId ?? ''}</td>
              <td>
                <div className="container" style={{ gap: 6 }}>
                  <button
                    onClick={() => update(p.id, { userId: userId === '' ? p.userId : Number(userId), processId: processId === '' ? p.processId : Number(processId), organizationId: organizationId === '' ? p.organizationId : Number(organizationId) })}
                    disabled={loading}
                  >Save</button>
                  <button onClick={() => remove(p.id)} disabled={loading}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>Total: {total}</div>
    </div>
  );
}
