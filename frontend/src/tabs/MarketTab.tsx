import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { MarketResponse, RankingData, PipelineResponse } from "../types";

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

  if (loading) return <LoadingPulse />;

  const credit = market?.credit;
  const hy = credit?.hy;
  const vix = credit?.vix;
  const kr = credit?.kr;
  const action = credit?.action;
  const formatDate = (d: string) => `${d.slice(0, 4)}년 ${d.slice(4, 6)}월 ${d.slice(6, 8)}일`;

  // Season mapping
  const seasonMap: Record<string, { icon: string; label: string; color: string }> = {
    봄: { icon: "🌸", label: "봄 (회복국면)", color: "text-pink-400" },
    여름: { icon: "☀️", label: "여름 (성장국면)", color: "text-yellow-400" },
    가을: { icon: "🍂", label: "가을 (과열국면)", color: "text-orange-400" },
    겨울: { icon: "❄️", label: "겨울 (침체국면)", color: "text-blue-400" },
  };
  const seasonRaw = hy?.season ?? "";
  const seasonKey = Object.keys(seasonMap).find((k) => seasonRaw.includes(k));
  const season = seasonKey ? seasonMap[seasonKey] : null;

  // Signal count
  let greenCount = 0;
  let redCount = 0;
  if (hy?.value != null) { hy.value < 4 ? greenCount++ : redCount++; }
  if (kr?.spread != null) { kr.spread < 8 ? greenCount++ : redCount++; }
  if (vix?.value != null) { vix.value < 25 ? greenCount++ : redCount++; }
  const total = greenCount + redCount;

  // Sector distribution
  const sectorCounts: Record<string, number> = {};
  ranking?.rankings.slice(0, 30).forEach((s) => {
    if (s.sector) sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1;
  });
  const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* Date */}
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        📅 {ranking ? formatDate(ranking.date) : market?.date ? formatDate(market.date) : ""} 기준
      </p>

      {/* Index */}
      {market?.indices && (
        <div className="flex gap-3">
          <IndexBadge label="코스피" data={market.indices.kospi} />
          <IndexBadge label="코스닥" data={market.indices.kosdaq} />
        </div>
      )}

      {/* Season + Action — 가장 큰 정보 */}
      <div className="card p-5">
        <p className="text-xs font-medium mb-3" style={{ color: "var(--text-tertiary)" }}>
          🌡️ 시장 위험 지표
          {season && <span className={`ml-2 ${season.color}`}>— {season.icon} {season.label}</span>}
        </p>

        {/* 3 indicators */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <IndicatorCard
            label="🏦 신용시장"
            sublabel="HY Spread"
            value={hy?.value != null ? `${hy.value.toFixed(2)}%` : "-"}
            detail={hy?.median != null ? `중앙값 ${hy.median.toFixed(2)}%` : undefined}
            status={hy?.value != null ? (hy.value < 4 ? "green" : hy.value < 6 ? "yellow" : "red") : "gray"}
          />
          <IndicatorCard
            label="🇰🇷 한국"
            sublabel="BBB- 금리"
            value={kr?.spread != null ? `${kr.spread.toFixed(1)}%p` : "-"}
            detail={kr?.regime_label || undefined}
            status={kr?.spread != null ? (kr.spread < 8 ? "green" : kr.spread < 10 ? "yellow" : "red") : "gray"}
          />
          <IndicatorCard
            label="⚡ 변동성"
            sublabel="VIX"
            value={vix?.value != null ? vix.value.toFixed(1) : "-"}
            detail={vix?.percentile != null ? `1년 중 ${vix.percentile.toFixed(0)}번째` : undefined}
            status={vix?.value != null ? (vix.value < 20 ? "green" : vix.value < 30 ? "yellow" : "red") : "gray"}
          />
        </div>

        {/* Signal summary + Action */}
        {total > 0 && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--bg-hover)" }}>
            <div className="flex items-center gap-2 mb-1">
              {Array.from({ length: greenCount }).map((_, i) => (
                <span key={`g${i}`} className="text-sm">🟢</span>
              ))}
              {Array.from({ length: redCount }).map((_, i) => (
                <span key={`r${i}`} className="text-sm">🔴</span>
              ))}
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {greenCount}/{total} 안정
                {greenCount === total ? " — 확실한 신호" : redCount > greenCount ? " — 주의 필요" : ""}
              </span>
            </div>
            {action && (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                → {action.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Warnings */}
      {market?.warnings && market.warnings.length > 0 && (
        <div className="card p-4 border-amber-500/30">
          <p className="text-xs font-bold text-amber-400 mb-1">⚠️ 시장 경고</p>
          {market.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-300/80">{w}</p>
          ))}
        </div>
      )}

      {/* Sector */}
      {sortedSectors.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
            📊 주도 업종 (Top 30)
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {sortedSectors.map(([sec, cnt], i) => (
              <span key={sec}>
                <span className="font-medium">{sec}</span>
                <span style={{ color: "var(--text-tertiary)" }}> {cnt}</span>
                {i < sortedSectors.length - 1 && <span style={{ color: "var(--text-tertiary)" }}> · </span>}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Pipeline summary */}
      {ranking?.metadata && (
        <div className="card p-4">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
            🔍 선정 파이프라인
          </p>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
              {ranking.metadata.total_universe}
            </span>
            <span>→</span>
            <span className="font-mono">{ranking.metadata.prefilter_passed}</span>
            <span>→</span>
            <span className="font-mono">{ranking.metadata.scored_count}</span>
            <span>→</span>
            <span className="font-mono font-bold text-blue-400">Top 30</span>
            {pipeline && (
              <>
                <span className="text-xs ml-1">
                  (✅{pipeline.verified.length} ⏳{pipeline.pending.length} 🆕{pipeline.new_entry.length})
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IndexBadge({ label, data }: { label: string; data: { close: number | null; change_pct: number | null } | null }) {
  if (!data?.close) {
    return (
      <div className="flex-1 card p-3 text-center">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        <p className="text-lg font-bold font-mono" style={{ color: "var(--text-secondary)" }}>-</p>
      </div>
    );
  }
  const positive = (data.change_pct ?? 0) >= 0;
  const color = positive ? "var(--positive)" : "var(--negative)";
  const sign = positive ? "+" : "";
  return (
    <div className="flex-1 card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {positive ? "🟢" : "🔴"} {label}
        </span>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {sign}{data.change_pct?.toFixed(2)}%
        </span>
      </div>
      <p className="text-xl font-bold font-mono mt-1" style={{ color: "var(--text-primary)" }}>
        {data.close.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}

function IndicatorCard({
  label, sublabel, value, detail, status,
}: {
  label: string; sublabel: string; value: string; detail?: string;
  status: "green" | "yellow" | "red" | "gray";
}) {
  const dot = status === "green" ? "🟢" : status === "yellow" ? "🟡" : status === "red" ? "🔴" : "⚪";
  return (
    <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "var(--bg-hover)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="text-lg font-bold font-mono" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{sublabel}</p>
      {detail && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{detail}</p>}
      <span className="text-xs">{dot}</span>
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-24 w-full" />
      ))}
    </div>
  );
}
