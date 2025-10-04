"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../lib/api";
import { Checkbox } from "../base/checkbox/checkbox";

export type ProcessGraphProps = {
  processId: number;
  className?: string;
};

type GraphActivity = {
  id: number;
  name: string;
  isStartActivity?: boolean;
  isEndActivity?: boolean;
};

type GraphEdge = {
  id: number;
  fromActivityId: number;
  toActivityId: number;
  name?: string;
};

type InboundDTO = { id: number; activityId: number; priority?: number | null; actionId: number; actionName?: string };
type OutboundDTO = { id: number; activityId: number; priority?: number | null; actionId: number; actionName?: string };
type NodeCondDTO = { nodeId: number; conditionId: number; priority?: number | null; conditionName?: string };
type NodeCmdDTO = { id: number; nodeId: number; name?: string; route?: string | null; nodeCommandTypeId: number; nodeCommandTypeName?: string };

export function ProcessGraph({ processId, className }: ProcessGraphProps) {
  const [activities, setActivities] = useState<GraphActivity[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [inbound, setInbound] = useState<InboundDTO[]>([]);
  const [outbound, setOutbound] = useState<OutboundDTO[]>([]);
  const [nodeConds, setNodeConds] = useState<NodeCondDTO[]>([]);
  const [nodeCmds, setNodeCmds] = useState<NodeCmdDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggles
  const [showInbound, setShowInbound] = useState(false);
  const [showOutbound, setShowOutbound] = useState(false);
  const [showNodeConds, setShowNodeConds] = useState(false);
  const [showNodeCmds, setShowNodeCmds] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (showInbound) params.set('inbound', '1');
        if (showOutbound) params.set('outbound', '1');
        if (showNodeConds) params.set('nodeConditions', '1');
        if (showNodeCmds) params.set('nodeCommands', '1');
        const qs = params.toString();
        const res = await fetchJson<any>(`/api/bpmn/processes/${processId}/graph${qs ? `?${qs}` : ''}`);
        if (!active) return;
        const payload = res && res.result ? res.result : res;
        setActivities((payload?.activities as GraphActivity[]) || []);
        setEdges((payload?.edges as GraphEdge[]) || []);
        setInbound((payload?.inbound as InboundDTO[]) || []);
        setOutbound((payload?.outbound as OutboundDTO[]) || []);
        setNodeConds((payload?.nodeConditions as NodeCondDTO[]) || []);
        setNodeCmds((payload?.nodeCommands as NodeCmdDTO[]) || []);
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [processId, showInbound, showOutbound, showNodeConds, showNodeCmds]);

  // text measurement/wrapping helpers (approximation without DOM measure)
  const CHAR_W = 7.2; // ~ px width for text-sm (0.875rem ~ 14px)
  const LINE_H = 16; // px per line
  const PAD_X = 16; // horizontal padding per side
  const PAD_Y = 10; // vertical padding per side
  const MIN_W = 160;
  const MAX_W = 320;
  const MIN_H = 48;
  const COL_GAP = 100; // horizontal gap between columns
  const ROW_GAP = 90; // vertical gap between nodes in a column
  const OVERLAY_MAX_W = 300; // max width (px) for node overlay bubbles
  const OVERLAY_MAX_CHARS = Math.floor((OVERLAY_MAX_W - 8) / CHAR_W);

  function breakLongWord(word: string, maxChars: number): string[] {
    const parts: string[] = [];
    let i = 0;
    while (i < word.length) {
      parts.push(word.slice(i, i + maxChars));
      i += maxChars;
    }
    return parts.length ? parts : [word];
  }

  function wrapByWords(text: string, maxCharsPerLine: number): string[] {
    if (!text) return [""];
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      const chunks = w.length > maxCharsPerLine ? breakLongWord(w, maxCharsPerLine) : [w];
      for (const chunk of chunks) {
        if (current.length === 0) {
          current = chunk;
          continue;
        }
        if ((current.length + 1 + chunk.length) <= maxCharsPerLine) {
          current += " " + chunk;
        } else {
          lines.push(current);
          current = chunk;
        }
      }
    }
    if (current.length) lines.push(current);
    return lines.length ? lines : [text];
  }

  const { layout, width, height } = useMemo(() => {
    // Build adjacency
    const nodes = new Map<number, GraphActivity>();
    activities.forEach((a) => nodes.set(a.id, a));
    const outgoing = new Map<number, number[]>();
    const incomingCount = new Map<number, number>();
    nodes.forEach((_, id) => {
      outgoing.set(id, []);
      incomingCount.set(id, 0);
    });
    edges.forEach((e) => {
      if (!outgoing.has(e.fromActivityId)) outgoing.set(e.fromActivityId, []);
      outgoing.get(e.fromActivityId)!.push(e.toActivityId);
      incomingCount.set(e.toActivityId, (incomingCount.get(e.toActivityId) || 0) + 1);
    });

    // Determine levels using BFS from start activities (fallback: no incoming)
    const level = new Map<number, number>();
    const q: number[] = [];

    const startCandidates = activities.filter((a) => a.isStartActivity);
    if (startCandidates.length > 0) {
      startCandidates.forEach((a) => {
        level.set(a.id, 0);
        q.push(a.id);
      });
    } else {
      // fallback: nodes with zero incoming
      activities.filter((a) => (incomingCount.get(a.id) || 0) === 0).forEach((a) => {
        level.set(a.id, 0);
        q.push(a.id);
      });
    }

    // BFS layering (cap to avoid infinite loops on cycles)
    const MAX_ITERS = activities.length * 5;
    let iters = 0;
    while (q.length && iters++ < MAX_ITERS) {
      const u = q.shift()!;
      const lu = level.get(u) || 0;
      (outgoing.get(u) || []).forEach((v) => {
        const lv = level.get(v);
        if (lv === undefined || lv < lu + 1) {
          level.set(v, lu + 1);
          q.push(v);
        }
      });
    }

    // Assign levels for any remaining nodes
    activities.forEach((a) => {
      if (!level.has(a.id)) level.set(a.id, 0);
    });

    // Group by level and compute positions
    const groups = new Map<number, GraphActivity[]>();
    activities.forEach((a) => {
      const l = level.get(a.id) || 0;
      if (!groups.has(l)) groups.set(l, []);
      groups.get(l)!.push(a);
    });

    // Sort nodes in each level by id for stable layout
    Array.from(groups.values()).forEach((arr) => arr.sort((a, b) => a.id - b.id));

    // Precompute node lines, widths and heights
    const maxCharsPerLine = Math.floor((MAX_W - PAD_X * 2) / CHAR_W);
    const nodeBox = new Map<number, { w: number; h: number; lines: string[] }>();
    activities.forEach((a) => {
      const lines = wrapByWords(a.name || `Activity #${a.id}`, maxCharsPerLine);
      const longest = Math.max(...lines.map((s) => s.length), 1);
      const w = Math.max(MIN_W, Math.min(MAX_W, Math.round(PAD_X * 2 + longest * CHAR_W)));
      const h = Math.max(MIN_H, Math.round(PAD_Y * 2 + lines.length * LINE_H));
      nodeBox.set(a.id, { w, h, lines });
    });

    // Compute per-column widths and positions
    const positions = new Map<number, { x: number; y: number }>();
    const levels = Array.from(groups.keys()).sort((a, b) => a - b);
    const colWidths: number[] = levels.map((l) => {
      const column = groups.get(l)!;
      const maxW = Math.max(...column.map((a) => nodeBox.get(a.id)!.w), MIN_W);
      return maxW + COL_GAP;
    });
    const margin = 40;
    const colHeights: number[] = [];

    // Build quick counts for overlay presence
    const ibCount = new Map<number, number>();
    inbound.forEach((ia) => ibCount.set(ia.activityId, (ibCount.get(ia.activityId) || 0) + 1));
    const obCount = new Map<number, number>();
    outbound.forEach((oa) => obCount.set(oa.activityId, (obCount.get(oa.activityId) || 0) + 1));
    const rowGap = ROW_GAP + (showNodeConds || showNodeCmds ? 16 : 0);

    // overlay wrap config
    // OVERLAY_MAX_CHARS is used outside too

    levels.forEach((l, colIdx) => {
      const column = groups.get(l)!;
      const xBase = margin + colWidths.slice(0, colIdx).reduce((s, v) => s + v, 0);
      let yCursor = margin;
      column.forEach((a, rowIdx) => {
        const x = xBase;
        const baseH = nodeBox.get(a.id)!.h;
        let extra = 0;
        // inbound lines height
        if (showInbound && (ibCount.get(a.id) || 0) > 0) {
          const names = inbound.filter((ia) => ia.activityId === a.id).map((x) => x.actionName || `Action #${x.actionId}`);
          const label = `In: ${names.join(', ')}`;
          const lines = wrapByWords(label, OVERLAY_MAX_CHARS);
          extra += lines.length * LINE_H + 6;
        }
        // outbound lines height
        if (showOutbound && (obCount.get(a.id) || 0) > 0) {
          const names = outbound.filter((oa) => oa.activityId === a.id).map((x) => x.actionName || `Action #${x.actionId}`);
          const label = `Out: ${names.join(', ')}`;
          const lines = wrapByWords(label, OVERLAY_MAX_CHARS);
          extra += lines.length * LINE_H + 6;
        }
        if ((a as any).isStartActivity || (a as any).isEndActivity) extra += LINE_H + 6;
        const effH = baseH + extra;
        const y = yCursor;
        positions.set(a.id, { x, y });
        yCursor += effH + rowGap;
      });
      colHeights[colIdx] = (yCursor - rowGap) + margin; // total height for this column incl. bottom margin
    });

    const cols = levels.length || 1;
    const rows = Math.max(...levels.map((l) => groups.get(l)!.length), 1);
    const width = margin + colWidths.slice(0, cols).reduce((s, v) => s + v, 0) + margin;
    const height = Math.max(...(colHeights.length ? colHeights : [margin * 2]));

    // Build layout output
    const layout = {
      nodes: activities.map((a) => ({
        ...a,
        x: positions.get(a.id)?.x || margin,
        y: positions.get(a.id)?.y || margin,
        w: nodeBox.get(a.id)!.w,
        h: nodeBox.get(a.id)!.h,
        lines: nodeBox.get(a.id)!.lines,
      })),
      edges: edges.map((e) => ({
        ...e,
        from: positions.get(e.fromActivityId) || { x: margin, y: margin },
        to: positions.get(e.toActivityId) || { x: margin, y: margin },
      })),
    } as const;

    return { layout, width, height };
  }, [activities, edges, inbound, outbound, showInbound, showOutbound, showNodeConds, showNodeCmds]);

  // Derived counts
  const inboundCount = useMemo(() => {
    const m = new Map<number, number>();
    inbound.forEach((ia) => m.set(ia.activityId, (m.get(ia.activityId) || 0) + 1));
    return m;
  }, [inbound]);
  const outboundCount = useMemo(() => {
    const m = new Map<number, number>();
    outbound.forEach((oa) => m.set(oa.activityId, (m.get(oa.activityId) || 0) + 1));
    return m;
  }, [outbound]);
  const condCount = useMemo(() => {
    const m = new Map<number, number>();
    nodeConds.forEach((c) => m.set(c.nodeId, (m.get(c.nodeId) || 0) + 1));
    return m;
  }, [nodeConds]);
  const cmdCount = useMemo(() => {
    const m = new Map<number, number>();
    nodeCmds.forEach((c) => m.set(c.nodeId, (m.get(c.nodeId) || 0) + 1));
    return m;
  }, [nodeCmds]);

  // Name maps for quick lookup
  const inboundNames = useMemo(() => {
    const m = new Map<number, string[]>();
    inbound.forEach((ia) => {
      const arr = m.get(ia.activityId) || [];
      arr.push(ia.actionName || `Action #${ia.actionId}`);
      m.set(ia.activityId, arr);
    });
    return m;
  }, [inbound]);
  const outboundNames = useMemo(() => {
    const m = new Map<number, string[]>();
    outbound.forEach((oa) => {
      const arr = m.get(oa.activityId) || [];
      arr.push(oa.actionName || `Action #${oa.actionId}`);
      m.set(oa.activityId, arr);
    });
    return m;
  }, [outbound]);
  const condNames = useMemo(() => {
    const m = new Map<number, string[]>();
    nodeConds.forEach((nc) => {
      const arr = m.get(nc.nodeId) || [];
      arr.push(nc.conditionName || `Condition #${nc.conditionId}`);
      m.set(nc.nodeId, arr);
    });
    return m;
  }, [nodeConds]);
  const cmdNames = useMemo(() => {
    const m = new Map<number, string[]>();
    nodeCmds.forEach((nc) => {
      const arr = m.get(nc.nodeId) || [];
      arr.push(nc.name || `Cmd #${nc.id}`);
      m.set(nc.nodeId, arr);
    });
    return m;
  }, [nodeCmds]);
  const edgeColor = useMemo(() => {
    const m = new Map<number, string>();
    nodeCmds.forEach((nc) => {
      if (nc.nodeCommandTypeName && nc.nodeCommandTypeName.length >= 0) {
        const color = (nc as any).nodeCommandTypeColor as string | undefined;
        if (color && !m.has(nc.nodeId)) m.set(nc.nodeId, color);
      }
    });
    return m;
  }, [nodeCmds]);

  function summarize(names: string[], max = 3): string {
    if (!names || names.length === 0) return '';
    if (names.length <= max) return names.join(', ');
    const shown = names.slice(0, max).join(', ');
    return `${shown} +${names.length - max}`;
  }

  function textApproxWidth(text: string, padding = 8): number {
    return Math.round((text?.length || 0) * CHAR_W) + padding;
  }

  if (loading) return <div className="text-sm text-gray-600">Loading graph...</div>;
  if (error) return <div className="alert">{error}</div>;

  return (
    <div className={className}>
      {/* Toggles bar */}
      <div className="flex items-center gap-4 mb-3">
        <Checkbox size="sm" isSelected={showInbound} onChange={setShowInbound} label="Inbound" />
        <Checkbox size="sm" isSelected={showOutbound} onChange={setShowOutbound} label="Outbound" />
        <Checkbox size="sm" isSelected={showNodeConds} onChange={setShowNodeConds} label="Node Conditions" />
        <Checkbox size="sm" isSelected={showNodeCmds} onChange={setShowNodeCmds} label="Node Commands" />
      </div>
      <svg width={width} height={height} className="bg-gray-50 rounded-md ring-1 ring-gray-200">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Edges */}
        {layout.edges.map((e) => {
          const fromNode = layout.nodes.find((n) => n.id === e.fromActivityId);
          const toNode = layout.nodes.find((n) => n.id === e.toActivityId);
          const fromX = (fromNode?.x || 0) + (fromNode?.w || MIN_W);
          const fromY = (fromNode?.y || 0) + (fromNode?.h || MIN_H) / 2;
          const toX = toNode?.x || 0;
          const toY = (toNode?.y || 0) + (toNode?.h || MIN_H) / 2;
          const midX = (fromX + toX) / 2;
          const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
          const stroke = edgeColor.get(e.id) || '#94a3b8';
          const condList = condNames.get(e.id) || [];
          const cmdList = cmdNames.get(e.id) || [];
          // dynamic wrap limit for edge overlays based on available edge width
          const edgeAvailW = Math.max(120, Math.abs(toX - fromX) - 60);
          const edgeWrapChars = Math.max(10, Math.floor((Math.min(OVERLAY_MAX_W, edgeAvailW) - 8) / CHAR_W));
          return (
            <g key={`e-${e.id}`}>
              <path d={path} fill="none" stroke={stroke} strokeWidth={2} markerEnd="url(#arrow)" />
              <title>{[e.name, (showNodeConds ? `Conds: ${(condList || []).join(', ')}` : ''), (showNodeCmds ? `Cmds: ${(cmdList || []).join(', ')}` : '')].filter(Boolean).join(' | ')}</title>
              {e.name && (
                <text x={midX} y={(fromY + toY) / 2 - 6} textAnchor="middle" className="text-[11px] fill-gray-500">
                  {e.name}
                </text>
              )}
              {(showNodeConds || showNodeCmds) && (
                <g>
                  {showNodeConds && condList.length > 0 && (() => {
                    const label = `Conds: ${condList.join(', ')}`;
                    const lines = wrapByWords(label, edgeWrapChars);
                    const yTop = (fromY + toY) / 2 + 10;
                    const w = Math.min(edgeAvailW, Math.max(...lines.map((s) => textApproxWidth(s))));
                    const h = lines.length * LINE_H + 6;
                    return (
                      <g>
                        <rect x={midX - w / 2} y={yTop - 11} width={w} height={h} rx={3} fill="#ffffff" opacity={0.9} />
                        <text textAnchor="middle" className="text-[10px] fill-amber-700">
                          {lines.map((ln, i) => (
                            <tspan key={i} x={midX} y={yTop + i * LINE_H}>{ln}</tspan>
                          ))}
                        </text>
                      </g>
                    );
                  })()}
                  {showNodeCmds && cmdList.length > 0 && (() => {
                    const label = `Cmds: ${cmdList.join(', ')}`;
                    const lines = wrapByWords(label, edgeWrapChars);
                    const prevH = showNodeConds && condList.length > 0 ? (wrapByWords(`Conds: ${condList.join(', ')}`, edgeWrapChars).length * LINE_H + 6) : 0;
                    const yTop = (fromY + toY) / 2 + 10 + (prevH > 0 ? prevH + 4 : 14);
                    const w = Math.min(edgeAvailW, Math.max(...lines.map((s) => textApproxWidth(s))));
                    const h = lines.length * LINE_H + 6;
                    return (
                      <g>
                        <rect x={midX - w / 2} y={yTop - 11} width={w} height={h} rx={3} fill="#ffffff" opacity={0.9} />
                        <text textAnchor="middle" className="text-[10px] fill-indigo-700">
                          {lines.map((ln, i) => (
                            <tspan key={i} x={midX} y={yTop + i * LINE_H}>{ln}</tspan>
                          ))}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {layout.nodes.map((n) => (
          <g key={`n-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
            <rect
              width={n.w}
              height={n.h}
              rx={8}
              className={
                n.isStartActivity
                  ? "fill-emerald-50 stroke-emerald-300"
                  : n.isEndActivity
                  ? "fill-rose-50 stroke-rose-300"
                  : "fill-white stroke-gray-300"
              }
              strokeWidth={1.5}
            />
            <title>{[
              `Activity: ${n.name || `#${n.id}`}`,
              (showInbound ? `Inbound: ${(inboundNames.get(n.id) || []).join(', ')}` : ''),
              (showOutbound ? `Outbound: ${(outboundNames.get(n.id) || []).join(', ')}` : ''),
            ].filter(Boolean).join(' | ')}</title>
            <text textAnchor="middle" className="text-sm fill-gray-800">
              {(() => {
                const lines = (n as any).lines as string[];
                const totalH = lines.length * LINE_H;
                const startY = Math.max(12, Math.round((n.h - totalH) / 2) + 12);
                return lines.map((line, idx) => (
                  <tspan key={idx} x={n.w / 2} y={startY + idx * LINE_H}>
                    {line}
                  </tspan>
                ));
              })()}
            </text>
            {(showInbound || showOutbound) && (
              <g>
                {showInbound && (inboundNames.get(n.id) || []).length > 0 && (() => {
                  const label = `In: ${(inboundNames.get(n.id) || []).join(', ')}`;
                  const lines = wrapByWords(label, OVERLAY_MAX_CHARS);
                  const yTop = n.h + 12;
                  const w = Math.max(...lines.map((s) => textApproxWidth(s)));
                  const h = lines.length * LINE_H + 6;
                  return (
                    <g>
                      <rect x={n.w / 2 - w / 2} y={yTop - 11} width={w} height={h} rx={3} fill="#ffffff" opacity={0.9} />
                      <text textAnchor="middle" className="text-[10px] fill-emerald-700">
                        {lines.map((ln, i) => (
                          <tspan key={i} x={n.w / 2} y={yTop + i * LINE_H}>{ln}</tspan>
                        ))}
                      </text>
                    </g>
                  );
                })()}
                {showOutbound && (outboundNames.get(n.id) || []).length > 0 && (() => {
                  const label = `Out: ${(outboundNames.get(n.id) || []).join(', ')}`;
                  const lines = wrapByWords(label, OVERLAY_MAX_CHARS);
                  const prevH = showInbound && (inboundNames.get(n.id) || []).length > 0 ? (wrapByWords(`In: ${(inboundNames.get(n.id) || []).join(', ')}`, OVERLAY_MAX_CHARS).length * LINE_H + 6) : 0;
                  const yTop = n.h + 12 + (prevH > 0 ? prevH + 4 : 14);
                  const w = Math.max(...lines.map((s) => textApproxWidth(s)));
                  const h = lines.length * LINE_H + 6;
                  return (
                    <g>
                      <rect x={n.w / 2 - w / 2} y={yTop - 11} width={w} height={h} rx={3} fill="#ffffff" opacity={0.9} />
                      <text textAnchor="middle" className="text-[10px] fill-sky-700">
                        {lines.map((ln, i) => (
                          <tspan key={i} x={n.w / 2} y={yTop + i * LINE_H}>{ln}</tspan>
                        ))}
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}
            {(n.isStartActivity || n.isEndActivity) && (
              <text x={n.w / 2} y={(() => {
                let y = n.h + 16;
                if (showInbound && (inboundNames.get(n.id) || []).length > 0) {
                  y += wrapByWords(`In: ${(inboundNames.get(n.id) || []).join(', ')}`, OVERLAY_MAX_CHARS).length * LINE_H + 8;
                }
                if (showOutbound && (outboundNames.get(n.id) || []).length > 0) {
                  y += wrapByWords(`Out: ${(outboundNames.get(n.id) || []).join(', ')}`, OVERLAY_MAX_CHARS).length * LINE_H + 8;
                }
                return y;
              })()} textAnchor="middle" className="text-[10px] fill-gray-500">
                {n.isStartActivity ? "Start" : n.isEndActivity ? "End" : ""}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
