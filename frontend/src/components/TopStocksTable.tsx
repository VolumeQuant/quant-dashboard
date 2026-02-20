import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Stock, SortConfig, SortDirection } from "../types";
import { FactorGrade } from "./FactorGrade";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

interface TopStocksTableProps {
  stocks: Stock[];
  title: string;
  showSectorFilter?: boolean;
  pipelineStatus?: { verified: string[]; pending: string[]; new_entry: string[] };
}

function getSortValue(stock: Stock, key: string): number {
  switch (key) {
    case "composite_rank": return stock.composite_rank;
    case "score": return stock.score ?? 0;
    case "per": return stock.per ?? 9999;
    case "pbr": return stock.pbr ?? 9999;
    case "value_s": return stock.value_s ?? -999;
    case "quality_s": return stock.quality_s ?? -999;
    case "growth_s": return stock.growth_s ?? -999;
    case "momentum_s": return stock.momentum_s ?? -999;
    default: return 0;
  }
}

function getStatusBadge(ticker: string, pipeline?: { verified: string[]; pending: string[]; new_entry: string[] }) {
  if (!pipeline) return null;
  if (pipeline.verified.includes(ticker))
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">✅</span>;
  if (pipeline.pending.includes(ticker))
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">⏳</span>;
  if (pipeline.new_entry.includes(ticker))
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400">🆕</span>;
  return null;
}

export function TopStocksTable({ stocks, title, showSectorFilter = true, pipelineStatus }: TopStocksTableProps) {
  const [sort, setSort] = useState<SortConfig>({ key: "composite_rank", direction: "asc" });
  const [sectorFilter, setSectorFilter] = useState<string>("");

  const sectors = useMemo(() => {
    const s = new Set(stocks.map((st) => st.sector).filter(Boolean));
    return Array.from(s).sort();
  }, [stocks]);

  const sortedStocks = useMemo(() => {
    let filtered = stocks;
    if (sectorFilter) {
      filtered = stocks.filter((s) => s.sector === sectorFilter);
    }
    return [...filtered].sort((a, b) => {
      const aVal = getSortValue(a, sort.key);
      const bVal = getSortValue(b, sort.key);
      return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [stocks, sort, sectorFilter]);

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      // Default sort directions
      const defaultDir: SortDirection =
        key === "composite_rank" || key === "per" || key === "pbr" ? "asc" : "desc";
      return { key, direction: defaultDir };
    });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sort.key !== columnKey)
      return <ArrowUpDown className="h-3 w-3 text-content-tertiary opacity-40" />;
    return sort.direction === "asc" ? (
      <ArrowUp className="h-3 w-3 text-blue-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-400" />
    );
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-base font-semibold text-content-primary">{title}</h2>
        {showSectorFilter && sectors.length > 0 && (
          <div className="relative">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="appearance-none text-xs px-3 py-1.5 pr-7 rounded-lg bg-surface-hover border border-border text-content-primary focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none"
            >
              <option value="">전체 섹터</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-content-tertiary pointer-events-none" />
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-hover text-content-tertiary text-xs">
              <HeaderCell label="순위" sortKey="composite_rank" sort={sort} onSort={handleSort} SortIcon={SortIcon} align="left" />
              {pipelineStatus && <th className="px-2 py-3 text-center font-medium">상태</th>}
              <th className="px-4 py-3 text-left font-medium">종목</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">섹터</th>
              <HeaderCell label="총점" sortKey="score" sort={sort} onSort={handleSort} SortIcon={SortIcon} align="right" />
              <HeaderCell label="PER" sortKey="per" sort={sort} onSort={handleSort} SortIcon={SortIcon} align="right" />
              <HeaderCell label="PBR" sortKey="pbr" sort={sort} onSort={handleSort} SortIcon={SortIcon} align="right" className="hidden md:table-cell" />
              <HeaderCell label="Value" sortKey="value_s" sort={sort} onSort={handleSort} SortIcon={SortIcon} align="center" />
              <HeaderCell label="Quality" sortKey="quality_s" sort={sort} onSort={handleSort} SortIcon={SortIcon} align="center" />
              <HeaderCell label="Growth" sortKey="growth_s" sort={sort} onSort={handleSort} SortIcon={SortIcon} align="center" className="hidden md:table-cell" />
              <HeaderCell label="Momentum" sortKey="momentum_s" sort={sort} onSort={handleSort} SortIcon={SortIcon} align="center" className="hidden md:table-cell" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedStocks.map((s) => (
              <tr
                key={s.ticker}
                className="hover:bg-surface-hover transition-colors group"
              >
                <td className="px-4 py-3">
                  <RankBadge rank={s.composite_rank} />
                </td>
                {pipelineStatus && (
                  <td className="px-2 py-3 text-center">
                    {getStatusBadge(s.ticker, pipelineStatus)}
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link
                    to={`/stock/${s.ticker}`}
                    className="hover:text-blue-400 transition-colors"
                  >
                    <p className="font-medium text-content-primary group-hover:text-blue-400 transition-colors">
                      {s.name}
                    </p>
                    <p className="text-xs text-content-tertiary">{s.ticker}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-content-secondary text-xs hidden lg:table-cell">{s.sector}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono font-semibold text-content-primary">{s.score?.toFixed(3)}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-content-secondary">
                  {s.per?.toFixed(1) ?? "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-content-secondary hidden md:table-cell">
                  {s.pbr?.toFixed(2) ?? "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <FactorGrade score={s.value_s} />
                </td>
                <td className="px-4 py-3 text-center">
                  <FactorGrade score={s.quality_s} />
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <FactorGrade score={s.growth_s} />
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <FactorGrade score={s.momentum_s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderCell({
  label,
  sortKey,
  onSort,
  SortIcon,
  align,
  className = "",
}: {
  label: string;
  sortKey: string;
  sort?: SortConfig;
  onSort: (key: string) => void;
  SortIcon: React.FC<{ columnKey: string }>;
  align: "left" | "right" | "center";
  className?: string;
}) {
  const alignClass = align === "right" ? "text-right justify-end" : align === "center" ? "text-center justify-center" : "text-left";
  return (
    <th className={`px-4 py-3 font-medium ${className}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-content-primary transition-colors ${alignClass}`}
      >
        {label}
        <SortIcon columnKey={sortKey} />
      </button>
    </th>
  );
}

function RankBadge({ rank }: { rank: number }) {
  let colorClasses: string;
  if (rank <= 3) {
    colorClasses = "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30";
  } else if (rank <= 10) {
    colorClasses = "bg-blue-500/15 text-blue-400";
  } else {
    colorClasses = "bg-surface-hover text-content-secondary";
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold font-mono ${colorClasses}`}
    >
      {rank}
    </span>
  );
}
