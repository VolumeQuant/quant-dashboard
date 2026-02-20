import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import type { RankingData, PipelineResponse, Stock, SortConfig, SortDirection } from "../types";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export function RankingTab() {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortConfig>({ key: "composite_rank", direction: "asc" });
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    Promise.all([api.getLatestRanking(), api.getPipeline()])
      .then(([r, p]) => { setRanking(r); setPipeline(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stocks = ranking?.rankings.slice(0, 30) ?? [];

  const getStatus = (ticker: string) => {
    if (!pipeline) return "";
    if (pipeline.verified.includes(ticker)) return "verified";
    if (pipeline.pending.includes(ticker)) return "pending";
    if (pipeline.new_entry.includes(ticker)) return "new_entry";
    return "";
  };

  const sorted = useMemo(() => {
    let filtered = stocks;
    if (statusFilter) filtered = filtered.filter((s) => getStatus(s.ticker) === statusFilter);
    return [...filtered].sort((a, b) => {
      const av = sortVal(a, sort.key);
      const bv = sortVal(b, sort.key);
      return sort.direction === "asc" ? av - bv : bv - av;
    });
  }, [stocks, sort, statusFilter, pipeline]);

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key === key) return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      const dir: SortDirection = ["composite_rank", "per", "pbr"].includes(key) ? "asc" : "desc";
      return { key, direction: dir };
    });
  };

  if (loading) return <div className="space-y-2 animate-pulse">{[...Array(10)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}</div>;

  const vc = pipeline?.verified.length ?? 0;
  const pc = pipeline?.pending.length ?? 0;
  const nc = pipeline?.new_entry.length ?? 0;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-sm font-semibold text-slate-100">Top 30 순위</h3>
          <span className="text-xs text-slate-500">목록에 있으면 보유, 없으면 매도 검토</span>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Chip label="전체" count={30} active={!statusFilter} onClick={() => setStatusFilter("")} />
        <Chip label="✅ 검증" count={vc} active={statusFilter === "verified"} onClick={() => setStatusFilter(statusFilter === "verified" ? "" : "verified")} color="emerald" />
        <Chip label="⏳ 대기" count={pc} active={statusFilter === "pending"} onClick={() => setStatusFilter(statusFilter === "pending" ? "" : "pending")} color="amber" />
        <Chip label="🆕 신규" count={nc} active={statusFilter === "new_entry"} onClick={() => setStatusFilter(statusFilter === "new_entry" ? "" : "new_entry")} color="blue" />
      </div>

      {/* Desktop Table */}
      <div className="card overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-border">
                <SH label="#" k="composite_rank" sort={sort} onSort={handleSort} align="center" />
                <th className="px-2 py-3 text-center font-medium">상태</th>
                <th className="px-3 py-3 text-left font-medium">종목</th>
                <th className="px-3 py-3 text-left font-medium">섹터</th>
                <SH label="총점" k="score" sort={sort} onSort={handleSort} align="right" />
                <SH label="PER" k="per" sort={sort} onSort={handleSort} align="right" />
                <SH label="PBR" k="pbr" sort={sort} onSort={handleSort} align="right" />
                <SH label="V" k="value_s" sort={sort} onSort={handleSort} align="center" />
                <SH label="Q" k="quality_s" sort={sort} onSort={handleSort} align="center" />
                <SH label="G" k="growth_s" sort={sort} onSort={handleSort} align="center" />
                <SH label="M" k="momentum_s" sort={sort} onSort={handleSort} align="center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {sorted.map((s) => (
                <tr key={s.ticker} className="hover:bg-surface-hover transition-colors">
                  <td className="px-2 py-2.5 text-center">
                    <RankBadge rank={s.composite_rank} />
                  </td>
                  <td className="px-2 py-2.5 text-center text-sm">
                    {statusEmoji(getStatus(s.ticker))}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-100">{s.name}</p>
                    <p className="text-[10px] text-slate-500">{s.ticker}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">{s.sector}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-mono tabular-nums font-semibold ${scoreColor(s.score)}`}>
                      {s.score?.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-400 text-xs">
                    {s.per?.toFixed(1) ?? "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-400 text-xs">
                    {s.pbr?.toFixed(2) ?? "-"}
                  </td>
                  <td className="px-2 py-2.5 text-center"><FactorBadge score={s.value_s} /></td>
                  <td className="px-2 py-2.5 text-center"><FactorBadge score={s.quality_s} /></td>
                  <td className="px-2 py-2.5 text-center"><FactorBadge score={s.growth_s} /></td>
                  <td className="px-2 py-2.5 text-center"><FactorBadge score={s.momentum_s} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {sorted.map((s) => (
          <div key={s.ticker} className="card p-3 flex items-center gap-3">
            <RankBadge rank={s.composite_rank} />
            <span className="text-sm">{statusEmoji(getStatus(s.ticker))}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{s.name}</p>
              <p className="text-[10px] text-slate-500">{s.ticker} · {s.sector}</p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-mono tabular-nums font-semibold ${scoreColor(s.score)}`}>
                {s.score?.toFixed(3)}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">PER {s.per?.toFixed(1) ?? "-"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chip({ label, count, active, onClick, color }: {
  label: string; count: number; active: boolean; onClick: () => void; color?: string;
}) {
  const base = active
    ? `bg-${color || "emerald"}-500/15 border-${color || "emerald"}-500/30 text-${color || "emerald"}-400`
    : "bg-surface-elevated border-border text-slate-400";
  return (
    <button onClick={onClick} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${active ? "" : base}`}
      style={active ? undefined : { backgroundColor: "var(--surface-elevated)", borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
      <span className={active ? `text-${color || "emerald"}-400` : ""}>{label}</span>
      <span className="font-mono ml-1 font-bold tabular-nums">{count}</span>
    </button>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 5) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        {rank}
      </span>
    );
  }
  if (rank <= 10) return <span className="font-mono text-xs font-bold tabular-nums text-slate-300">{rank}</span>;
  return <span className="font-mono text-xs tabular-nums text-slate-500">{rank}</span>;
}

function FactorBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-slate-600">-</span>;
  const grade = score >= 1.28 ? "A+" : score >= 0.84 ? "A" : score >= 0.52 ? "B+" : score >= 0 ? "B" : score >= -0.52 ? "C" : "D";
  const color = grade.startsWith("A") ? "text-emerald-400 bg-emerald-500/15"
    : grade.startsWith("B") ? "text-blue-400 bg-blue-500/10"
    : grade === "C" ? "text-amber-400 bg-amber-500/10"
    : "text-red-400 bg-red-500/10";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-[10px] font-bold ${color}`}>
      {grade}
    </span>
  );
}

function scoreColor(score: number | null | undefined): string {
  if (score == null) return "text-slate-500";
  if (score >= 0.5) return "text-emerald-400";
  if (score >= 0.3) return "text-emerald-300";
  return "text-slate-300";
}

function statusEmoji(status: string) {
  if (status === "verified") return "✅";
  if (status === "pending") return "⏳";
  if (status === "new_entry") return "🆕";
  return "";
}

function SH({ label, k, sort, onSort, align }: {
  label: string; k: string; sort: SortConfig; onSort: (k: string) => void; align: string;
}) {
  const active = sort.key === k;
  const cls = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "";
  return (
    <th className="px-2 py-3 font-medium cursor-pointer select-none hover:text-slate-200 transition-colors"
        onClick={() => onSort(k)}>
      <div className={`flex items-center gap-1 ${cls}`}>
        <span>{label}</span>
        {active ? (
          sort.direction === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </div>
    </th>
  );
}

function sortVal(s: Stock, key: string): number {
  switch (key) {
    case "composite_rank": return s.composite_rank;
    case "score": return s.score ?? 0;
    case "per": return s.per ?? 9999;
    case "pbr": return s.pbr ?? 9999;
    case "value_s": return s.value_s ?? -999;
    case "quality_s": return s.quality_s ?? -999;
    case "growth_s": return s.growth_s ?? -999;
    case "momentum_s": return s.momentum_s ?? -999;
    default: return 0;
  }
}
