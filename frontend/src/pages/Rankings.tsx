import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { RankingData } from "../types";
import { TopStocksTable } from "../components/TopStocksTable";
import { Calendar } from "lucide-react";

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
    api.getRanking(selectedDate)
      .then(setRanking)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const formatDate = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">순위표</h1>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {dates.map((d) => (
              <option key={d} value={d}>{formatDate(d)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : ranking ? (
        <TopStocksTable stocks={ranking.rankings.slice(0, 30)} title={`${formatDate(ranking.date)} Top 30`} />
      ) : (
        <p className="text-gray-500">데이터 없음</p>
      )}
    </div>
  );
}
