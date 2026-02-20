import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { StockHistory } from "../types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { ArrowLeft } from "lucide-react";

export function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) return;
    api.getStockHistory(ticker)
      .then((d) => setHistory(d.history))
      .catch(() => setError("종목 데이터를 찾을 수 없습니다"))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error}</p>
        <Link to="/" className="text-blue-500 text-sm mt-2 inline-block">돌아가기</Link>
      </div>
    );
  }

  const latest = history[history.length - 1];
  const formatDate = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}`;

  const rankData = history.map((h) => ({
    date: formatDate(h.date),
    rank: h.composite_rank,
    score: h.score,
  }));

  const factorData = latest ? [
    { name: "Value", value: latest.value_s ?? 0 },
    { name: "Quality", value: latest.quality_s ?? 0 },
    { name: "Growth", value: latest.growth_s ?? 0 },
    { name: "Momentum", value: latest.momentum_s ?? 0 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticker}</h1>
          {latest && <p className="text-sm text-gray-500">현재 {latest.composite_rank}위 · 총점 {latest.score.toFixed(3)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rank Trajectory */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">순위 변동</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={rankData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis reversed domain={[1, "auto"]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number | undefined) => [`${v ?? "-"}위`, "순위"]} />
              <Line type="monotone" dataKey="rank" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Factor Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-4">팩터 점수</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={factorData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip formatter={(v: number | undefined) => [v != null ? v.toFixed(3) : "-", "점수"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {factorData.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score History */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">총점 변동</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={rankData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number | undefined) => [v != null ? v.toFixed(3) : "-", "총점"]} />
            <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
