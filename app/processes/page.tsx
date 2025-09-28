"use client";
import { useEffect, useState } from 'react';
import { fetchJson, toDeepQuery } from '../../lib/api';

interface ProcessItem {
  id: number;
  name: string;
  isSubProcess?: boolean;
  staticId?: number;
}

export default function ProcessesPage() {
  const [items, setItems] = useState<ProcessItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [isSubProcess, setIsSubProcess] = useState(false);
  const [staticId, setStaticId] = useState<number | ''>('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: 25, offset: 0, orderBy: 'id', sortOrder: 'DESC' });
      const res = await fetchJson<{ result: ProcessItem[]; total: number }>(`/api/bpmn/processes${q}`);
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
      await fetchJson(`/api/bpmn/processes/`, {
        method: 'POST',
        body: { name, isSubProcess, staticId: staticId === '' ? undefined : Number(staticId) },
      });
      setName('');
      setIsSubProcess(false);
      setStaticId('');
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
      <h1>Processes</h1>
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="container" style={{ gap: 6 }}>
          <input type="checkbox" checked={isSubProcess} onChange={(e) => setIsSubProcess(e.target.checked)} />
          <span>Is Sub-Process</span>
        </label>
        <input
          placeholder="Static ID"
          type="number"
          value={staticId}
          onChange={(e) => setStaticId(e.target.value === '' ? '' : Number(e.target.value))}
          style={{ width: 120 }}
        />
        <button onClick={create} disabled={loading || !name}>
          Create
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Sub?</th>
            <th>StaticId</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.isSubProcess ? 'Yes' : 'No'}</td>
              <td>{p.staticId ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>Total: {total}</div>
    </div>
  );
}
