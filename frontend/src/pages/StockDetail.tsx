import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { StockHistory } from "../types";
import { FactorGradeCard } from "../components/FactorGrade";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { ArrowLeft, TrendingUp, BarChart3 } from "lucide-react";

export function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticker) return;
    api
      .getStockHistory(ticker)
      .then((d) => setHistory(d.history))
      .catch(() => setError("종목 데이터를 찾을 수 없습니다"))
      .finally(() => setLoading(false));
  }, [ticker]);

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

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-content-tertiary mb-3">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Link>
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

  // Factor data for radar chart
  // Normalize values to 0-100 scale for radar display
  const normalizeScore = (val: number | null) => {
    if (val == null) return 0;
    // Clamp to [-3, 3] and map to [0, 100]
    const clamped = Math.max(-3, Math.min(3, val));
    return Math.round(((clamped + 3) / 6) * 100);
  };

  const radarData = latest
    ? [
        { factor: "Value", value: normalizeScore(latest.value_s), fullMark: 100 },
        { factor: "Quality", value: normalizeScore(latest.quality_s), fullMark: 100 },
        { factor: "Growth", value: normalizeScore(latest.growth_s), fullMark: 100 },
        { factor: "Momentum", value: normalizeScore(latest.momentum_s), fullMark: 100 },
      ]
    : [];

  const factorInfos = latest
    ? [
        {
          label: "Value",
          labelKr: "가치",
          score: latest.value_s,
          color: "var(--factor-value)",
        },
        {
          label: "Quality",
          labelKr: "퀄리티",
          score: latest.quality_s,
          color: "var(--factor-quality)",
        },
        {
          label: "Growth",
          labelKr: "성장",
          score: latest.growth_s,
          color: "var(--factor-growth)",
        },
        {
          label: "Momentum",
          labelKr: "모멘텀",
          score: latest.momentum_s,
          color: "var(--factor-momentum)",
        },
      ]
    : [];

  // Rank delta
  const prevRank = history.length >= 2 ? history[history.length - 2].composite_rank : null;
  const rankDelta = prevRank != null && latest ? prevRank - latest.composite_rank : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-xl bg-surface-card border border-border hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-content-secondary" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-content-primary">{ticker}</h1>
            {latest && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400">
                {latest.composite_rank}위
              </span>
            )}
            {rankDelta != null && rankDelta !== 0 && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  rankDelta > 0
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {rankDelta > 0 ? `+${rankDelta}` : rankDelta}
              </span>
            )}
          </div>
          {latest && (
            <p className="text-sm text-content-tertiary mt-0.5">
              총점{" "}
              <span className="font-mono font-semibold text-content-secondary">
                {latest.score.toFixed(3)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Factor Grade Cards */}
      {factorInfos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {factorInfos.map((f) => (
            <FactorGradeCard
              key={f.label}
              label={f.label}
              labelKr={f.labelKr}
              score={f.score}
              color={f.color}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-content-tertiary" />
              <h3 className="text-sm font-medium text-content-secondary">팩터 레이더</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid
                  stroke="var(--border-default)"
                  gridType="polygon"
                />
                <PolarAngleAxis
                  dataKey="factor"
                  tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                  axisLine={false}
                />
                <Radar
                  name="팩터 점수"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Rank Trajectory */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-content-tertiary" />
            <h3 className="text-sm font-medium text-content-secondary">순위 변동</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rankData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={{ stroke: "var(--border-default)" }}
                tickLine={{ stroke: "var(--border-default)" }}
              />
              <YAxis
                reversed
                domain={[1, "auto"]}
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={{ stroke: "var(--border-default)" }}
                tickLine={{ stroke: "var(--border-default)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                formatter={(v: number | undefined) => [
                  `${v ?? "-"}위`,
                  "순위",
                ]}
              />
              <Line
                type="monotone"
                dataKey="rank"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score History */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-content-tertiary" />
          <h3 className="text-sm font-medium text-content-secondary">총점 변동</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={rankData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
              axisLine={{ stroke: "var(--border-default)" }}
              tickLine={{ stroke: "var(--border-default)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
              axisLine={{ stroke: "var(--border-default)" }}
              tickLine={{ stroke: "var(--border-default)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "var(--text-primary)" }}
              formatter={(v: number | undefined) => [
                v != null ? v.toFixed(3) : "-",
                "총점",
              ]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#8b5cf6" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Factor Score History (if multiple data points) */}
      {history.length > 1 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-content-tertiary" />
            <h3 className="text-sm font-medium text-content-secondary">팩터 점수 변동</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={history.map((h) => ({
                date: formatDate(h.date),
                Value: h.value_s,
                Quality: h.quality_s,
                Growth: h.growth_s,
                Momentum: h.momentum_s,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={{ stroke: "var(--border-default)" }}
                tickLine={{ stroke: "var(--border-default)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={{ stroke: "var(--border-default)" }}
                tickLine={{ stroke: "var(--border-default)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                formatter={((v: number | null | undefined) => [
                  v != null ? v.toFixed(3) : "-",
                ]) as never}
              />
              <Line type="monotone" dataKey="Value" stroke="var(--factor-value)" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="Quality" stroke="var(--factor-quality)" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="Growth" stroke="var(--factor-growth)" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="Momentum" stroke="var(--factor-momentum)" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-3">
            <LegendItem label="Value" color="var(--factor-value)" />
            <LegendItem label="Quality" color="var(--factor-quality)" />
            <LegendItem label="Growth" color="var(--factor-growth)" />
            <LegendItem label="Momentum" color="var(--factor-momentum)" />
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-content-tertiary">{label}</span>
    </div>
  );
}
