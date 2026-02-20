import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { PicksResponse, DeathListResponse } from "../types";
import { FactorGrade } from "../components/FactorGrade";

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

  if (loading) return <div className="space-y-4 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 w-full" />)}</div>;

  const formatDate = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}`;

  return (
    <div className="space-y-5">
      {/* Picks Header */}
      <div>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          🎯 최종 추천 — 3일 교집합
          {picks?.dates && (
            <span className="ml-1 font-mono">
              ({picks.dates.map(formatDate).join(" · ")})
            </span>
          )}
        </p>
        {picks && picks.total_common != null && (
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {picks.total_common}개 교집합 중 {picks.picks.length}개 선정 · 종목당 20% 비중
          </p>
        )}
      </div>

      {/* Picks List */}
      {picks && picks.picks.length > 0 ? (
        <div className="space-y-3">
          {picks.picks.map((pick, i) => (
            <div key={pick.ticker} className="card p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: "rgba(0, 192, 135, 0.15)",
                      color: "var(--positive)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                      {pick.name}
                    </span>
                    <span className="text-xs ml-1.5" style={{ color: "var(--text-tertiary)" }}>
                      {pick.ticker} · {pick.sector}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--positive)" }}>
                  {pick.weight ?? 20}%
                </span>
              </div>

              {/* Trajectory */}
              {pick.trajectory && pick.trajectory.length > 0 && (
                <p className="text-xs font-mono mb-2" style={{ color: "var(--text-secondary)" }}>
                  {pick.trajectory.map((r, j) => (
                    <span key={j}>
                      <span className={r <= 5 ? "text-emerald-400 font-bold" : r <= 15 ? "text-blue-400" : ""}>
                        {r}위
                      </span>
                      {j < pick.trajectory.length - 1 && " → "}
                    </span>
                  ))}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                <span>PER <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{pick.per?.toFixed(1) ?? "-"}</span></span>
                {pick.fwd_per && <span>Fwd <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{pick.fwd_per.toFixed(1)}</span></span>}
                <span>PBR <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{pick.pbr?.toFixed(2) ?? "-"}</span></span>
                {pick.roe != null && <span>ROE <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{pick.roe.toFixed(1)}%</span></span>}
              </div>

              {/* Factor Grades */}
              {pick.factor_grades && (
                <div className="flex items-center gap-2 mb-2">
                  <FactorLabel letter="V" grade={pick.factor_grades.value} />
                  <FactorLabel letter="Q" grade={pick.factor_grades.quality} />
                  <FactorLabel letter="G" grade={pick.factor_grades.growth} />
                  <FactorLabel letter="M" grade={pick.factor_grades.momentum} />
                </div>
              )}

              {/* Buy Rationale */}
              {pick.buy_rationale && (
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                  💡 {pick.buy_rationale}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {picks?.message ?? "추천 종목이 없습니다"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            관망을 권장합니다
          </p>
        </div>
      )}

      {/* Death List */}
      {deathList && deathList.death_list.length > 0 && (
        <>
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              📉 어제 대비 이탈 {deathList.death_list.length}개
              {deathList.dates && (
                <span className="font-mono ml-1">
                  ({formatDate(deathList.dates.yesterday)} → {formatDate(deathList.dates.today)})
                </span>
              )}
            </p>
          </div>
          <div className="card overflow-hidden">
            {deathList.death_list.map((item) => (
              <div
                key={item.ticker}
                className="flex items-center justify-between px-4 py-3 border-t first:border-t-0"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.name}
                  </span>
                  <span className="text-xs ml-1.5" style={{ color: "var(--text-tertiary)" }}>
                    {item.sector}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Exit reasons */}
                  {item.exit_reason && item.exit_reason.length > 0 && (
                    <div className="flex gap-1">
                      {item.exit_reason.map((r, j) => (
                        <span key={j} className="text-[10px] font-bold px-1 py-0.5 rounded" style={{
                          backgroundColor: "rgba(255, 71, 87, 0.1)",
                          color: "var(--negative)",
                        }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                    {item.yesterday_rank}위
                  </span>
                  <span className="text-xs" style={{ color: "var(--negative)" }}>→</span>
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--negative)" }}>
                    {item.dropped_out ? "OUT" : `${item.today_rank}위`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-center" style={{ color: "var(--negative)" }}>
            ⛔ 보유 중이라면 매도를 검토하세요
          </p>
        </>
      )}

      {deathList && deathList.death_list.length === 0 && (
        <div className="card p-4 text-center">
          <p className="text-xs" style={{ color: "var(--positive)" }}>
            ✅ 이탈 종목 없음 — 모든 종목이 안정적입니다
          </p>
        </div>
      )}
    </div>
  );
}

function FactorLabel({ letter, grade }: { letter: string; grade: string }) {
  const scoreMap: Record<string, number> = { "A+": 1.5, A: 1.0, "B+": 0.7, B: 0.2, C: -0.3, D: -1.0 };
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>{letter}</span>
      <FactorGrade score={scoreMap[grade] ?? -1} size="sm" />
    </span>
  );
}
