import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { RankingData } from "../types";
import { TopStocksTable } from "../components/TopStocksTable";
import { Calendar, ChevronDown, ListOrdered } from "lucide-react";

export function Rankings() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDates().then(({ dates }) => {
      setDates(dates);
      if (dates.length > 0) setSelectedDate(dates[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    api
      .getRanking(selectedDate)
      .then(setRanking)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const formatDate = (d: string) =>
    `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListOrdered className="h-6 w-6 text-content-tertiary" />
          <h1 className="text-2xl font-bold text-content-primary">순위표</h1>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-content-tertiary" />
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="appearance-none text-sm px-3 py-1.5 pr-8 rounded-lg bg-surface-card border border-border text-content-primary focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 outline-none cursor-pointer"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-tertiary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Metadata summary */}
      {ranking?.metadata && (
        <div className="flex items-center gap-4 text-xs text-content-tertiary">
          <span>
            유니버스: <span className="font-mono font-semibold text-content-secondary">{ranking.metadata.total_universe}</span>
          </span>
          <span className="text-border">|</span>
          <span>
            사전필터: <span className="font-mono font-semibold text-content-secondary">{ranking.metadata.prefilter_passed}</span>
          </span>
          <span className="text-border">|</span>
          <span>
            스코어링: <span className="font-mono font-semibold text-content-secondary">{ranking.metadata.scored_count}</span>
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-content-tertiary">데이터 로딩 중...</span>
          </div>
        </div>
      ) : ranking ? (
        <TopStocksTable
          stocks={ranking.rankings.slice(0, 30)}
          title={`${formatDate(ranking.date)} Top 30`}
        />
      ) : (
        <div className="card p-8 text-center">
          <p className="text-content-tertiary">데이터 없음</p>
        </div>
      )}
    </div>
  );
}
