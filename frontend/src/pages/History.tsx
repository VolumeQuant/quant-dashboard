import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import type { AllHistoryResponse } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { History as HistoryIcon, X } from "lucide-react";

const LINE_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#14b8a6",
];

type Timeframe = "all" | "7d" | "14d" | "30d";

export function History() {
  const [data, setData] = useState<AllHistoryResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>("all");

  useEffect(() => {
    api
      .getAllHistory()
      .then((d) => {
        setData(d);
        // Default: top 5 stocks by latest rank
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

  const filteredDates = useMemo(() => {
    if (!data) return [];
    const allDates = data.dates;
    if (timeframe === "all") return allDates;
    const n = timeframe === "7d" ? 7 : timeframe === "14d" ? 14 : 30;
    return allDates.slice(-n);
  }, [data, timeframe]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return filteredDates.map((date) => {
      const point: Record<string, string | number> = {
        date: `${date.slice(4, 6)}/${date.slice(6, 8)}`,
      };
      for (const ticker of selected) {
        const stock = data.stocks[ticker];
        if (!stock) continue;
        const entry = stock.history.find((h) => h.date === date);
        if (entry) point[ticker] = entry.composite_rank;
      }
      return point;
    });
  }, [data, filteredDates, selected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-content-tertiary">데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-content-tertiary">데이터 없음</p>
      </div>
    );
  }

  const toggleTicker = (ticker: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const selectedArray = Array.from(selected);

  const timeframes: { value: Timeframe; label: string }[] = [
    { value: "7d", label: "7일" },
    { value: "14d", label: "14일" },
    { value: "30d", label: "30일" },
    { value: "all", label: "전체" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HistoryIcon className="h-6 w-6 text-content-tertiary" />
          <h1 className="text-2xl font-bold text-content-primary">순위 변동 추이</h1>
        </div>
        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-surface-card rounded-lg border border-border p-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timeframe === tf.value
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-content-tertiary hover:text-content-secondary"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected chips */}
      {selectedArray.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-content-tertiary">선택됨:</span>
          {selectedArray.map((ticker, i) => {
            const stock = data.stocks[ticker];
            return (
              <button
                key={ticker}
                onClick={() => toggleTicker(ticker)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                style={{
                  borderColor: LINE_COLORS[i % LINE_COLORS.length] + "50",
                  color: LINE_COLORS[i % LINE_COLORS.length],
                  backgroundColor: LINE_COLORS[i % LINE_COLORS.length] + "15",
                }}
              >
                {stock?.name ?? ticker}
                <X className="h-3 w-3" />
              </button>
            );
          })}
          {selectedArray.length > 1 && (
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-content-tertiary hover:text-red-400 transition-colors"
            >
              전체 해제
            </button>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="card p-5">
        {selectedArray.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-content-tertiary">
            <p className="text-sm">아래에서 종목을 선택하세요</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={{ stroke: "var(--border-default)" }}
                tickLine={{ stroke: "var(--border-default)" }}
              />
              <YAxis
                reversed
                domain={[1, 30]}
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={{ stroke: "var(--border-default)" }}
                tickLine={{ stroke: "var(--border-default)" }}
                label={{
                  value: "순위",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "var(--text-tertiary)", fontSize: 11 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                formatter={(value: number | undefined, name: string | undefined) => {
                  if (value == null) return ["-", name ?? ""];
                  const stock = name ? data.stocks[name] : undefined;
                  return [`${value}위`, stock?.name ?? name ?? ""];
                }}
              />
              {selectedArray.map((ticker, i) => (
                <Line
                  key={ticker}
                  type="monotone"
                  dataKey={ticker}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length] }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  name={ticker}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stock Selector */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-content-secondary mb-3">
          종목 선택 (클릭하여 토글)
        </h3>
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
              const colorIdx = isSelected ? selectedArray.indexOf(ticker) : -1;
              return (
                <button
                  key={ticker}
                  onClick={() => toggleTicker(ticker)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? "ring-1"
                      : "bg-surface-hover text-content-tertiary hover:text-content-secondary hover:bg-surface-elevated"
                  }`}
                  style={
                    isSelected && colorIdx >= 0
                      ? {
                          color: LINE_COLORS[colorIdx % LINE_COLORS.length],
                          backgroundColor: LINE_COLORS[colorIdx % LINE_COLORS.length] + "15",
                          borderColor: LINE_COLORS[colorIdx % LINE_COLORS.length] + "40",
                          boxShadow: `0 0 0 1px ${LINE_COLORS[colorIdx % LINE_COLORS.length]}40`,
                        }
                      : undefined
                  }
                >
                  {lastRank && (
                    <span className="font-mono font-bold">{lastRank}.</span>
                  )}
                  {stock.name}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
