import type { MarketResponse } from "../types";
import {
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface MarketRiskProps {
  market: MarketResponse | null;
}

const seasonConfig: Record<string, { icon: React.ReactNode; label: string; gradient: string; textColor: string }> = {
  spring: {
    icon: <Flower2 className="h-5 w-5" />,
    label: "봄 (회복국면)",
    gradient: "from-pink-500/20 to-pink-400/5",
    textColor: "text-pink-400",
  },
  summer: {
    icon: <Sun className="h-5 w-5" />,
    label: "여름 (성장국면)",
    gradient: "from-yellow-500/20 to-yellow-400/5",
    textColor: "text-yellow-400",
  },
  autumn: {
    icon: <Leaf className="h-5 w-5" />,
    label: "가을 (과열국면)",
    gradient: "from-orange-500/20 to-orange-400/5",
    textColor: "text-orange-400",
  },
  winter: {
    icon: <Snowflake className="h-5 w-5" />,
    label: "겨울 (침체국면)",
    gradient: "from-blue-500/20 to-blue-400/5",
    textColor: "text-blue-400",
  },
};

function mapSeason(raw: string | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("봄") || lower.includes("spring") || lower.includes("q1")) return "spring";
  if (lower.includes("여름") || lower.includes("summer") || lower.includes("q2")) return "summer";
  if (lower.includes("가을") || lower.includes("autumn") || lower.includes("q3")) return "autumn";
  if (lower.includes("겨울") || lower.includes("winter") || lower.includes("q4")) return "winter";
  return null;
}

function getActionBadge(action: { text: string; grade: string } | null | undefined) {
  if (!action) return null;
  const grade = action.grade;
  const text = action.text;
  if (grade === "aggressive" || grade === "accumulate")
    return { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: text };
  if (grade === "normal" || grade === "neutral")
    return { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: text };
  if (grade === "caution" || grade === "reduce")
    return { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: text };
  if (grade === "danger" || grade === "high_risk")
    return { color: "bg-red-500/15 text-red-400 border-red-500/30", label: text };
  return { color: "bg-slate-500/15 text-slate-400 border-slate-500/30", label: text };
}

export function MarketRisk({ market }: MarketRiskProps) {
  if (!market) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-content-tertiary" />
          <h2 className="text-base font-semibold text-content-primary">시장 위험 지표</h2>
        </div>
        <p className="text-sm text-content-tertiary">데이터 준비 중...</p>
      </div>
    );
  }

  const credit = market.credit;
  const hy = credit?.hy;
  const kr = credit?.kr;
  const vix = credit?.vix;
  const seasonKey = mapSeason(hy?.season) ?? mapSeason(credit?.concordance ?? undefined);
  const season = seasonKey ? seasonConfig[seasonKey] : null;
  const actionBadge = getActionBadge(credit?.action ?? null);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-content-tertiary" />
          <h2 className="text-base font-semibold text-content-primary">시장 위험 지표</h2>
        </div>
        {actionBadge && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${actionBadge.color}`}>
            <ShieldAlert className="h-3.5 w-3.5" />
            {actionBadge.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Season */}
        {season && (
          <div className={`rounded-xl p-4 bg-gradient-to-br ${season.gradient} border border-white/5`}>
            <div className={`flex items-center gap-2 mb-2 ${season.textColor}`}>
              {season.icon}
              <span className="text-xs font-medium">사계절 지표</span>
            </div>
            <p className={`text-xl font-bold ${season.textColor}`}>{season.label}</p>
            {hy?.q_days != null && hy.q_days > 0 && (
              <p className="text-xs text-content-tertiary mt-1">{hy.q_days}일째 유지</p>
            )}
          </div>
        )}

        {/* VIX */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-violet-500/15 to-violet-400/5 border border-white/5">
          <div className="flex items-center gap-2 mb-2 text-violet-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">VIX</span>
          </div>
          {vix?.value != null ? (
            <>
              <p className="text-2xl font-bold font-mono text-violet-300">{vix.value.toFixed(1)}</p>
              <div className="flex items-center gap-2 mt-1">
                {vix.percentile != null && (
                  <span className="text-xs text-content-tertiary">
                    {vix.percentile.toFixed(0)}th 퍼센타일
                  </span>
                )}
                {vix.regime_label && (
                  <span className="text-[10px] text-violet-400/70">{vix.regime_label}</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-content-tertiary">-</p>
          )}
        </div>

        {/* HY Spread */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-cyan-500/15 to-cyan-400/5 border border-white/5">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <span className="text-xs font-medium">HY 스프레드</span>
          </div>
          {hy?.value != null ? (
            <>
              <p className="text-2xl font-bold font-mono text-cyan-300">{hy.value.toFixed(2)}%</p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    hy.value < 4 ? "bg-emerald-400" : hy.value < 6 ? "bg-amber-400" : "bg-red-400"
                  }`}
                />
                <span className="text-xs text-content-tertiary">
                  {hy.value < 4 ? "안정" : hy.value < 6 ? "주의" : "경계"}
                  {hy.median != null && ` (중앙값 ${hy.median.toFixed(2)}%)`}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-content-tertiary">-</p>
          )}
        </div>

        {/* BBB- / KR */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-slate-500/15 to-slate-400/5 border border-white/5">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <span className="text-xs font-medium">BBB- 금리</span>
          </div>
          {kr?.spread != null ? (
            <>
              <p className="text-2xl font-bold font-mono text-slate-300">{kr.spread.toFixed(2)}%p</p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    kr.spread < 8 ? "bg-emerald-400" : kr.spread < 10 ? "bg-amber-400" : "bg-red-400"
                  }`}
                />
                <span className="text-xs text-content-tertiary">
                  {kr.regime_label || (kr.spread < 8 ? "안정" : kr.spread < 10 ? "주의" : "위험")}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-content-tertiary">-</p>
          )}
        </div>
      </div>

      {/* Index cards */}
      {market.indices && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <IndexCard label="KOSPI" data={market.indices.kospi} />
          <IndexCard label="KOSDAQ" data={market.indices.kosdaq} />
        </div>
      )}

      {/* Warnings */}
      {market.warnings && market.warnings.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">시장 경고</span>
          </div>
          <ul className="space-y-0.5">
            {market.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-300/80">{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IndexCard({ label, data }: { label: string; data: { close: number | null; change_pct: number | null } | null }) {
  if (!data || data.close == null) {
    return (
      <div className="rounded-lg p-3 bg-surface-hover border border-border">
        <span className="text-xs text-content-tertiary">{label}</span>
        <p className="text-lg font-bold font-mono text-content-secondary mt-1">-</p>
      </div>
    );
  }
  const isPositive = (data.change_pct ?? 0) >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const changeColor = isPositive ? "text-positive" : "text-negative";

  return (
    <div className="rounded-lg p-3 bg-surface-hover border border-border">
      <span className="text-xs text-content-tertiary">{label}</span>
      <div className="flex items-end justify-between mt-1">
        <p className="text-lg font-bold font-mono text-content-primary">
          {data.close.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}
        </p>
        {data.change_pct != null && (
          <div className={`flex items-center gap-1 ${changeColor}`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="text-sm font-mono font-semibold">
              {isPositive ? "+" : ""}{data.change_pct.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
