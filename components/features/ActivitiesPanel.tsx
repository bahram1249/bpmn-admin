"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchJson, toDeepQuery } from "../../lib/api";
import { LookupModal } from "../ui/LookupModal";
import { UntitledTable } from "../ui/UntitledTable";
import { Button } from "../ui/Button";
import { BadgeWithIcon } from "../base/badges/badges";
import { Plus, Pencil, Trash2, Check, X, List, Square, Zap, GitBranch, Monitor, Play } from "lucide-react";
import { NodesPanel } from "./NodesPanel";
import { InboundActionsPanel } from "./InboundActionsPanel";
import { OutboundActionsPanel } from "./OutboundActionsPanel";

export interface ActivityItem {
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

export type ActivitiesPanelProps = {
  fixedProcessId?: number;
  modalZIndex?: number; // z-index for inner create/edit overlay when embedded
  variant?: 'page' | 'modal';
  showToolbar?: boolean; // show the top action bar (e.g., Create)
  className?: string; // append classes to root container
};

export function ActivitiesPanel({ fixedProcessId, modalZIndex = 50, variant = 'page', showToolbar = true, className = '' }: ActivitiesPanelProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [name, setName] = useState("");
  const [isStart, setIsStart] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const [activityTypeId, setActivityTypeId] = useState<number | "">("");
  const [activityTypeName, setActivityTypeName] = useState<string>("");
  const [processId, setProcessId] = useState<number | "">(fixedProcessId ?? "");
  const [processName, setProcessName] = useState<string>("");
  const [haveMultipleItems, setHaveMultipleItems] = useState(false);
  const [insideProcessRunnerId, setInsideProcessRunnerId] = useState<number | "">("");

  const [showProcessLookup, setShowProcessLookup] = useState(false);
  const [showActivityTypeLookup, setShowActivityTypeLookup] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<ActivityItem | null>(null);
  const [nodesActivity, setNodesActivity] = useState<ActivityItem | null>(null);
  const [inboundActivity, setInboundActivity] = useState<ActivityItem | null>(null);
  const [outboundActivity, setOutboundActivity] = useState<ActivityItem | null>(null);

  // Map activity type id/name to badge metadata (label, color, icon)
  const activityTypeMeta = (id?: number, name?: string): { label: string; color: any; Icon: any } => {
    switch (id) {
      case 1:
        return { label: 'SIMPLE_STATE', color: 'blue', Icon: Square };
      case 2:
        return { label: 'EVENT_STATE', color: 'orange', Icon: Zap };
      case 3:
        return { label: 'SUBPROCESS_STATE', color: 'indigo', Icon: GitBranch };
      case 4:
        return { label: 'CLIENT_STATE', color: 'gray-blue', Icon: Monitor };
      default:
        return { label: (name || String(id ?? '')), color: 'gray', Icon: Square };
    }
  };

  // Badge metadata helpers for boolean columns
  const startBadgeMeta = (flag: boolean) => ({ label: flag ? 'Yes' : 'No', color: flag ? 'success' : 'gray', Icon: Play });
  const endBadgeMeta = (flag: boolean) => ({ label: flag ? 'Yes' : 'No', color: flag ? 'error' : 'gray', Icon: Square });
  const multipleBadgeMeta = (flag: boolean) => ({ label: flag ? 'Yes' : 'No', color: flag ? 'blue' : 'gray', Icon: List });

  const queryObj = useMemo(() => ({
    limit: pageSize,
    offset: page * pageSize,
    orderBy,
    sortOrder,
    ...(fixedProcessId ? { processId: fixedProcessId } : {}),
  }), [page, pageSize, orderBy, sortOrder, fixedProcessId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const q = toDeepQuery(queryObj);
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
        method: "POST",
        body: {
          name,
          isStartActivity: isStart,
          isEndActivity: isEnd,
          activityTypeId: activityTypeId === "" ? undefined : Number(activityTypeId),
          processId: fixedProcessId ?? (processId === "" ? undefined : Number(processId)),
          haveMultipleItems,
          insideProcessRunnerId: insideProcessRunnerId === "" ? undefined : Number(insideProcessRunnerId),
        },
      });
      setShowCreate(false);
      setName("");
      setIsStart(false);
      setIsEnd(false);
      setActivityTypeId("");
      setActivityTypeName("");
      setProcessId(fixedProcessId ?? "");
      setProcessName("");
      setHaveMultipleItems(false);
      setInsideProcessRunnerId("");
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
      await fetchJson(`/api/bpmn/activities/${id}`, {
        method: "PUT",
        body: {
          name,
          isStartActivity: isStart,
          isEndActivity: isEnd,
          activityTypeId: activityTypeId === "" ? undefined : Number(activityTypeId),
          processId: fixedProcessId ?? (processId === "" ? undefined : Number(processId)),
          haveMultipleItems,
          insideProcessRunnerId: insideProcessRunnerId === "" ? undefined : Number(insideProcessRunnerId),
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
    if (!confirm("Delete this activity?")) return;
    setLoading(true);
    setError(null);
    try {
      await fetchJson(`/api/bpmn/activities/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, orderBy, sortOrder, pageSize, fixedProcessId]);

  const toolbarStyle = { marginBottom: variant === 'modal' ? 8 : 12 } as const;

  return (
    <div className={"space-y-3 " + (className || '')}>
      {error && <div className="alert">{error}</div>}
      {showToolbar && (
        <div className="container" style={toolbarStyle}>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Create activity</Button>
        </div>
      )}

      {/* Lookups */}
      {!fixedProcessId && (
        <LookupModal
          title="Select Process"
          fetchUrl="/api/bpmn/processes/lookup"
          columns={[
            { key: "id", header: "ID", width: 80 },
            { key: "name", header: "Name" },
          ]}
          isOpen={showProcessLookup}
          onClose={() => setShowProcessLookup(false)}
          onSelect={(row: any) => {
            setProcessId(row.id);
            setProcessName(row.name);
          }}
        />
      )}

      {inboundActivity && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: modalZIndex + 10 }}>
          <div className="bg-white rounded-lg shadow-xl w-[min(1000px,96vw)] max-h-[95vh] p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inbound actions for {inboundActivity.name} (#{inboundActivity.id})</h3>
              <Button aria-label="Close" iconOnly variant="ghost" onClick={() => setInboundActivity(null)}>
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <InboundActionsPanel fixedActivityId={inboundActivity.id} modalZIndex={(modalZIndex || 50) + 20} variant="modal" />
            </div>
          </div>
        </div>
      )}

      {outboundActivity && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: modalZIndex + 10 }}>
          <div className="bg-white rounded-lg shadow-xl w-[min(1000px,96vw)] max-h-[95vh] p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Outbound actions for {outboundActivity.name} (#{outboundActivity.id})</h3>
              <Button aria-label="Close" iconOnly variant="ghost" onClick={() => setOutboundActivity(null)}>
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <OutboundActionsPanel fixedActivityId={outboundActivity.id} modalZIndex={(modalZIndex || 50) + 20} variant="modal" />
            </div>
          </div>
        </div>
      )}
      <LookupModal
        title="Select Activity Type"
        fetchUrl="/api/bpmn/activity-types/lookup"
        columns={[
          { key: "id", header: "ID", width: 80 },
          { key: "name", header: "Name" },
        ]}
        isOpen={showActivityTypeLookup}
        onClose={() => setShowActivityTypeLookup(false)}
        onSelect={(row: any) => {
          setActivityTypeId(row.id);
          setActivityTypeName(row.name);
        }}
      />

      <UntitledTable
        columns={[
          { key: "id", header: "ID", width: 80, sortable: true },
          { key: "name", header: "Name", sortable: true },
          { key: "process", header: "Process", render: (r: any) => r.process?.name ?? r.processId },
          { key: "activityType", header: "Type", render: (r: any) => {
              const meta = activityTypeMeta(r.activityTypeId, r.activityType?.name);
              return (
                <BadgeWithIcon color={meta.color} iconLeading={meta.Icon}>
                  {meta.label}
                </BadgeWithIcon>
              );
            } },
          { key: "isStartActivity", header: "Start", render: (r: any) => {
              const meta = startBadgeMeta(r.isStartActivity);
              return (
                <BadgeWithIcon color={meta.color} iconLeading={meta.Icon}>
                  {meta.label}
                </BadgeWithIcon>
              );
            } },
          { key: "isEndActivity", header: "End", render: (r: any) => {
              const meta = endBadgeMeta(r.isEndActivity);
              return (
                <BadgeWithIcon color={meta.color} iconLeading={meta.Icon}>
                  {meta.label}
                </BadgeWithIcon>
              );
            } },
          { key: "haveMultipleItems", header: "Multiple", render: (r: any) => {
              const meta = multipleBadgeMeta(r.haveMultipleItems);
              return (
                <BadgeWithIcon color={meta.color} iconLeading={meta.Icon}>
                  {meta.label}
                </BadgeWithIcon>
              );
            } },
          {
            key: "__actions__",
            header: "",
            align: "right",
            render: (p: any) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setInboundActivity(p)}
                >
                  Inbound
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setOutboundActivity(p)}
                >
                  Outbound
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<List size={16} />}
                  onClick={() => setNodesActivity(p)}
                >
                  Nodes
                </Button>
                <Button
                  aria-label="Edit"
                  title="Edit"
                  iconOnly
                  variant="secondary"
                  onClick={() => {
                    setEditItem(p);
                    setName(p.name);
                    setIsStart(p.isStartActivity);
                    setIsEnd(p.isEndActivity);
                    setActivityTypeId(p.activityTypeId);
                    setActivityTypeName(p.activityType?.name ?? "");
                    setProcessId(p.processId);
                    setProcessName(p.process?.name ?? "");
                    setHaveMultipleItems(p.haveMultipleItems);
                    setInsideProcessRunnerId(p.insideProcessRunnerId ?? "");
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
        onSortChange={(ob, so) => { setOrderBy(ob); setSortOrder(so); setPage(0); }}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={variant === 'page' ? ((s) => { setPageSize(s); setPage(0); }) : undefined}
      />

      {nodesActivity && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: modalZIndex + 10 }}>
          <div className="bg-white rounded-lg shadow-xl w-[min(1100px,96vw)] max-h-[95vh] p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nodes from {nodesActivity.name} (#{nodesActivity.id})</h3>
              <Button aria-label="Close" iconOnly variant="ghost" onClick={() => setNodesActivity(null)}>
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <NodesPanel fixedFromActivityId={nodesActivity.id} modalZIndex={(modalZIndex || 50) + 20} variant="modal" />
            </div>
          </div>
        </div>
      )}

      {(showCreate || editItem) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: modalZIndex }}>
          <div className="bg-white rounded-lg shadow-xl w-[min(900px,96vw)] p-4 space-y-3">
            <h3 className="text-lg font-semibold">{editItem ? `Edit Activity #${editItem.id}` : "Create Activity"}</h3>
            <div className="container" style={{ gap: 8, flexWrap: "wrap" as const }}>
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
              />
              <div className="container" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => setShowActivityTypeLookup(true)}>Pick Activity Type</Button>
                <span className="text-sm text-gray-600">{activityTypeName || (activityTypeId ? `ID: ${activityTypeId}` : "None")}</span>
              </div>
              {!fixedProcessId && (
                <div className="container" style={{ gap: 6 }}>
                  <Button variant="secondary" onClick={() => setShowProcessLookup(true)}>Pick Process</Button>
                  <span className="text-sm text-gray-600">{processName || (processId ? `ID: ${processId}` : "None")}</span>
                </div>
              )}
              <label className="container" style={{ gap: 6 }}>
                <input type="checkbox" checked={isStart} onChange={(e) => setIsStart(e.target.checked)} />
                <span>Start</span>
              </label>
              <label className="container" style={{ gap: 6 }}>
                <input type="checkbox" checked={isEnd} onChange={(e) => setIsEnd(e.target.checked)} />
                <span>End</span>
              </label>
              <label className="container" style={{ gap: 6 }}>
                <input type="checkbox" checked={haveMultipleItems} onChange={(e) => setHaveMultipleItems(e.target.checked)} />
                <span>Multiple Items</span>
              </label>
              <input
                placeholder="Inside Process Runner ID"
                type="number"
                value={insideProcessRunnerId}
                onChange={(e) => setInsideProcessRunnerId(e.target.value === "" ? "" : Number(e.target.value))}
                className="border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-md px-3 py-2 outline-none"
                style={{ width: 210 }}
              />
            </div>
            <div className="container" style={{ gap: 8, justifyContent: "flex-end" }}>
              <Button variant="secondary" leftIcon={<X size={16} />} onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</Button>
              {editItem ? (
                <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => update(editItem.id)} disabled={loading || !name || !activityTypeId || (!fixedProcessId && !processId)}>Save</Button>
              ) : (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={create} disabled={loading || !name || !activityTypeId || (!fixedProcessId && !processId)}>Create</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
