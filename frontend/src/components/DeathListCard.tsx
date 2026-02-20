import { Link } from "react-router-dom";
import type { DeathListResponse } from "../types";
import { Skull, ArrowDown, TrendingDown, Ban } from "lucide-react";

interface DeathListCardProps {
  deathList: DeathListResponse | null;
}

const exitReasonLabels: Record<string, { label: string; color: string }> = {
  "V": { label: "V", color: "bg-blue-500/15 text-blue-400" },
  "Q": { label: "Q", color: "bg-purple-500/15 text-purple-400" },
  "G": { label: "G", color: "bg-cyan-500/15 text-cyan-400" },
  "M": { label: "M", color: "bg-amber-500/15 text-amber-400" },
};

function ExitReasonTag({ reason }: { reason: string }) {
  // reason like "V↓", "M↓", "Q↓"
  const key = reason.replace(/[^A-Z]/g, "");
  const config = exitReasonLabels[key];
  if (!config) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400">
        {reason}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${config.color}`}>
      {reason}
    </span>
  );
}

export function DeathListCard({ deathList }: DeathListCardProps) {
  if (!deathList) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skull className="h-5 w-5 text-red-400" />
          <h2 className="text-base font-semibold text-content-primary">Death List</h2>
        </div>
        <p className="text-sm text-content-tertiary">데이터 준비 중...</p>
      </div>
    );
  }

  const formatDate = (d: string) => `${d.slice(4, 6)}/${d.slice(6, 8)}`;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skull className="h-5 w-5 text-red-400" />
          <h2 className="text-base font-semibold text-content-primary">Death List</h2>
          <span className="text-xs text-content-tertiary">이탈 종목</span>
        </div>
        {deathList.dates && (
          <span className="text-xs text-content-tertiary font-mono">
            {formatDate(deathList.dates.yesterday)} → {formatDate(deathList.dates.today)}
          </span>
        )}
      </div>

      {deathList.death_list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-content-tertiary">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <TrendingDown className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-emerald-400">이탈 종목 없음</p>
          <p className="text-xs text-content-tertiary mt-1">모든 종목이 안정적입니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deathList.death_list.map((item) => (
            <div
              key={item.ticker}
              className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
                  {item.dropped_out ? (
                    <Ban className="h-4 w-4 text-red-400" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div>
                  <Link
                    to={`/stock/${item.ticker}`}
                    className="text-sm font-medium text-content-primary hover:text-blue-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-content-tertiary">{item.ticker} · {item.sector}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Exit reasons */}
                {item.exit_reason && item.exit_reason.length > 0 && (
                  <div className="flex items-center gap-1">
                    {item.exit_reason.map((reason, i) => (
                      <ExitReasonTag key={i} reason={reason} />
                    ))}
                  </div>
                )}

                {/* Rank change */}
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-mono text-content-secondary">{item.yesterday_rank}위</span>
                  <ArrowDown className="h-3.5 w-3.5 text-red-400" />
                  <span className="font-mono font-semibold text-red-400">
                    {item.dropped_out ? "OUT" : `${item.today_rank}위`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
