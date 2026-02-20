import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AllHistoryResponse } from "../types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { History as HistoryIcon } from "lucide-react";

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

export function History() {
  const [data, setData] = useState<AllHistoryResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllHistory()
      .then((d) => {
        setData(d);
        // 기본: Top 5 종목 선택
        const tickers = Object.entries(d.stocks)
          .sort((a, b) => {
            const aLast = a[1].history[a[1].history.length - 1]?.composite_rank ?? 999;
            const bLast = b[1].history[b[1].history.length - 1]?.composite_rank ?? 999;
            return aLast - bLast;
          })
          .slice(0, 5)
          .map(([t]) => t);
        setSelected(new Set(tickers));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">데이터 없음</p>;

  const formatDate = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}`;

  // 차트 데이터 변환
  const chartData = data.dates.map((date) => {
    const point: Record<string, string | number> = { date: formatDate(date) };
    for (const ticker of selected) {
      const stock = data.stocks[ticker];
      if (!stock) continue;
      const entry = stock.history.find((h) => h.date === date);
      if (entry) point[ticker] = entry.composite_rank;
    }
    return point;
  });

  const toggleTicker = (ticker: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const selectedArray = Array.from(selected);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <HistoryIcon className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">순위 변동 추이</h1>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis reversed domain={[1, 30]} tick={{ fontSize: 12 }} label={{ value: "순위", angle: -90, position: "insideLeft" }} />
            <Tooltip
              formatter={((value: number | undefined, name: string | undefined) => {
                if (value == null) return ["-", name ?? ""];
                const stock = name ? data.stocks[name] : undefined;
                return [`${value}위`, stock?.name ?? name ?? ""];
              }) as never}
            />
            <Legend
              formatter={(value: string) => {
                const stock = data.stocks[value];
                return stock?.name ?? value;
              }}
            />
            {selectedArray.map((ticker, i) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stock Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">종목 선택 (클릭하여 토글)</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.stocks)
            .sort((a, b) => {
              const aLast = a[1].history[a[1].history.length - 1]?.composite_rank ?? 999;
              const bLast = b[1].history[b[1].history.length - 1]?.composite_rank ?? 999;
              return aLast - bLast;
            })
            .map(([ticker, stock]) => {
              const isSelected = selected.has(ticker);
              const lastRank = stock.history[stock.history.length - 1]?.composite_rank;
              return (
                <button
                  key={ticker}
                  onClick={() => toggleTicker(ticker)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-100 text-blue-800 ring-1 ring-blue-300"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {lastRank && <span className="font-bold">{lastRank}.</span>}
                  {stock.name}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
