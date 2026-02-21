import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import type {
  RankingData, PicksResponse, DeathListResponse, MarketResponse,
  PipelineResponse, AIResponse, Stock, HYData, KRData, VIXData,
  SortConfig, SortDirection,
} from "../types";
import {
  ChevronRight, TrendingUp, TrendingDown,
  ArrowUp, ArrowDown, ArrowUpDown, ArrowDownRight,
  ShieldCheck, AlertTriangle, Bot,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   Dashboard — single-page layout (US-style)
   ═══════════════════════════════════════════════════ */

export default function Dashboard() {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [picks, setPicks] = useState<PicksResponse | null>(null);
  const [deathList, setDeathList] = useState<DeathListResponse | null>(null);
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [ai, setAi] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLatestRanking(),
      api.getPicks(),
      api.getDeathList(),
      api.getMarket(),
      api.getPipeline(),
      api.getAI(),
    ])
      .then(([r, p, d, m, pl, a]) => {
        setRanking(r); setPicks(p); setDeathList(d);
        setMarket(m); setPipeline(pl); setAi(a);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  const credit = market?.credit;
  const hy = credit?.hy ?? null;
  const vix = credit?.vix ?? null;
  const kr = credit?.kr ?? null;
  const action = credit?.action ?? null;

  // Season
  type SeasonKey = "봄" | "여름" | "가을" | "겨울";
  const seasonMap: Record<SeasonKey, {
    icon: string; gradient: string; bgClass: string;
    borderClass: string; textColor: string;
  }> = {
    "봄":  { icon: "🌸", gradient: "from-pink-500/8",   bgClass: "bg-pink-500/10",   borderClass: "border-pink-500/20",   textColor: "text-pink-300" },
    "여름": { icon: "☀️", gradient: "from-amber-500/8",  bgClass: "bg-amber-500/10",  borderClass: "border-amber-500/20",  textColor: "text-amber-300" },
    "가을": { icon: "🍂", gradient: "from-orange-500/8", bgClass: "bg-orange-500/10", borderClass: "border-orange-500/20", textColor: "text-orange-300" },
    "겨울": { icon: "❄️", gradient: "from-blue-500/8",   bgClass: "bg-blue-500/10",   borderClass: "border-blue-500/20",   textColor: "text-blue-300" },
  };
  const seasonRaw = hy?.season ?? "";
  const seasonKey = (Object.keys(seasonMap) as SeasonKey[]).find((k) => seasonRaw.includes(k));
  const season = seasonKey ? seasonMap[seasonKey] : null;

  const signals: { label: string; ok: boolean }[] = [];
  if (hy?.value != null) signals.push({ label: "HY", ok: hy.value < 4 });
  if (kr?.spread != null) signals.push({ label: "KR", ok: kr.spread < 8 });
  if (vix?.value != null) signals.push({ label: "VIX", ok: vix.value < 25 });

  const formatDate = (d: string) => `${d.slice(0, 4)}년 ${d.slice(4, 6)}월 ${d.slice(6, 8)}일`;

  return (
    <div className="space-y-8">
      {/* ─── Sticky Banner ─── */}
      <div className={`sticky top-14 z-40 border rounded-lg px-4 py-2 backdrop-blur-sm ${
        season ? `${season.bgClass} ${season.borderClass}` : "bg-slate-500/10 border-slate-500/20"
      }`}>
        <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
          {season && (
            <span className={`font-semibold ${season.textColor}`}>
              {season.icon} {seasonKey}
              {hy?.q_days != null && hy.q_days > 0 && (
                <span className="text-slate-500 ml-1 text-xs">{hy.q_days}일째</span>
              )}
            </span>
          )}
          {signals.length > 0 && (
            <>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <div className="flex gap-2">
                {signals.map((s) => (
                  <div key={s.label} className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
                    s.ok ? "bg-emerald-500/15 border-emerald-500/30" : "bg-red-500/15 border-red-500/30"
                  }`}>
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
            </>
          )}
          {action && (
            <>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-300 font-medium truncate max-w-[200px] sm:max-w-none text-xs">
                → {action.text}
              </span>
            </>
          )}
          {pipeline && (
            <>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-emerald-400 font-medium whitespace-nowrap text-xs">
                ✅ {pipeline.verified.length}종목 검증
              </span>
            </>
          )}
        </div>
      </div>

      {/* ─── Date ─── */}
      <p className="text-xs text-slate-500">
        📅 {ranking ? formatDate(ranking.date) : market?.date ? formatDate(market.date) : ""} 기준
      </p>

      {/* ─── ACT 1: Market Pulse Hero ─── */}
      <div className="animate-slide-up" style={{ animationDelay: "0ms" }}>
        <MarketPulseSection
          market={market} season={season} seasonKey={seasonKey}
          seasonRaw={seasonRaw} hy={hy} vix={vix} kr={kr} action={action}
          signals={signals}
        />
      </div>

      {/* ─── Market Warnings ─── */}
      {market?.warnings && market.warnings.length > 0 && (
        <div className="animate-slide-up border border-amber-500/30 bg-amber-500/10 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {market.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-300 leading-relaxed">{w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── ACT 2: Pipeline Stats ─── */}
      <div className="animate-slide-up" style={{ animationDelay: "100ms", opacity: 0 }}>
        <PipelineSection ranking={ranking} pipeline={pipeline} />
      </div>

      {/* ─── ACT 3: Main Content — 3 + 1 Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 animate-slide-up" style={{ animationDelay: "200ms", opacity: 0 }}>
          <RankingSection ranking={ranking} pipeline={pipeline} />
        </div>
        <div className="space-y-6 animate-slide-in" style={{ animationDelay: "300ms", opacity: 0 }}>
          <PicksSection picks={picks} market={market} />
          <DeathListSection deathList={deathList} />
          <AISection ai={ai} />
          <SectorSection ranking={ranking} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACT 1 — Market Pulse Hero
   ═══════════════════════════════════════════════════ */

function MarketPulseSection({ market, season, seasonKey, seasonRaw, hy, vix, kr, action, signals }: {
  market: MarketResponse | null;
  season: { icon: string; gradient: string; textColor: string } | null;
  seasonKey: string | undefined;
  seasonRaw: string;
  hy: HYData | null; vix: VIXData | null; kr: KRData | null;
  action: { text: string; grade: string } | null;
  signals: { label: string; ok: boolean }[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-default">
      {season && (
        <div className={`absolute inset-0 bg-gradient-to-br ${season.gradient} via-transparent to-transparent pointer-events-none`} />
      )}

      <div className="relative p-5 sm:p-6">
        {/* Top: Season + Signal dots */}
        <div className="flex items-start justify-between mb-5">
          <div>
            {season && (
              <div className={`flex items-center gap-3 ${season.textColor}`}>
                <span className="text-4xl leading-none">{season.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">
                    {seasonKey} ({seasonRaw.replace(seasonKey!, "").replace(/[()]/g, "").trim() || "국면"})
                  </h2>
                  {hy?.q_days != null && hy.q_days > 0 && (
                    <span className="text-sm text-slate-400">{hy.q_days}일째 유지</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-2">
              {signals.map((s) => (
                <div key={s.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                  s.ok ? "bg-emerald-500/15 border-emerald-500/30" : "bg-red-500/15 border-red-500/30"
                }`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    s.ok
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
                  }`} />
                  <span className={`text-[10px] font-bold tracking-wider ${
                    s.ok ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {s.label} {s.ok ? "안정" : "경고"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action */}
        {action && (
          <div className="mb-5 p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
            <p className="text-sm font-medium text-slate-200">→ {action.text}</p>
          </div>
        )}

        {/* 3-column detail grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* HY Spread */}
          <div className="bg-surface-deep border border-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">🏦 HY 스프레드</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
              {hy?.value != null ? `${hy.value.toFixed(2)}%` : "-"}
            </div>
            {hy?.median != null && (
              <p className="text-[11px] text-slate-500 mt-1">
                중앙값 {hy.median.toFixed(2)}% · {hy.value! < hy.median ? "평균 이하 (안정)" : "평균 이상 (주의)"}
              </p>
            )}
          </div>

          {/* VIX */}
          <div className="bg-surface-deep border border-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">⚡ VIX</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
              {vix?.value != null ? vix.value.toFixed(1) : "-"}
            </div>
            {vix?.percentile != null && (
              <>
                <p className="text-[11px] text-slate-500 mt-1">
                  1년 중 {vix.percentile.toFixed(0)}번째 · {vix.regime_label || ""}
                </p>
                <div className="mt-2 relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-[10%] bg-amber-500/20 rounded-l-full" />
                  <div className="absolute inset-y-0 left-[10%] w-[57%] bg-emerald-500/20" />
                  <div className="absolute inset-y-0 left-[67%] w-[13%] bg-amber-500/20" />
                  <div className="absolute inset-y-0 left-[80%] w-[10%] bg-orange-500/20" />
                  <div className="absolute inset-y-0 left-[90%] w-[10%] bg-red-500/20 rounded-r-full" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-400 shadow-lg z-10"
                    style={{ left: `${Math.min(vix.percentile, 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Indices */}
          <div className="bg-surface-deep border border-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">📈 지수</span>
            </div>
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
  );
}

/* ═══════════════════════════════════════════════════
   ACT 2 — Pipeline & Stats
   ═══════════════════════════════════════════════════ */

function PipelineSection({ ranking, pipeline }: {
  ranking: RankingData | null; pipeline: PipelineResponse | null;
}) {
  const vc = pipeline?.verified.length ?? 0;
  const nc = pipeline?.new_entry.length ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Pipeline funnel — full width */}
      {ranking?.metadata && (
        <div className="col-span-2 sm:col-span-4 bg-surface-default border border-border rounded-xl px-4 py-3">
          <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mr-1 hidden sm:inline">Pipeline</span>
            <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-blue-400">{ranking.metadata.total_universe.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">유니버스</span>
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-cyan-400">{ranking.metadata.prefilter_passed}</span>
            <span className="text-[10px] text-slate-500">사전필터</span>
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-cyan-400">{ranking.metadata.scored_count}</span>
            <span className="text-[10px] text-slate-500">스코어링</span>
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-emerald-400">30</span>
            <span className="text-[10px] text-slate-500">Top 30</span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <StatCard label="🔍 스크리닝" value={ranking?.metadata?.scored_count ?? 0}
        borderColor="border-t-blue-500/50" textColor="text-blue-400" unit="종목" />
      <StatCard label="🎯 Top 30" value={30}
        borderColor="border-t-cyan-500/50" textColor="text-cyan-400" unit="종목" />
      <StatCard label="✅ 검증 완료" value={vc}
        borderColor="border-t-emerald-500/50" textColor="text-emerald-400" unit="종목" />
      <StatCard label="🆕 신규 진입" value={nc}
        borderColor="border-t-amber-500/50" textColor="text-amber-400" unit="종목" />
    </div>
  );
}

function StatCard({ label, value, borderColor, textColor, unit }: {
  label: string; value: number; borderColor: string; textColor: string; unit: string;
}) {
  return (
    <div className={`bg-surface-default border border-border rounded-xl p-4 border-t-2 ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <span className={`text-2xl font-bold font-mono tabular-nums ${textColor}`}>{value}</span>
      <span className="text-xs text-slate-500 ml-1">{unit}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACT 3 — Ranking Table (3/4 width)
   ═══════════════════════════════════════════════════ */

function RankingSection({ ranking, pipeline }: {
  ranking: RankingData | null; pipeline: PipelineResponse | null;
}) {
  const [sort, setSort] = useState<SortConfig>({ key: "composite_rank", direction: "asc" });

  const stocks = ranking?.rankings.slice(0, 30) ?? [];

  // Pre-compute ticker sets (pipeline returns objects, not strings)
  const tickerSets = useMemo(() => {
    if (!pipeline) return { verified: new Set<string>(), pending: new Set<string>(), new_entry: new Set<string>() };
    const toSet = (arr: { ticker: string }[]) => new Set(arr.map((s) => s.ticker));
    return {
      verified: toSet(pipeline.verified),
      pending: toSet(pipeline.pending),
      new_entry: toSet(pipeline.new_entry),
    };
  }, [pipeline]);

  const getStatus = (ticker: string) => {
    if (tickerSets.verified.has(ticker)) return "verified";
    if (tickerSets.pending.has(ticker)) return "pending";
    if (tickerSets.new_entry.has(ticker)) return "new_entry";
    return "";
  };

  const sorted = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const av = sortVal(a, sort.key);
      const bv = sortVal(b, sort.key);
      return sort.direction === "asc" ? av - bv : bv - av;
    });
  }, [stocks, sort]);

  // Group by status (like US dashboard)
  const groups = useMemo(() => {
    const verified = sorted.filter((s) => getStatus(s.ticker) === "verified");
    const pending = sorted.filter((s) => getStatus(s.ticker) === "pending");
    const newEntry = sorted.filter((s) => getStatus(s.ticker) === "new_entry");
    const noStatus = sorted.filter((s) => getStatus(s.ticker) === "");
    return [
      { label: "검증 완료", sublabel: "3일 연속 확인", emoji: "✅", items: verified, color: "emerald" },
      { label: "검증 대기", sublabel: "확인 중", emoji: "⏳", items: pending, color: "amber" },
      { label: "신규 진입", sublabel: "오늘 처음", emoji: "🆕", items: newEntry, color: "blue" },
      ...(noStatus.length > 0 ? [{ label: "기타", sublabel: "", emoji: "", items: noStatus, color: "slate" }] : []),
    ].filter((g) => g.items.length > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, pipeline]);

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key === key) return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      const dir: SortDirection = ["composite_rank", "per", "pbr"].includes(key) ? "asc" : "desc";
      return { key, direction: dir };
    });
  };

  return (
    <div className="bg-surface-default border border-border rounded-xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h2 className="text-lg font-semibold text-slate-100">매수 후보</h2>
          <span className="text-xs text-slate-500">Top 30</span>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          V25% Q25% G25% M25%
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-slate-400 text-xs uppercase tracking-wider">
              <SortHeader label="#" k="composite_rank" sort={sort} onSort={handleSort} align="center" />
              <th className="px-2 py-3 text-center font-medium">상태</th>
              <th className="px-3 py-3 text-left font-medium">종목</th>
              <th className="px-3 py-3 text-left font-medium">섹터</th>
              <SortHeader label="총점" k="score" sort={sort} onSort={handleSort} align="right" />
              <SortHeader label="PER" k="per" sort={sort} onSort={handleSort} align="right" />
              <SortHeader label="PBR" k="pbr" sort={sort} onSort={handleSort} align="right" />
              <SortHeader label="V" k="value_s" sort={sort} onSort={handleSort} align="center" />
              <SortHeader label="Q" k="quality_s" sort={sort} onSort={handleSort} align="center" />
              <SortHeader label="G" k="growth_s" sort={sort} onSort={handleSort} align="center" />
              <SortHeader label="M" k="momentum_s" sort={sort} onSort={handleSort} align="center" />
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupedRows key={group.emoji} group={group} getStatus={getStatus} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden">
        {groups.map((group) => (
          <div key={group.emoji}>
            {/* Mobile group header */}
            <div className="px-4 py-2.5 bg-slate-800/50 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge emoji={group.emoji} color={group.color} />
                <span className="text-xs text-slate-400">{group.sublabel}</span>
                <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                  {group.items.length}종목
                </span>
              </div>
            </div>
            <div className="divide-y divide-border-subtle">
              {group.items.map((s) => {
                const top5 = s.composite_rank <= 5;
                const isBuffer = s.composite_rank > 20;
                return (
                  <div
                    key={s.ticker}
                    className={`px-4 py-3 hover:bg-surface-hover transition-colors ${
                      top5 ? "border-l-2 border-l-emerald-500" : ""
                    } ${isBuffer ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <RankBadge rank={s.composite_rank} />
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{s.name}</p>
                          <p className="text-[10px] text-slate-500">{s.ticker} · {s.sector}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-mono tabular-nums font-semibold ${scoreColor(s.score)}`}>
                          {s.score?.toFixed(3)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">PER {s.per?.toFixed(1) ?? "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-10">
                      <MiniFactorBadge label="V" score={s.value_s} />
                      <MiniFactorBadge label="Q" score={s.quality_s} />
                      <MiniFactorBadge label="G" score={s.growth_s} />
                      <MiniFactorBadge label="M" score={s.momentum_s} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Grouped table rows with group header */
function GroupedRows({ group, getStatus }: {
  group: { label: string; sublabel: string; emoji: string; items: Stock[]; color: string };
  getStatus: (ticker: string) => string;
}) {
  return (
    <>
      {/* Group header row */}
      <tr className="bg-slate-800/30">
        <td colSpan={11} className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <StatusBadge emoji={group.emoji} color={group.color} />
            <span className="text-xs text-slate-400">{group.sublabel}</span>
            <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
              {group.items.length}종목
            </span>
          </div>
        </td>
      </tr>
      {/* Data rows */}
      {group.items.map((s) => {
        const top5 = s.composite_rank <= 5;
        const isBuffer = s.composite_rank > 20;
        return (
          <tr
            key={s.ticker}
            className={`group transition-all duration-150 hover:bg-surface-hover hover:shadow-lg hover:shadow-emerald-500/5 ${
              top5 ? "bg-gradient-to-r from-emerald-500/5 to-transparent border-l-2 border-l-emerald-500" : ""
            } ${isBuffer ? "opacity-60" : ""}`}
          >
            <td className="px-2 py-2.5 text-center"><RankBadge rank={s.composite_rank} /></td>
            <td className="px-2 py-2.5 text-center text-sm">{statusEmoji(getStatus(s.ticker))}</td>
            <td className="px-3 py-2.5">
              <p className="font-semibold text-slate-100 text-sm">{s.name}</p>
              <p className="text-[10px] text-slate-500">{s.ticker}</p>
            </td>
            <td className="px-3 py-2.5">
              <span className="text-xs text-slate-400 truncate block max-w-[120px]">{s.sector}</span>
            </td>
            <td className={`px-3 py-2.5 text-right ${scoreCellBg(s.score)}`}>
              <span className={`font-mono tabular-nums font-semibold ${scoreColor(s.score)}`}>
                {s.score?.toFixed(3)}
              </span>
            </td>
            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-400 text-xs">
              {s.per?.toFixed(1) ?? "-"}
            </td>
            <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-400 text-xs">
              {s.pbr?.toFixed(2) ?? "-"}
            </td>
            <td className="px-2 py-2.5 text-center"><FactorBadge score={s.value_s} /></td>
            <td className="px-2 py-2.5 text-center"><FactorBadge score={s.quality_s} /></td>
            <td className="px-2 py-2.5 text-center"><FactorBadge score={s.growth_s} /></td>
            <td className="px-2 py-2.5 text-center"><FactorBadge score={s.momentum_s} /></td>
          </tr>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Sidebar — Picks Card
   ═══════════════════════════════════════════════════ */

function PicksSection({ picks, market }: { picks: PicksResponse | null; market: MarketResponse | null }) {
  const formatDate = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}`;
  const pickLevel = market?.pick_level;

  // 시스템 레벨 매도: 시장 위험으로 추천 중단 (v20.4)
  if (pickLevel && pickLevel.max_picks === 0 && pickLevel.warning) {
    return (
      <div className="bg-surface-default border border-red-500/30 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-red-500 rounded-full" />
            <h3 className="text-sm font-semibold text-slate-100">최종 추천</h3>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/30">
              {pickLevel.label}
            </span>
          </div>
        </div>
        <div className="p-5 text-center space-y-3">
          <p className="text-sm text-red-300 font-medium">{pickLevel.warning}</p>
          <p className="text-xs text-slate-500">시장이 안정되면 자동으로 추천이 재개됩니다.</p>
          <p className="text-[10px] text-slate-600">Top 30 목록은 위 테이블에서 확인하세요.</p>
        </div>
      </div>
    );
  }

  if (!picks || picks.picks.length === 0) {
    return (
      <div className="bg-surface-default border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h3 className="text-sm font-semibold text-slate-100">최종 추천</h3>
          </div>
        </div>
        <div className="p-5 text-center">
          <p className="text-sm text-slate-400">{picks?.message ?? "추천 종목 없음"}</p>
          <p className="text-xs text-slate-500 mt-1">관망을 권장합니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-default border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-sm font-semibold text-slate-100">최종 추천</h3>
          <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
            {picks.picks.length}종목 · 20%
          </span>
        </div>
        {picks.dates && (
          <span className="text-[10px] font-mono text-slate-500">
            {picks.dates.map(formatDate).join(" · ")}
          </span>
        )}
      </div>

      {/* Market warning banner (축소/신중 등) */}
      {pickLevel && pickLevel.warning && pickLevel.max_picks > 0 && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-[11px] text-amber-300">{pickLevel.warning}</p>
        </div>
      )}

      {/* Stock cards */}
      <div className="p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-2.5">
          {picks.picks.map((pick, i) => (
            <div key={pick.ticker} className="bg-surface-deep border border-border rounded-xl p-3.5 hover:border-emerald-500/40 transition-all">
              <div className="mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {i + 1}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100">{pick.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{pick.ticker} · {pick.sector}</div>

              {pick.factor_grades && (
                <div className="flex items-center gap-1 mt-2">
                  <FG letter="V" grade={pick.factor_grades.value} />
                  <FG letter="Q" grade={pick.factor_grades.quality} />
                  <FG letter="G" grade={pick.factor_grades.growth} />
                  <FG letter="M" grade={pick.factor_grades.momentum} />
                </div>
              )}

              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                {pick.per != null && <span>PER {pick.per.toFixed(1)}</span>}
                {pick.roe != null && (
                  <span className={pick.roe > 15 ? "text-emerald-400" : ""}>ROE {pick.roe.toFixed(1)}%</span>
                )}
              </div>

              {pick.trajectory && pick.trajectory.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  {pick.trajectory.map((r, j) => (
                    <span key={j} className="flex items-center">
                      <span className={`text-[10px] font-mono font-bold tabular-nums ${
                        r <= 5 ? "text-emerald-400" : r <= 15 ? "text-blue-400" : "text-slate-500"
                      }`}>
                        {r}
                      </span>
                      {j < pick.trajectory.length - 1 && <span className="text-slate-600 mx-0.5 text-[10px]">→</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Buy rationale */}
      {picks.picks.some((p) => p.buy_rationale) && (
        <div className="border-t border-border p-3 space-y-2">
          {picks.picks.filter((p) => p.buy_rationale).map((pick) => (
            <p key={pick.ticker} className="text-[11px] text-slate-400 leading-relaxed">
              <span className="text-emerald-400 font-semibold">{pick.name}</span> — {pick.buy_rationale}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Sidebar — Death List
   ═══════════════════════════════════════════════════ */

function DeathListSection({ deathList }: { deathList: DeathListResponse | null }) {
  if (!deathList) return null;

  const formatDate = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}`;

  return (
    <div className="bg-surface-default border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-red-500/70 rounded-full" />
          <h3 className="text-sm font-semibold text-slate-100">이탈 종목</h3>
          <span className="text-xs text-slate-500">Death List</span>
          <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
            {deathList.death_list.length}종목
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 ml-4">
          {formatDate(deathList.dates.yesterday)} → {formatDate(deathList.dates.today)}
        </p>
      </div>

      {deathList.death_list.length > 0 ? (
        <div className="divide-y divide-border-subtle">
          {deathList.death_list.map((item) => (
            <div key={item.ticker} className="px-4 py-3 hover:bg-red-500/5 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-400/70 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm text-slate-300 font-semibold">{item.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">{item.ticker}</span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{item.sector}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {item.exit_reason && item.exit_reason.trim().length > 0 && (
                    <div className="flex gap-1">
                      {item.exit_reason.split(' ').filter(Boolean).map((tag, j) => {
                        const isPositive = tag.includes('↑');
                        return (
                          <span key={j} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs font-mono tabular-nums">
                    <span className="text-slate-400">#{item.yesterday_rank}</span>
                    <TrendingDown className="w-3 h-3 text-red-400/60" />
                    <span className={`font-semibold ${item.dropped_out ? "text-red-400" : "text-orange-400"}`}>
                      {item.dropped_out ? "OUT" : `#${item.today_rank}`}
                    </span>
                  </div>
                </div>
              </div>
              {/* Rank trajectory mini bars */}
              <RankTrajectory yesterdayRank={item.yesterday_rank} todayRank={item.today_rank} droppedOut={item.dropped_out} />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 text-center">
          <p className="text-sm text-emerald-400">✅ 이탈 종목 없음</p>
          <p className="text-xs text-slate-500 mt-1">안정적인 시장이에요</p>
        </div>
      )}
    </div>
  );
}

/* Rank trajectory mini bar chart — shows rank drop visually */
function RankTrajectory({ yesterdayRank, todayRank, droppedOut }: {
  yesterdayRank: number; todayRank: number | null; droppedOut: boolean;
}) {
  const ranks = [yesterdayRank, droppedOut ? null : todayRank];
  return (
    <div className="flex items-end gap-0.5 mt-2 ml-6 h-4">
      {ranks.map((rank, i) => {
        if (rank == null) {
          return (
            <div key={i} className="w-3 h-1 rounded-sm bg-red-500/40" />
          );
        }
        const h = Math.max(4, Math.min(16, 20 - rank * 0.3));
        const color = rank <= 10 ? "bg-emerald-500/50" : rank <= 20 ? "bg-amber-500/40" : rank <= 30 ? "bg-slate-500/40" : "bg-red-500/40";
        return (
          <div key={i} className={`w-3 rounded-sm ${color}`} style={{ height: `${h}px` }} />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Sidebar — AI Risk Filter
   ═══════════════════════════════════════════════════ */

function AISection({ ai }: { ai: AIResponse | null }) {
  if (!ai?.available) {
    return (
      <div className="bg-surface-default border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h3 className="text-sm font-semibold text-slate-100">AI 리스크</h3>
          </div>
        </div>
        <div className="p-5 text-center">
          <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">데이터 준비 중</p>
        </div>
      </div>
    );
  }

  const cleanText = (text: string) =>
    text.replace(/<\/?b>/g, "").replace(/<br\s*\/?>/g, "\n").replace(/─+/g, "").trim();

  return (
    <div className="bg-surface-default border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-sm font-semibold text-slate-100">AI 리스크</h3>
        </div>
        {ai.flagged_tickers.length > 0 ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400">{ai.flagged_tickers.length}개 주의</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">안전</span>
          </div>
        )}
      </div>

      {ai.flagged_tickers.length > 0 && (
        <div className="px-4 py-3 border-b border-border-subtle">
          <div className="flex flex-wrap gap-1.5">
            {ai.flagged_tickers.map((t) => (
              <span key={t} className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {ai.risk_filter && (
        <div className="p-4">
          <div className="text-[11px] leading-relaxed text-slate-400 whitespace-pre-line max-h-48 overflow-y-auto">
            {cleanText(ai.risk_filter)}
          </div>
        </div>
      )}

      {ai.picks_text && (
        <div className="border-t border-border-subtle p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">종목별 AI 분석</p>
          <div className="text-[11px] leading-relaxed text-slate-400 whitespace-pre-line max-h-48 overflow-y-auto">
            {cleanText(ai.picks_text)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Sidebar — Sector Distribution
   ═══════════════════════════════════════════════════ */

function SectorSection({ ranking }: { ranking: RankingData | null }) {
  const sectorCounts: Record<string, number> = {};
  ranking?.rankings.slice(0, 30).forEach((s) => {
    if (s.sector) sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;
  });
  const sorted = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return null;

  const maxCount = sorted[0][1];

  return (
    <div className="bg-surface-default border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-sm font-semibold text-slate-100">주도 업종</h3>
          <span className="text-xs text-slate-500">Top 30 기준</span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {sorted.map(([sec, cnt]) => (
          <div key={sec} className="flex items-center gap-2">
            <span className="text-xs text-slate-300 w-16 truncate shrink-0">{sec}</span>
            <div className="flex-1 h-4 bg-surface-deep rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500/30 rounded-full transition-all"
                style={{ width: `${(cnt / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold tabular-nums text-emerald-400 w-6 text-right shrink-0">{cnt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Shared micro-components
   ═══════════════════════════════════════════════════ */

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
      <span className="text-xs text-slate-400 w-12">{label}</span>
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

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 5) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        {rank}
      </span>
    );
  }
  if (rank <= 10) return <span className="font-mono text-xs font-bold tabular-nums text-slate-300">{rank}</span>;
  return <span className="font-mono text-xs tabular-nums text-slate-500">{rank}</span>;
}

function FactorBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-slate-600">-</span>;
  const grade = score >= 1.28 ? "A+" : score >= 0.84 ? "A" : score >= 0.52 ? "B+" : score >= 0 ? "B" : score >= -0.52 ? "C" : "D";
  const color = grade.startsWith("A") ? "text-emerald-400 bg-emerald-500/15"
    : grade.startsWith("B") ? "text-blue-400 bg-blue-500/10"
    : grade === "C" ? "text-amber-400 bg-amber-500/10"
    : "text-red-400 bg-red-500/10";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-[10px] font-bold ${color}`}>
      {grade}
    </span>
  );
}

function MiniFactorBadge({ label, score }: { label: string; score: number | null }) {
  if (score == null) return null;
  const grade = score >= 1.28 ? "A+" : score >= 0.84 ? "A" : score >= 0.52 ? "B+" : score >= 0 ? "B" : score >= -0.52 ? "C" : "D";
  const color = grade.startsWith("A") ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
    : grade.startsWith("B") ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
    : grade === "C" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold ${color}`}>
      <span className="text-slate-500">{label}</span>
      <span>{grade}</span>
    </span>
  );
}

function FG({ letter, grade }: { letter: string; grade: string }) {
  const color = grade.startsWith("A") ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
    : grade.startsWith("B") ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
    : grade === "C" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-bold ${color}`}>
      <span className="text-slate-500">{letter}</span>
      <span>{grade}</span>
    </span>
  );
}

function SortHeader({ label, k, sort, onSort, align }: {
  label: string; k: string; sort: SortConfig; onSort: (k: string) => void; align: string;
}) {
  const active = sort.key === k;
  const cls = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "";
  return (
    <th
      className="px-2 py-3 font-medium cursor-pointer select-none hover:text-slate-200 transition-colors"
      onClick={() => onSort(k)}
    >
      <div className={`flex items-center gap-1 ${cls}`}>
        <span>{label}</span>
        {active ? (
          sort.direction === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </div>
    </th>
  );
}

function StatusBadge({ emoji, color }: { emoji: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/15 border-emerald-500/30",
    amber: "bg-amber-500/15 border-amber-500/30",
    blue: "bg-blue-500/15 border-blue-500/30",
    slate: "bg-slate-500/15 border-slate-500/30",
  };
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-sm ${colorMap[color] ?? colorMap.slate}`}>
      {emoji}
    </span>
  );
}

function scoreCellBg(score: number | null | undefined): string {
  if (score == null) return "";
  if (score >= 0.5) return "bg-emerald-500/15";
  if (score >= 0.3) return "bg-emerald-500/8";
  if (score >= 0.2) return "bg-emerald-500/5";
  return "";
}

function scoreColor(score: number | null | undefined): string {
  if (score == null) return "text-slate-500";
  if (score >= 0.5) return "text-emerald-400";
  if (score >= 0.3) return "text-emerald-300";
  return "text-slate-300";
}

function statusEmoji(status: string) {
  if (status === "verified") return "✅";
  if (status === "pending") return "⏳";
  if (status === "new_entry") return "🆕";
  return "";
}

function sortVal(s: Stock, key: string): number {
  switch (key) {
    case "composite_rank": return s.composite_rank;
    case "score": return s.score ?? 0;
    case "per": return s.per ?? 9999;
    case "pbr": return s.pbr ?? 9999;
    case "value_s": return s.value_s ?? -999;
    case "quality_s": return s.quality_s ?? -999;
    case "growth_s": return s.growth_s ?? -999;
    case "momentum_s": return s.momentum_s ?? -999;
    default: return 0;
  }
}

/* ═══════════════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════════════ */

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="skeleton h-10 w-full rounded-lg" />
      <div className="skeleton h-4 w-40" />
      <div className="skeleton h-64 w-full rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2 sm:col-span-4 skeleton h-12 rounded-xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" style={{ animationDelay: `${i * 30}ms` }} />
          ))}
        </div>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
