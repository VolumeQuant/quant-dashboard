import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { PicksResponse, DeathListResponse } from "../types";

export function PicksTab() {
  const [picks, setPicks] = useState<PicksResponse | null>(null);
  const [deathList, setDeathList] = useState<DeathListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPicks(), api.getDeathList()])
      .then(([p, d]) => { setPicks(p); setDeathList(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full" />)}</div>;

  const formatDate = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}`;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Picks Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 bg-emerald-500 rounded-full" />
        <h3 className="text-sm font-semibold text-slate-100">최종 추천</h3>
        <span className="text-xs text-slate-500">3일 교집합</span>
        {picks?.dates && (
          <span className="text-[10px] font-mono text-slate-600">
            ({picks.dates.map(formatDate).join(" · ")})
          </span>
        )}
      </div>

      {picks && picks.total_common != null && (
        <p className="text-xs text-slate-500">
          {picks.total_common}개 교집합 중 {picks.picks.length}개 선정 · 종목당 <span className="font-bold text-emerald-400">20%</span> 비중
        </p>
      )}

      {/* Picks cards */}
      {picks && picks.picks.length > 0 ? (
        <div className="space-y-3">
          {picks.picks.map((pick, i) => (
            <div key={pick.ticker} className="card p-4 border-l-2 border-l-emerald-500/50">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-slate-100">{pick.name}</span>
                    <span className="text-xs text-slate-500 ml-2">{pick.ticker} · {pick.sector}</span>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                  {pick.weight ?? 20}%
                </span>
              </div>

              {/* Trajectory */}
              {pick.trajectory && pick.trajectory.length > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  {pick.trajectory.map((r, j) => (
                    <span key={j} className="flex items-center">
                      <span className={`text-xs font-mono font-bold tabular-nums ${
                        r <= 5 ? "text-emerald-400" : r <= 15 ? "text-blue-400" : "text-slate-400"
                      }`}>
                        {r}위
                      </span>
                      {j < pick.trajectory.length - 1 && (
                        <span className="text-slate-600 mx-1">→</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-3">
                <Stat label="PER" value={pick.per?.toFixed(1)} />
                <Stat label="PBR" value={pick.pbr?.toFixed(2)} />
                {pick.fwd_per && <Stat label="Fwd PER" value={pick.fwd_per.toFixed(1)} highlight />}
                {pick.roe != null && <Stat label="ROE" value={`${pick.roe.toFixed(1)}%`} highlight={pick.roe > 15} />}
              </div>

              {/* Factor grades */}
              {pick.factor_grades && (
                <div className="flex items-center gap-2 mb-3">
                  <FG letter="V" grade={pick.factor_grades.value} />
                  <FG letter="Q" grade={pick.factor_grades.quality} />
                  <FG letter="G" grade={pick.factor_grades.growth} />
                  <FG letter="M" grade={pick.factor_grades.momentum} />
                </div>
              )}

              {/* Buy rationale */}
              {pick.buy_rationale && (
                <p className="text-[11px] leading-relaxed text-slate-400">
                  💡 {pick.buy_rationale}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-400">{picks?.message ?? "추천 종목 없음"}</p>
          <p className="text-xs text-slate-500 mt-1">관망을 권장합니다</p>
        </div>
      )}

      {/* Death List */}
      {deathList && deathList.death_list.length > 0 && (
        <>
          <div className="flex items-center gap-3 mt-6">
            <div className="w-1 h-5 bg-red-500 rounded-full" />
            <h3 className="text-sm font-semibold text-slate-100">이탈 종목</h3>
            <span className="text-xs text-slate-500">
              {deathList.death_list.length}개 · {formatDate(deathList.dates.yesterday)} → {formatDate(deathList.dates.today)}
            </span>
          </div>

          <div className="card overflow-hidden">
            {deathList.death_list.map((item) => (
              <div
                key={item.ticker}
                className="flex items-center justify-between px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-200">{item.name}</span>
                  <span className="text-[10px] text-slate-500">{item.sector}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.exit_reason && item.exit_reason.length > 0 && (
                    <div className="flex gap-1">
                      {item.exit_reason.map((r, j) => (
                        <span key={j} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-xs font-mono tabular-nums text-slate-500">{item.yesterday_rank}위</span>
                  <span className="text-red-400">→</span>
                  <span className="text-xs font-mono tabular-nums font-bold text-red-400">
                    {item.dropped_out ? "OUT" : `${item.today_rank}위`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-red-400/80">⛔ 보유 중이라면 매도를 검토하세요</p>
        </>
      )}

      {deathList && deathList.death_list.length === 0 && (
        <div className="card p-4 text-center">
          <p className="text-xs text-emerald-400">✅ 이탈 종목 없음 — 모든 종목이 안정적입니다</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-mono tabular-nums font-semibold ${highlight ? "text-emerald-400" : "text-slate-200"}`}>
        {value ?? "-"}
      </p>
    </div>
  );
}

function FG({ letter, grade }: { letter: string; grade: string }) {
  const color = grade.startsWith("A") ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
    : grade.startsWith("B") ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
    : grade === "C" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${color}`}>
      <span className="text-slate-500">{letter}</span>
      <span>{grade}</span>
    </span>
  );
}
