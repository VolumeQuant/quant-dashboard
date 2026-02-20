import type { PicksResponse } from "../types";
import { TrendingUp, ArrowRight } from "lucide-react";

export function PicksCard({ picks }: { picks: PicksResponse | null }) {
  if (!picks) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">최종 추천 (3일 교집합)</h2>
      </div>

      {picks.picks.length === 0 ? (
        <p className="text-gray-500 text-sm">{picks.message ?? "추천 종목 없음 — 관망"}</p>
      ) : (
        <div className="space-y-3">
          {picks.picks.map((p, i) => (
            <div key={p.ticker} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.ticker} · {p.sector}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  {p.trajectory.map((r, j) => (
                    <span key={j} className="flex items-center">
                      <span className={r <= 5 ? "text-green-600 font-semibold" : r <= 15 ? "text-blue-600" : "text-gray-600"}>
                        {r}위
                      </span>
                      {j < p.trajectory.length - 1 && <ArrowRight className="h-3 w-3 mx-0.5" />}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-700 mt-0.5">가중 {p.weighted_rank}위</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
