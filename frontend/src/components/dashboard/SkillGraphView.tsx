"use client";

import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info, Wrench, BookOpen } from "lucide-react";
import type { Report, SkillNode } from "@/lib/api";

// Navy Court palette: have = affirmed green, gap = navy seal, partial = ochre.
const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  have: { bg: "rgba(60,98,56,0.10)", border: "#3C6238" },
  gap: { bg: "rgba(30,58,110,0.10)", border: "#1E3A6E" },
  partial: { bg: "rgba(138,90,18,0.10)", border: "#8A5A12" },
};

export default function SkillGraphView({ report }: { report: Report }) {
  const [selected, setSelected] = useState<SkillNode | null>(null);
  const dag = report.skill_dag ?? { nodes: [], edges: [] };

  const { nodes, edges } = useMemo(() => {
    // Compute a simple layered layout: x by dependency depth, y by row.
    const incoming: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    dag.nodes.forEach((n) => {
      incoming[n.id] = 0;
      adj[n.id] = [];
    });
    dag.edges.forEach((e) => {
      if (e.to in incoming) incoming[e.to] += 1;
      if (e.from in adj) adj[e.from].push(e.to);
    });

    const depth: Record<string, number> = {};
    const queue = dag.nodes.filter((n) => (incoming[n.id] ?? 0) === 0).map((n) => n.id);
    queue.forEach((id) => (depth[id] = 0));
    const indeg = { ...incoming };
    const q = [...queue];
    while (q.length) {
      const u = q.shift()!;
      for (const v of adj[u] ?? []) {
        depth[v] = Math.max(depth[v] ?? 0, (depth[u] ?? 0) + 1);
        indeg[v] -= 1;
        if (indeg[v] === 0) q.push(v);
      }
    }

    const rowCounter: Record<number, number> = {};
    const rfNodes: Node[] = dag.nodes.map((n) => {
      const d = depth[n.id] ?? 0;
      const row = rowCounter[d] ?? 0;
      rowCounter[d] = row + 1;
      const colors = STATUS_COLORS[n.status ?? "gap"] ?? STATUS_COLORS.gap;
      const size = 130 + Math.round((n.importance ?? 0.5) * 70);
      return {
        id: n.id,
        position: { x: d * 240 + 30, y: row * 96 + 30 },
        data: { label: n.id },
        style: {
          width: size,
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          borderRadius: 4,
          color: "#1a1a18",
          fontSize: 12,
          fontWeight: 500,
          padding: 8,
        },
      };
    });

    const rfEdges: Edge[] = dag.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.from,
      target: e.to,
      animated: false,
      style: { stroke: "#C1BEB1" },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [dag]);

  if (!dag.nodes.length) {
    return (
      <p className="text-sm text-ink-2">
        No skill graph available for this analysis.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-ink-2">
        <Legend color="#3C6238" label="You have this" />
        <Legend color="#1E3A6E" label="Gap" />
        <Legend color="#8A5A12" label="Partial" />
        <span className="text-ink-3">· node size = importance · click a node for detail</span>
      </div>

      <div className="h-[460px] overflow-hidden rounded-[4px] border border-rule-strong bg-surface">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          onNodeClick={(_, node) => {
            const found = dag.nodes.find((n) => n.id === node.id) ?? null;
            setSelected(found);
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#D8D6CC" gap={20} />
          <Controls className="!bg-surface !text-ink [&_button]:!border-rule [&_button]:!bg-surface [&_button:hover]:!bg-sunken [&_button]:!fill-ink" />
        </ReactFlow>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="absolute right-0 top-0 z-10 h-full w-80 rounded-[4px] border-l-2 border-seal bg-surface p-5 shadow-lg"
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-ink">{selected.id}</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-ink-3 transition hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-line-strong px-2 py-0.5 text-ink-2">
                {selected.status === "have" ? "✓ You have this" : "Gap"}
              </span>
              {selected.difficulty && (
                <span className="rounded-full border border-line-strong px-2 py-0.5 text-ink-2">
                  {selected.difficulty}
                </span>
              )}
              {selected.estimated_hours ? (
                <span className="nums rounded-full border border-line-strong px-2 py-0.5 text-ink-2">
                  ~{selected.estimated_hours}h
                </span>
              ) : null}
            </div>
            {selected.why_it_matters && (
              <div className="mb-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-seal">
                  <Info className="h-3.5 w-3.5" /> Why this matters
                </p>
                <p className="text-sm leading-relaxed text-ink-2">{selected.why_it_matters}</p>
              </div>
            )}
            {selected.how_to_close && (
              <div className="mb-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-advocate">
                  <Wrench className="h-3.5 w-3.5" /> How to close this gap
                </p>
                <p className="text-sm leading-relaxed text-ink-2">{selected.how_to_close}</p>
              </div>
            )}
            {selected.resource && (
              <p className="flex items-center gap-1.5 text-sm text-ink-3">
                <BookOpen className="h-3.5 w-3.5" /> {selected.resource}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
