"use client";
import { useEffect, useState } from 'react';
import { fetchJson, toDeepQuery } from '../../lib/api';
import { UntitledTable } from '../../components/ui/UntitledTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Checkbox as UICheckbox } from '../../components/base/checkbox/checkbox';
import { Plus, Pencil, Trash2, Check, X, List, GitBranch } from 'lucide-react';
import { ActivitiesPanel } from '../../components/features/ActivitiesPanel';
import { ProcessGraph } from '../../components/features/ProcessGraph';

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

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [name, setName] = useState('');
  const [isSubProcess, setIsSubProcess] = useState(false);
  const [staticId, setStaticId] = useState<number | ''>('');

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<ProcessItem | null>(null);
  const [activitiesProcess, setActivitiesProcess] = useState<ProcessItem | null>(null);
  const [graphProcess, setGraphProcess] = useState<ProcessItem | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery({ limit: pageSize, offset: page * pageSize, orderBy, sortOrder });
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
      setShowCreate(false);
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

  async function update(id: number) {
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/processes/${id}`, {
        method: 'PUT',
        body: { name, isSubProcess, staticId: staticId === '' ? undefined : Number(staticId) },
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
    if (!confirm('Delete this process?')) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/processes/${id}`, { method: 'DELETE' });
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
      <h1>Processes</h1>
      {error && <div className="alert">{error}</div>}
      <div className="container" style={{ marginBottom: 12 }}>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Create process</Button>
      </div>

      <UntitledTable
        columns={[
          { key: 'id', header: 'ID', width: 80, sortable: true },
          { key: 'name', header: 'Name', sortable: true },
          { key: 'isSubProcess', header: 'Sub?', render: (r: any) => (r.isSubProcess ? 'Yes' : 'No') },
          { key: 'staticId', header: 'StaticId' },
          {
            key: '__actions__',
            header: '',
            align: 'right',
            render: (p: any) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<List size={16} />}
                  onClick={() => setActivitiesProcess(p)}
                >
                  Activities
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<GitBranch size={16} />}
                  onClick={() => setGraphProcess(p)}
                >
                  Graph
                </Button>
                <Button
                  aria-label="Edit"
                  title="Edit"
                  iconOnly
                  variant="secondary"
                  onClick={() => {
                    setEditItem(p);
                    setName(p.name);
                    setIsSubProcess(!!p.isSubProcess);
                    setStaticId(p.staticId ?? '');
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
        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
      />

      {activitiesProcess && (
        <Modal
          isOpen={!!activitiesProcess}
          onClose={() => setActivitiesProcess(null)}
          title={`Activities for ${activitiesProcess.name} (#${activitiesProcess.id})`}
          size="lg"
          zIndexClass="z-[60]"
        >
          <ActivitiesPanel fixedProcessId={activitiesProcess.id} modalZIndex={60} />
        </Modal>
      )}

      {graphProcess && (
        <Modal
          isOpen={!!graphProcess}
          onClose={() => setGraphProcess(null)}
          title={`Graph for ${graphProcess.name} (#${graphProcess.id})`}
          size="xl"
        >
          <ProcessGraph processId={graphProcess.id} />
        </Modal>
      )}

      {(showCreate || editItem) && (
        <Modal
          isOpen={showCreate || !!editItem}
          onClose={() => { setShowCreate(false); setEditItem(null); }}
          title={editItem ? `Edit Process #${editItem.id}` : 'Create Process'}
          size="md"
          footer={
            <>
              <Button variant="secondary" leftIcon={<X size={16} />} onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              {editItem ? (
                <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => update(editItem.id)} disabled={loading || !name}>Save</Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={create} disabled={loading || !name}>Create</Button>
              )}
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Name" placeholder="Name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} fullWidth />
            <Input label="Static ID" placeholder="Static ID" type="number" value={staticId}
              onChange={(e) => setStaticId((e.target as HTMLInputElement).value === '' ? '' : Number((e.target as HTMLInputElement).value))}
            />
            <div className="col-span-1 sm:col-span-2">
              <UICheckbox isSelected={isSubProcess} onChange={setIsSubProcess} label="Is Sub-Process" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
