import type { PicksResponse } from "../types";
import { StockCard } from "./StockCard";
import { TrendingUp, ShieldCheck } from "lucide-react";

interface PicksSectionProps {
  picks: PicksResponse | null;
}

export function PicksSection({ picks }: PicksSectionProps) {
  if (!picks) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-content-primary">최종 추천</h2>
        </div>
        <p className="text-sm text-content-tertiary">데이터 준비 중...</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-content-primary">최종 추천</h2>
          <span className="text-xs text-content-tertiary">3일 교집합</span>
        </div>
        {picks.total_common != null && (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-content-tertiary">
              {picks.total_common}개 교집합 중 {picks.picks.length}개 선정
            </span>
          </div>
        )}
      </div>

      {picks.picks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-content-tertiary">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-amber-400">
            {picks.message ?? "추천 종목 없음"}
          </p>
          <p className="text-xs text-content-tertiary mt-1">관망을 권장합니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {picks.picks.map((pick, i) => (
            <StockCard key={pick.ticker} pick={pick} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
