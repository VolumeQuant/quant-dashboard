import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { RankingData, PicksResponse, DeathListResponse, MarketResponse, PipelineResponse, AIResponse } from "../types";
import { MarketRisk } from "../components/MarketRisk";
import { PipelineFunnel } from "../components/PipelineFunnel";
import { PicksSection } from "../components/PicksSection";
import { DeathListCard } from "../components/DeathListCard";
import { TopStocksTable } from "../components/TopStocksTable";
import { BarChart3, TrendingUp, Shield, Skull, Bot, AlertTriangle, CheckCircle, BarChart } from "lucide-react";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`skeleton ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonBlock className="h-40 w-full" />
      <SkeletonBlock className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBlock className="h-64 w-full" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [picks, setPicks] = useState<PicksResponse | null>(null);
  const [deathList, setDeathList] = useState<DeathListResponse | null>(null);
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [ai, setAI] = useState<AIResponse | null>(null);
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
        setRanking(r);
        setPicks(p);
        setDeathList(d);
        setMarket(m);
        setPipeline(pl);
        setAI(a);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  const formatDate = (d: string) =>
    `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">대시보드</h1>
          {ranking && (
            <p className="text-sm text-content-tertiary mt-1">
              {formatDate(ranking.date)} 기준 분석
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {ranking?.metadata?.version ?? "v18.2"}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Slow In, Fast Out
          </span>
        </div>
      </div>

      {/* Market Risk Dashboard */}
      <MarketRisk market={market} />

      {/* Pipeline Funnel */}
      <PipelineFunnel
        metadata={ranking?.metadata}
        picksCount={picks?.picks.length ?? 0}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 className="h-5 w-5 text-blue-400" />}
          label="유니버스"
          value={ranking?.metadata?.total_universe ?? ranking?.rankings.length ?? 0}
          sub="전체 분석 대상"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          label="최종 추천"
          value={picks?.picks.length ?? 0}
          sub={`${picks?.total_common ?? 0}개 교집합 중`}
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          icon={<Shield className="h-5 w-5 text-amber-400" />}
          label="3일 검증"
          value={pipeline?.verified.length ?? 0}
          sub={`⏳ ${pipeline?.pending.length ?? 0} · 🆕 ${pipeline?.new_entry.length ?? 0}`}
          iconBg="bg-amber-500/10"
        />
        <StatCard
          icon={<Skull className="h-5 w-5 text-red-400" />}
          label="이탈 종목"
          value={deathList?.death_list.length ?? 0}
          sub="Death List"
          iconBg="bg-red-500/10"
        />
      </div>

      {/* Picks + Death List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PicksSection picks={picks} />
        <DeathListCard deathList={deathList} />
      </div>

      {/* AI Risk Filter */}
      <AISection ai={ai} />

      {/* Sector Distribution - compact line */}
      {ranking && <SectorLine stocks={ranking.rankings.slice(0, 30)} />}

      {/* Top 30 Table */}
      {ranking && (
        <TopStocksTable
          stocks={ranking.rankings.slice(0, 30)}
          title="Top 30 순위"
          pipelineStatus={pipeline ? {
            verified: pipeline.verified,
            pending: pipeline.pending,
            new_entry: pipeline.new_entry,
          } : undefined}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  iconBg: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`flex-shrink-0 p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold font-mono text-content-primary">{value}</p>
        <p className="text-xs text-content-tertiary">
          {label} · {sub}
        </p>
      </div>
    </div>
  );
}

function AISection({ ai }: { ai: AIResponse | null }) {
  if (!ai || !ai.available) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-purple-400" />
          <h2 className="text-base font-semibold text-content-primary">AI 리스크 필터</h2>
        </div>
        <p className="text-sm text-content-tertiary">
          AI 분석은 매일 오전 자동 생성됩니다. 다음 리밸런싱 후 업데이트됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-400" />
          <h2 className="text-base font-semibold text-content-primary">AI 리스크 필터</h2>
        </div>
        {ai.flagged_tickers.length > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-3 w-3" />
            {ai.flagged_tickers.length}개 주의
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="h-3 w-3" />
            위험 신호 없음
          </span>
        )}
      </div>

      {/* Risk filter text */}
      {ai.risk_filter && (
        <div className="text-sm text-content-secondary leading-relaxed whitespace-pre-line mb-4 p-4 rounded-lg bg-surface-hover border border-border">
          {ai.risk_filter}
        </div>
      )}

      {/* Flagged tickers */}
      {ai.flagged_tickers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ai.flagged_tickers.map((t) => (
            <span key={t} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectorLine({ stocks }: { stocks: { sector: string }[] }) {
  const sectorCounts: Record<string, number> = {};
  stocks.forEach((s) => {
    if (s.sector) {
      sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;
    }
  });

  const sorted = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <BarChart className="h-4 w-4 text-content-tertiary" />
        <h3 className="text-sm font-medium text-content-secondary">주도 업종 (Top 30)</h3>
      </div>
      <p className="text-sm text-content-primary leading-relaxed">
        {sorted.map(([sector, count], i) => (
          <span key={sector}>
            <span className="font-medium">{sector}</span>
            <span className="text-content-tertiary font-mono"> {count}</span>
            {i < sorted.length - 1 && <span className="text-content-tertiary mx-1">·</span>}
          </span>
        ))}
      </p>
    </div>
  );
}
