import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { RankingData, PicksResponse, DeathListResponse } from "../types";
import { PicksCard } from "../components/PicksCard";
import { DeathListCard } from "../components/DeathListCard";
import { TopStocksTable } from "../components/TopStocksTable";
import { TrendingUp, Shield, Skull, BarChart3 } from "lucide-react";

export function Dashboard() {
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [picks, setPicks] = useState<PicksResponse | null>(null);
  const [deathList, setDeathList] = useState<DeathListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLatestRanking(),
      api.getPicks(),
      api.getDeathList(),
    ])
      .then(([r, p, d]) => {
        setRanking(r);
        setPicks(p);
        setDeathList(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const formatDate = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">퀀트 대시보드</h1>
          {ranking && (
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(ranking.date)} 기준 · {ranking.rankings.length}개 종목 분석
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            v19.1
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Slow In, Fast Out
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
          label="분석 종목"
          value={ranking?.rankings.length ?? 0}
          sub="유니버스"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="최종 추천"
          value={picks?.picks.length ?? 0}
          sub={`${picks?.total_common ?? 0}개 교집합 중`}
        />
        <StatCard
          icon={<Shield className="h-5 w-5 text-yellow-500" />}
          label="3일 검증"
          value={picks?.dates?.length ?? 0}
          sub="거래일"
        />
        <StatCard
          icon={<Skull className="h-5 w-5 text-red-500" />}
          label="이탈 종목"
          value={deathList?.death_list.length ?? 0}
          sub="Death List"
        />
      </div>

      {/* Picks + Death List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PicksCard picks={picks} />
        <DeathListCard deathList={deathList} />
      </div>

      {/* Top 30 Table */}
      {ranking && <TopStocksTable stocks={ranking.rankings.slice(0, 30)} title="Top 30 순위" />}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">
          {label} · {sub}
        </p>
      </div>
    </div>
  );
}
