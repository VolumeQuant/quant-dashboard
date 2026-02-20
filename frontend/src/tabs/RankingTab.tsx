import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import type { RankingData, PipelineResponse, Stock, SortConfig, SortDirection } from "../types";
import { FactorGrade } from "../components/FactorGrade";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export function RankingTab() {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortConfig>({ key: "composite_rank", direction: "asc" });
  const [sectorFilter, setSectorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "verified" | "pending" | "new_entry">("");

  useEffect(() => {
    Promise.all([api.getLatestRanking(), api.getPipeline()])
      .then(([r, p]) => { setRanking(r); setPipeline(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stocks = ranking?.rankings.slice(0, 30) ?? [];

  const sectors = useMemo(() => {
    const s = new Set(stocks.map((st) => st.sector).filter(Boolean));
    return Array.from(s).sort();
  }, [stocks]);

  const getStatus = (ticker: string): "verified" | "pending" | "new_entry" | "" => {
    if (!pipeline) return "";
    if (pipeline.verified.includes(ticker)) return "verified";
    if (pipeline.pending.includes(ticker)) return "pending";
    if (pipeline.new_entry.includes(ticker)) return "new_entry";
    return "";
  };

  const statusBadge = (status: string) => {
    if (status === "verified") return "✅";
    if (status === "pending") return "⏳";
    if (status === "new_entry") return "🆕";
    return "";
  };

  const sortedStocks = useMemo(() => {
    let filtered = stocks;
    if (sectorFilter) filtered = filtered.filter((s) => s.sector === sectorFilter);
    if (statusFilter) filtered = filtered.filter((s) => getStatus(s.ticker) === statusFilter);
    return [...filtered].sort((a, b) => {
      const key = sort.key;
      const av = getSortVal(a, key);
      const bv = getSortVal(b, key);
      return sort.direction === "asc" ? av - bv : bv - av;
    });
  }, [stocks, sort, sectorFilter, statusFilter, pipeline]);

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key === key) return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      const dir: SortDirection = key === "composite_rank" || key === "per" || key === "pbr" ? "asc" : "desc";
      return { key, direction: dir };
    });
  };

  if (loading) return <div className="space-y-2 animate-pulse">{[...Array(10)].map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}</div>;

  const verifiedCount = pipeline?.verified.length ?? 0;
  const pendingCount = pipeline?.pending.length ?? 0;
  const newCount = pipeline?.new_entry.length ?? 0;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--text-tertiary)" }}>
        <span>📋 Top 30 — 보유 확인</span>
        <span className="ml-auto">
          ✅ {verifiedCount} · ⏳ {pendingCount} · 🆕 {newCount}
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <FilterChip label="전체" active={!statusFilter} onClick={() => setStatusFilter("")} />
        <FilterChip label={`✅ 검증 ${verifiedCount}`} active={statusFilter === "verified"} onClick={() => setStatusFilter(statusFilter === "verified" ? "" : "verified")} />
        <FilterChip label={`⏳ 대기 ${pendingCount}`} active={statusFilter === "pending"} onClick={() => setStatusFilter(statusFilter === "pending" ? "" : "pending")} />
        <FilterChip label={`🆕 신규 ${newCount}`} active={statusFilter === "new_entry"} onClick={() => setStatusFilter(statusFilter === "new_entry" ? "" : "new_entry")} />
        {sectors.length > 1 && (
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded-md outline-none"
            style={{
              backgroundColor: "var(--bg-hover)",
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            <option value="">섹터 전체</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-tertiary)" }} className="text-xs">
                <SortHeader label="#" sortKey="composite_rank" sort={sort} onSort={handleSort} align="center" />
                <th className="px-2 py-2.5 text-center font-medium w-8">상태</th>
                <th className="px-3 py-2.5 text-left font-medium">종목</th>
                <SortHeader label="점수" sortKey="score" sort={sort} onSort={handleSort} align="right" />
                <SortHeader label="PER" sortKey="per" sort={sort} onSort={handleSort} align="right" />
                <th className="px-2 py-2.5 text-center font-medium">V</th>
                <th className="px-2 py-2.5 text-center font-medium">Q</th>
                <th className="px-2 py-2.5 text-center font-medium hidden sm:table-cell">G</th>
                <th className="px-2 py-2.5 text-center font-medium hidden sm:table-cell">M</th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((s) => {
                const status = getStatus(s.ticker);
                return (
                  <tr
                    key={s.ticker}
                    className="border-t transition-colors hover:opacity-90"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <td className="px-2 py-2 text-center">
                      <RankBadge rank={s.composite_rank} />
                    </td>
                    <td className="px-2 py-2 text-center text-sm">{statusBadge(status)}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{s.ticker} · {s.sector}</p>
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {s.score?.toFixed(3)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                      {s.per?.toFixed(1) ?? "-"}
                    </td>
                    <td className="px-2 py-2 text-center"><FactorGrade score={s.value_s} size="sm" /></td>
                    <td className="px-2 py-2 text-center"><FactorGrade score={s.quality_s} size="sm" /></td>
                    <td className="px-2 py-2 text-center hidden sm:table-cell"><FactorGrade score={s.growth_s} size="sm" /></td>
                    <td className="px-2 py-2 text-center hidden sm:table-cell"><FactorGrade score={s.momentum_s} size="sm" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-center" style={{ color: "var(--text-tertiary)" }}>
        목록에 있으면 보유, 없으면 매도 검토
      </p>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active ? "bg-blue-500/15 text-blue-400 border-blue-500/30" : ""
      }`}
      style={active ? undefined : {
        backgroundColor: "var(--bg-hover)",
        borderColor: "var(--border-default)",
        color: "var(--text-secondary)",
      }}
    >
      {label}
    </button>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const color = rank <= 3 ? "text-amber-400 font-bold" : rank <= 10 ? "text-blue-400" : "";
  return (
    <span className={`font-mono text-xs ${color}`} style={rank > 10 ? { color: "var(--text-secondary)" } : undefined}>
      {rank}
    </span>
  );
}

function SortHeader({ label, sortKey, sort, onSort, align }: {
  label: string; sortKey: string; sort: SortConfig; onSort: (k: string) => void; align: string;
}) {
  const isActive = sort.key === sortKey;
  const alignCls = align === "right" ? "text-right justify-end" : align === "center" ? "text-center justify-center" : "text-left";
  return (
    <th className={`px-2 py-2.5 font-medium`}>
      <button onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-0.5 ${alignCls} hover:opacity-80`}>
        {label}
        {isActive ? (
          sort.direction === "asc" ? <ArrowUp className="h-3 w-3 text-blue-400" /> : <ArrowDown className="h-3 w-3 text-blue-400" />
        ) : (
          <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
        )}
      </button>
    </th>
  );
}

function getSortVal(s: Stock, key: string): number {
  switch (key) {
    case "composite_rank": return s.composite_rank;
    case "score": return s.score ?? 0;
    case "per": return s.per ?? 9999;
    case "pbr": return s.pbr ?? 9999;
    default: return 0;
  }
}
