"use client";
import { useEffect, useState } from 'react';
import { fetchJson, toDeepQuery } from '../../lib/api';
import { LookupModal } from '../../components/ui/LookupModal';

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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: 25, offset: 0, orderBy: 'id', sortOrder: 'DESC' });
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

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Nodes</h1>
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12, flexWrap: 'wrap' as const, gap: 8 }}>
        <div className="container" style={{ gap: 6 }}>
          <button className="btn" onClick={() => setShowFromActivityLookup(true)}>Pick From Activity</button>
          <span className="text-sm text-gray-600">{fromActivityName || (fromActivityId ? `ID: ${fromActivityId}` : 'None')}</span>
        </div>
        <div className="container" style={{ gap: 6 }}>
          <button className="btn" onClick={() => setShowToActivityLookup(true)}>Pick To Activity</button>
          <span className="text-sm text-gray-600">{toActivityName || (toActivityId ? `ID: ${toActivityId}` : 'None')}</span>
        </div>
        <div className="container" style={{ gap: 6 }}>
          <button className="btn" onClick={() => setShowReferralTypeLookup(true)}>Pick Referral Type</button>
          <span className="text-sm text-gray-600">{referralTypeName || (referralTypeId ? `ID: ${referralTypeId}` : 'None')}</span>
        </div>
        <label className="container" style={{ gap: 6 }}>
          <input type="checkbox" checked={autoIterate} onChange={(e) => setAutoIterate(e.target.checked)} />
          <span>Auto Iterate</span>
        </label>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={create} disabled={loading || !fromActivityId || !toActivityId || !referralTypeId}>
          Create
        </button>
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

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>From</th>
            <th>To</th>
            <th>Referral</th>
            <th>Auto</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.fromActivity?.name ?? p.fromActivityId}</td>
              <td>{p.toActivity?.name ?? p.toActivityId}</td>
              <td>{p.referralType?.name ?? p.referralTypeId}</td>
              <td>{p.autoIterate ? 'Yes' : 'No'}</td>
              <td>{p.name ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>Total: {total}</div>
    </div>
  );
}
