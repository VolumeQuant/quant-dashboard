import type { Stock } from "../types";
import { Link } from "react-router-dom";

export function TopStocksTable({ stocks, title }: { stocks: Stock[]; title: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">순위</th>
              <th className="px-4 py-3 text-left">종목</th>
              <th className="px-4 py-3 text-left">섹터</th>
              <th className="px-4 py-3 text-right">총점</th>
              <th className="px-4 py-3 text-right">PER</th>
              <th className="px-4 py-3 text-right">PBR</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-right">Quality</th>
              <th className="px-4 py-3 text-right">Growth</th>
              <th className="px-4 py-3 text-right">Momentum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stocks.map((s) => (
              <tr key={s.ticker} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3">
                  <RankBadge rank={s.composite_rank} />
                </td>
                <td className="px-4 py-3">
                  <Link to={`/stock/${s.ticker}`} className="hover:text-blue-600">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.ticker}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.sector}</td>
                <td className="px-4 py-3 text-right font-mono font-medium">{s.score?.toFixed(3)}</td>
                <td className="px-4 py-3 text-right font-mono">{s.per?.toFixed(1) ?? "-"}</td>
                <td className="px-4 py-3 text-right font-mono">{s.pbr?.toFixed(2) ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <FactorBar value={s.value_s} />
                </td>
                <td className="px-4 py-3 text-right">
                  <FactorBar value={s.quality_s} />
                </td>
                <td className="px-4 py-3 text-right">
                  <FactorBar value={s.growth_s} />
                </td>
                <td className="px-4 py-3 text-right">
                  <FactorBar value={s.momentum_s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const color =
    rank <= 3 ? "bg-yellow-100 text-yellow-800" :
    rank <= 10 ? "bg-blue-100 text-blue-800" :
    "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${color}`}>
      {rank}
    </span>
  );
}

function FactorBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-300">-</span>;
  const clamped = Math.max(-3, Math.min(3, value));
  const pct = ((clamped + 3) / 6) * 100;
  const color = value >= 0 ? "bg-green-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono w-10 text-right ${value >= 0 ? "text-green-600" : "text-red-500"}`}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}
