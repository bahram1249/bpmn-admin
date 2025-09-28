"use client";
import { useEffect, useState } from 'react';
import { fetchJson, toDeepQuery } from '../../lib/api';
import { LookupModal } from '../../components/ui/LookupModal';

interface RequestStateItem {
  id: number;
  requestId: number;
  activityId: number;
  userId?: number;
  roleId?: number;
  organizationId?: number;
  returnRequestStateId?: number;
  request?: { id: number; user?: { username?: string; firstname?: string; lastname?: string }; process?: { name: string } };
  activity?: { id: number; name: string };
  user?: { id: number; username?: string; firstname?: string; lastname?: string };
  role?: { id: number; roleName: string };
  organization?: { id: number; name: string };
}

export default function RequestStatesPage() {
  const [items, setItems] = useState<RequestStateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requestId, setRequestId] = useState<number | ''>('');
  const [requestLabel, setRequestLabel] = useState('');
  const [activityId, setActivityId] = useState<number | ''>('');
  const [activityName, setActivityName] = useState('');
  const [userId, setUserId] = useState<number | ''>('');
  const [userName, setUserName] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [roleName, setRoleName] = useState('');
  const [organizationId, setOrganizationId] = useState<number | ''>('');
  const [organizationName, setOrganizationName] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<RequestStateItem | null>(null);
  const [showReqLookup, setShowReqLookup] = useState(false);
  const [showActLookup, setShowActLookup] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [showRoleLookup, setShowRoleLookup] = useState(false);
  const [showOrgLookup, setShowOrgLookup] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: 25, offset: 0, orderBy: 'id', sortOrder: 'DESC' });
      const res = await fetchJson<{ result: RequestStateItem[]; total: number }>(
        `/api/bpmn/request-states${q}`,
      );
      setItems(res.result);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }

  async function create() {
    if (requestId === '' || activityId === '') return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/request-states/`, {
        method: 'POST',
        body: {
          requestId: Number(requestId),
          activityId: Number(activityId),
          userId: userId === '' ? undefined : Number(userId),
          roleId: roleId === '' ? undefined : Number(roleId),
          organizationId: organizationId === '' ? undefined : Number(organizationId),
        },
      });
      setShowCreate(false);
      setRequestId(''); setRequestLabel('');
      setActivityId(''); setActivityName('');
      setUserId(''); setUserName('');
      setRoleId(''); setRoleName('');
      setOrganizationId(''); setOrganizationName('');
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
      await fetchJson(`/api/bpmn/request-states/${id}`, {
        method: 'PUT',
        body: {
          requestId: requestId === '' ? undefined : Number(requestId),
          activityId: activityId === '' ? undefined : Number(activityId),
          userId: userId === '' ? undefined : Number(userId),
          roleId: roleId === '' ? undefined : Number(roleId),
          organizationId: organizationId === '' ? undefined : Number(organizationId),
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
    if (!confirm('Delete this request state?')) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/request-states/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Request States</h1>
      {error && <div className="alert">{error}</div>}

      <div className="container" style={{ gap: 8, marginBottom: 12 }}>
        <button className="btn" onClick={() => setShowCreate(true)}>+ Create</button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Request</th>
            <th>Activity</th>
            <th>User</th>
            <th>Role</th>
            <th>Org</th>
            <th>ReturnOf</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.request ? `${p.request.id} / ${p.request.process?.name ?? ''}` : p.requestId}</td>
              <td>{p.activity?.name ?? p.activityId}</td>
              <td>{p.user?.username ?? `${(p.user as any)?.firstname ?? ''} ${(p.user as any)?.lastname ?? ''}`.trim() || p.userId ?? ''}</td>
              <td>{p.role?.roleName ?? p.roleId ?? ''}</td>
              <td>{p.organization?.name ?? p.organizationId ?? ''}</td>
              <td>{p.returnRequestStateId ?? ''}</td>
              <td>
                <div className="container" style={{ gap: 6 }}>
                  <button onClick={() => {
                    setEditItem(p);
                    setRequestId(p.requestId); setRequestLabel(p.request ? `${p.request.id} / ${p.request.process?.name ?? ''}` : '');
                    setActivityId(p.activityId); setActivityName(p.activity?.name ?? '');
                    setUserId(p.userId ?? ''); setUserName(p.user?.username ?? '');
                    setRoleId(p.roleId ?? ''); setRoleName(p.role?.roleName ?? '');
                    setOrganizationId(p.organizationId ?? ''); setOrganizationName(p.organization?.name ?? '');
                  }}>Edit</button>
                  <button onClick={() => remove(p.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>Total: {total}</div>

      {(showCreate || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[min(900px,96vw)] p-4 space-y-3">
            <h3 className="text-lg font-semibold">{editItem ? `Edit Request State #${editItem.id}` : 'Create Request State'}</h3>
            <div className="container" style={{ gap: 8, flexWrap: 'wrap' as const }}>
              <div className="container" style={{ gap: 6 }}>
                <button className="btn" onClick={() => setShowReqLookup(true)}>Pick Request</button>
                <span className="text-sm text-gray-600">{requestLabel || (requestId ? `ID: ${requestId}` : 'None')}</span>
              </div>
              <div className="container" style={{ gap: 6 }}>
                <button className="btn" onClick={() => setShowActLookup(true)}>Pick Activity</button>
                <span className="text-sm text-gray-600">{activityName || (activityId ? `ID: ${activityId}` : 'None')}</span>
              </div>
              <div className="container" style={{ gap: 6 }}>
                <button className="btn" onClick={() => setShowUserLookup(true)}>Pick User</button>
                <span className="text-sm text-gray-600">{userName || (userId ? `ID: ${userId}` : 'None')}</span>
              </div>
              <div className="container" style={{ gap: 6 }}>
                <button className="btn" onClick={() => setShowRoleLookup(true)}>Pick Role</button>
                <span className="text-sm text-gray-600">{roleName || (roleId ? `ID: ${roleId}` : 'None')}</span>
              </div>
              <div className="container" style={{ gap: 6 }}>
                <button className="btn" onClick={() => setShowOrgLookup(true)}>Pick Organization</button>
                <span className="text-sm text-gray-600">{organizationName || (organizationId ? `ID: ${organizationId}` : 'None')}</span>
              </div>
            </div>
            <div className="container" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</button>
              {editItem ? (
                <button className="btn" onClick={() => update(editItem.id)} disabled={loading}>Save</button>
              ) : (
                <button className="btn" onClick={create} disabled={loading || !requestId || !activityId}>Create</button>
              )}
            </div>
          </div>
        </div>
      )}

      <LookupModal
        title="Select Request"
        fetchUrl="/api/bpmn/requests/lookup"
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'name', header: 'Process', render: (r: any) => r.process?.name ?? '' },
          { key: 'username', header: 'User', render: (r: any) => r.user?.username ?? `${r.user?.firstname ?? ''} ${r.user?.lastname ?? ''}`.trim() },
        ]}
        isOpen={showReqLookup}
        onClose={() => setShowReqLookup(false)}
        onSelect={(row: any) => { setRequestId(row.id); setRequestLabel(`${row.id} / ${row.process?.name ?? ''}`); }}
      />
      <LookupModal
        title="Select Activity"
        fetchUrl="/api/bpmn/activities/lookup"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'name', header: 'Name' }]}
        isOpen={showActLookup}
        onClose={() => setShowActLookup(false)}
        onSelect={(row: any) => { setActivityId(row.id); setActivityName(row.name); }}
      />
      <LookupModal
        title="Select User"
        fetchUrl="/api/core/admin/users"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'username', header: 'Username' }]}
        isOpen={showUserLookup}
        onClose={() => setShowUserLookup(false)}
        onSelect={(row: any) => { setUserId(row.id); setUserName(row.username); }}
      />
      <LookupModal
        title="Select Role"
        fetchUrl="/api/core/admin/roles"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'roleName', header: 'Role' }]}
        isOpen={showRoleLookup}
        onClose={() => setShowRoleLookup(false)}
        onSelect={(row: any) => { setRoleId(row.id); setRoleName(row.roleName); }}
      />
      <LookupModal
        title="Select Organization"
        fetchUrl="/api/bpmn/organizations/lookup"
        columns={[{ key: 'id', header: 'ID', width: 80 }, { key: 'name', header: 'Name' }]}
        isOpen={showOrgLookup}
        onClose={() => setShowOrgLookup(false)}
        onSelect={(row: any) => { setOrganizationId(row.id); setOrganizationName(row.name); }}
      />
    </div>
  );
}
