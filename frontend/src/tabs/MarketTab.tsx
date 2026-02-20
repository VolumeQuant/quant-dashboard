import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { MarketResponse, RankingData, PipelineResponse } from "../types";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

export function MarketTab() {
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMarket(), api.getLatestRanking(), api.getPipeline()])
      .then(([m, r, p]) => { setMarket(m); setRanking(r); setPipeline(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );
  }

  const credit = market?.credit;
  const hy = credit?.hy;
  const vix = credit?.vix;
  const kr = credit?.kr;
  const action = credit?.action;
  const formatDate = (d: string) => `${d.slice(0, 4)}년 ${d.slice(4, 6)}월 ${d.slice(6, 8)}일`;

  // Season
  type SeasonKey = "봄" | "여름" | "가을" | "겨울";
  const seasonMap: Record<SeasonKey, { icon: string; gradient: string; color: string; textColor: string }> = {
    "봄": { icon: "🌸", gradient: "from-pink-500/8", color: "var(--season-spring)", textColor: "text-pink-300" },
    "여름": { icon: "☀️", gradient: "from-amber-500/8", color: "var(--season-summer)", textColor: "text-amber-300" },
    "가을": { icon: "🍂", gradient: "from-orange-500/8", color: "var(--season-autumn)", textColor: "text-orange-300" },
    "겨울": { icon: "❄️", gradient: "from-blue-500/8", color: "var(--season-winter)", textColor: "text-blue-300" },
  };
  const seasonRaw = hy?.season ?? "";
  const seasonKey = (Object.keys(seasonMap) as SeasonKey[]).find((k) => seasonRaw.includes(k));
  const season = seasonKey ? seasonMap[seasonKey] : null;

  // Signals
  const signals: { label: string; ok: boolean }[] = [];
  if (hy?.value != null) signals.push({ label: "HY", ok: hy.value < 4 });
  if (kr?.spread != null) signals.push({ label: "KR", ok: kr.spread < 8 });
  if (vix?.value != null) signals.push({ label: "VIX", ok: vix.value < 25 });

  // Sectors
  const sectorCounts: Record<string, number> = {};
  ranking?.rankings.slice(0, 30).forEach((s) => {
    if (s.sector) sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;
  });
  const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* Date */}
      <p className="text-xs text-slate-500">
        📅 {ranking ? formatDate(ranking.date) : market?.date ? formatDate(market.date) : ""} 기준
      </p>

      {/* Hero: Market Pulse */}
      <div className="card relative overflow-hidden p-5 sm:p-6 animate-slide-up">
        {/* Season gradient overlay */}
        {season && (
          <div className={`absolute inset-0 bg-gradient-to-br ${season.gradient} via-transparent to-transparent pointer-events-none`} />
        )}

        <div className="relative">
          {/* Season + Action */}
          <div className="flex items-start justify-between mb-5">
            <div>
              {season && (
                <div className={`flex items-center gap-2 mb-2 ${season.textColor}`}>
                  <span className="text-3xl">{season.icon}</span>
                  <div>
                    <p className="text-lg font-bold">{seasonKey} ({seasonRaw.replace(seasonKey!, "").replace(/[()]/g, "").trim() || "국면"})</p>
                    {hy?.q_days != null && hy.q_days > 0 && (
                      <p className="text-xs text-slate-400">{hy.q_days}일째 유지</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Signal dots */}
            <div className="flex items-center gap-2">
              {signals.map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                    s.ok
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-red-500/15 border-red-500/30"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    s.ok ? "bg-emerald-400 glow-green" : "bg-red-400 glow-red"
                  }`} />
                  <span className={`text-[10px] font-bold tracking-wider ${
                    s.ok ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action text */}
          {action && (
            <div className="mb-5 p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
              <p className="text-sm font-medium text-slate-200">
                → {action.text}
              </p>
            </div>
          )}

          {/* 3-column detail grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* HY Spread */}
            <div className="bg-surface-elevated rounded-lg p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">🏦 HY 스프레드</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-100">
                {hy?.value != null ? `${hy.value.toFixed(2)}%` : "-"}
              </p>
              {hy?.median != null && (
                <p className="text-[11px] text-slate-500 mt-1">
                  중앙값 {hy.median.toFixed(2)}% · {hy.value! < hy.median ? "평균 이하 (안정)" : "평균 이상 (주의)"}
                </p>
              )}
            </div>

            {/* VIX */}
            <div className="bg-surface-elevated rounded-lg p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">⚡ VIX</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-100">
                {vix?.value != null ? vix.value.toFixed(1) : "-"}
              </p>
              {vix?.percentile != null && (
                <>
                  <p className="text-[11px] text-slate-500 mt-1">
                    1년 중 {vix.percentile.toFixed(0)}번째 · {vix.regime_label || ""}
                  </p>
                  {/* VIX percentile bar */}
                  <div className="mt-2 relative h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-[10%] bg-amber-500/20" />
                    <div className="absolute inset-y-0 left-[10%] w-[57%] bg-emerald-500/20" />
                    <div className="absolute inset-y-0 left-[67%] w-[13%] bg-amber-500/20" />
                    <div className="absolute inset-y-0 left-[80%] w-[10%] bg-orange-500/20" />
                    <div className="absolute inset-y-0 left-[90%] w-[10%] bg-red-500/20" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-400 shadow-lg"
                      style={{ left: `${Math.min(vix.percentile, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Indices */}
            <div className="bg-surface-elevated rounded-lg p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">📈 지수</p>
              <div className="space-y-2">
                <IndexLine label="코스피" data={market?.indices?.kospi ?? null} />
                <IndexLine label="코스닥" data={market?.indices?.kosdaq ?? null} />
              </div>
              {kr?.spread != null && (
                <div className="mt-2 pt-2 border-t border-border-subtle">
                  <p className="text-[11px] text-slate-500">
                    🇰🇷 BBB- {kr.spread.toFixed(1)}%p · {kr.regime_label || (kr.spread < 8 ? "정상" : "주의")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      {ranking?.metadata && (
        <div className="card p-4 animate-slide-up-delay-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h3 className="text-sm font-semibold text-slate-100">선정 파이프라인</h3>
          </div>
          <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap text-sm">
            <FunnelStep value={ranking.metadata.total_universe} label="유니버스" />
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <FunnelStep value={ranking.metadata.prefilter_passed} label="사전필터" />
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <FunnelStep value={ranking.metadata.scored_count} label="스코어링" />
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <FunnelStep value={30} label="Top 30" highlight />
            {pipeline && (
              <>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-xs text-slate-500">
                  ✅{pipeline.verified.length} ⏳{pipeline.pending.length} 🆕{pipeline.new_entry.length}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sector Distribution */}
      {sortedSectors.length > 0 && (
        <div className="card p-4 animate-slide-up-delay-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h3 className="text-sm font-semibold text-slate-100">주도 업종</h3>
            <span className="text-xs text-slate-500">Top 30 기준</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-1 gap-y-1 text-sm">
            {sortedSectors.map(([sec, cnt], i) => (
              <span key={sec} className="flex items-center gap-1">
                <span className="text-slate-300 font-medium">{sec}</span>
                <span className="text-xs font-mono font-bold tabular-nums text-emerald-400">{cnt}</span>
                {i < sortedSectors.length - 1 && <span className="text-slate-700 mx-0.5">·</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {market?.warnings && market.warnings.length > 0 && (
        <div className="card p-4 border-amber-500/30 animate-slide-up-delay-3">
          <p className="text-xs font-bold text-amber-400 mb-1">⚠️ 시장 경고</p>
          {market.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-300/80">{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function IndexLine({ label, data }: { label: string; data: { close: number | null; change_pct: number | null } | null }) {
  if (!data?.close) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm font-mono text-slate-600">-</span>
      </div>
    );
  }
  const positive = (data.change_pct ?? 0) >= 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold font-mono tabular-nums text-slate-100">
          {data.close.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}
        </span>
        <span className={`flex items-center gap-0.5 text-xs font-mono font-semibold tabular-nums ${
          positive ? "text-emerald-400" : "text-red-400"
        }`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {positive ? "+" : ""}{data.change_pct?.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function FunnelStep({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`text-sm font-bold font-mono tabular-nums ${highlight ? "text-emerald-400" : "text-slate-200"}`}>
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}
