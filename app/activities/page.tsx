"use client";
import { useEffect, useState } from 'react';
import { fetchJson, toDeepQuery } from '../../lib/api';
import { LookupModal } from '../../components/ui/LookupModal';

interface ActivityItem {
  id: number;
  name: string;
  isStartActivity: boolean;
  isEndActivity: boolean;
  activityTypeId: number;
  processId: number;
  haveMultipleItems: boolean;
  insideProcessRunnerId?: number;
  process?: { id: number; name: string };
  activityType?: { id: number; name: string };
}

export default function ActivitiesPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [isStart, setIsStart] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const [activityTypeId, setActivityTypeId] = useState<number | ''>('');
  const [activityTypeName, setActivityTypeName] = useState<string>('');
  const [processId, setProcessId] = useState<number | ''>('');
  const [processName, setProcessName] = useState<string>('');
  const [haveMultipleItems, setHaveMultipleItems] = useState(false);
  const [insideProcessRunnerId, setInsideProcessRunnerId] = useState<number | ''>('');

  const [showProcessLookup, setShowProcessLookup] = useState(false);
  const [showActivityTypeLookup, setShowActivityTypeLookup] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: 25, offset: 0, orderBy: 'id', sortOrder: 'DESC' });
      const res = await fetchJson<{ result: ActivityItem[]; total: number }>(`/api/bpmn/activities${q}`);
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
      await fetchJson(`/api/bpmn/activities/`, {
        method: 'POST',
        body: {
          name,
          isStartActivity: isStart,
          isEndActivity: isEnd,
          activityTypeId: activityTypeId === '' ? undefined : Number(activityTypeId),
          processId: processId === '' ? undefined : Number(processId),
          haveMultipleItems,
          insideProcessRunnerId: insideProcessRunnerId === '' ? undefined : Number(insideProcessRunnerId),
        },
      });
      setName('');
      setIsStart(false);
      setIsEnd(false);
      setActivityTypeId('');
      setActivityTypeName('');
      setProcessId('');
      setProcessName('');
      setHaveMultipleItems(false);
      setInsideProcessRunnerId('');
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
      <h1>Activities</h1>
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12, flexWrap: 'wrap' as const, gap: 8 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="container" style={{ gap: 6 }}>
          <button className="btn" onClick={() => setShowActivityTypeLookup(true)}>Pick Activity Type</button>
          <span className="text-sm text-gray-600">{activityTypeName || (activityTypeId ? `ID: ${activityTypeId}` : 'None')}</span>
        </div>
        <div className="container" style={{ gap: 6 }}>
          <button className="btn" onClick={() => setShowProcessLookup(true)}>Pick Process</button>
          <span className="text-sm text-gray-600">{processName || (processId ? `ID: ${processId}` : 'None')}</span>
        </div>
        <label className="container" style={{ gap: 6 }}>
          <input type="checkbox" checked={isStart} onChange={(e) => setIsStart(e.target.checked)} />
          <span>Start</span>
        </label>
        <label className="container" style={{ gap: 6 }}>
          <input type="checkbox" checked={isEnd} onChange={(e) => setIsEnd(e.target.checked)} />
          <span>End</span>
        </label>
        <label className="container" style={{ gap: 6 }}>
          <input
            type="checkbox"
            checked={haveMultipleItems}
            onChange={(e) => setHaveMultipleItems(e.target.checked)}
          />
          <span>Multiple Items</span>
        </label>
        <input
          placeholder="Inside Process Runner ID"
          type="number"
          value={insideProcessRunnerId}
          onChange={(e) =>
            setInsideProcessRunnerId(e.target.value === '' ? '' : Number(e.target.value))
          }
          style={{ width: 210 }}
        />
        <button onClick={create} disabled={loading || !name || !processId || !activityTypeId}>
          Create
        </button>
      </div>

      <LookupModal
        title="Select Process"
        fetchUrl="/api/bpmn/processes/lookup"
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'name', header: 'Name' },
        ]}
        isOpen={showProcessLookup}
        onClose={() => setShowProcessLookup(false)}
        onSelect={(row: any) => {
          setProcessId(row.id);
          setProcessName(row.name);
        }}
      />
      <LookupModal
        title="Select Activity Type"
        fetchUrl="/api/bpmn/activity-types/lookup"
        columns={[
          { key: 'id', header: 'ID', width: 80 },
          { key: 'name', header: 'Name' },
        ]}
        isOpen={showActivityTypeLookup}
        onClose={() => setShowActivityTypeLookup(false)}
        onSelect={(row: any) => {
          setActivityTypeId(row.id);
          setActivityTypeName(row.name);
        }}
      />

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Process</th>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Multiple</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.process?.name ?? p.processId}</td>
              <td>{p.activityType?.name ?? p.activityTypeId}</td>
              <td>{p.isStartActivity ? 'Yes' : 'No'}</td>
              <td>{p.isEndActivity ? 'Yes' : 'No'}</td>
              <td>{p.haveMultipleItems ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>Total: {total}</div>
    </div>
  );
}
