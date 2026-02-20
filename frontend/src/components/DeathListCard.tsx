import type { DeathListResponse } from "../types";
import { Skull, ArrowDown } from "lucide-react";

export function DeathListCard({ deathList }: { deathList: DeathListResponse | null }) {
  if (!deathList) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Skull className="h-5 w-5 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900">Death List (이탈 종목)</h2>
      </div>

      {deathList.death_list.length === 0 ? (
        <p className="text-gray-500 text-sm">이탈 종목 없음</p>
      ) : (
        <div className="space-y-2">
          {deathList.death_list.map((d) => (
            <div key={d.ticker} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{d.name}</p>
                <p className="text-xs text-gray-500">{d.ticker} · {d.sector}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{d.yesterday_rank}위</span>
                <ArrowDown className="h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">
                  {d.dropped_out ? "순위권 밖" : `${d.today_rank}위`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
