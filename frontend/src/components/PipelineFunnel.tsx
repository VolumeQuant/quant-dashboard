import type { RankingMetadata } from "../types";
import { Filter } from "lucide-react";

interface PipelineFunnelProps {
  metadata: RankingMetadata | undefined;
  picksCount: number;
}

const steps = [
  { key: "universe", label: "유니버스", desc: "시총 3000억+ PER<=60", color: "from-slate-500/30 to-slate-500/10", accent: "text-slate-400", ring: "ring-slate-500/30" },
  { key: "prefilter", label: "사전필터", desc: "마법공식 Top200", color: "from-blue-500/30 to-blue-500/10", accent: "text-blue-400", ring: "ring-blue-500/30" },
  { key: "scored", label: "스코어링", desc: "멀티팩터 점수", color: "from-indigo-500/30 to-indigo-500/10", accent: "text-indigo-400", ring: "ring-indigo-500/30" },
  { key: "top30", label: "Top 30", desc: "일일 순위", color: "from-purple-500/30 to-purple-500/10", accent: "text-purple-400", ring: "ring-purple-500/30" },
  { key: "picks", label: "최종 추천", desc: "3일 교집합", color: "from-emerald-500/30 to-emerald-500/10", accent: "text-emerald-400", ring: "ring-emerald-500/30" },
];

export function PipelineFunnel({ metadata, picksCount }: PipelineFunnelProps) {
  if (!metadata) return null;

  const values: Record<string, number> = {
    universe: metadata.total_universe,
    prefilter: metadata.prefilter_passed,
    scored: metadata.scored_count,
    top30: 30,
    picks: picksCount,
  };

  const maxVal = metadata.total_universe || 1;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Filter className="h-5 w-5 text-content-tertiary" />
        <h2 className="text-base font-semibold text-content-primary">선정 파이프라인</h2>
      </div>

      {/* Desktop: horizontal funnel */}
      <div className="hidden md:block">
        <div className="flex items-end gap-2">
          {steps.map((step, i) => {
            const val = values[step.key];
            const heightPct = Math.max(20, (val / maxVal) * 100);
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
                {/* Bar */}
                <div className="w-full flex flex-col items-center">
                  <span className={`font-mono text-xl font-bold ${step.accent}`}>
                    {val.toLocaleString()}
                  </span>
                  <div
                    className={`w-full rounded-lg bg-gradient-to-t ${step.color} mt-1 transition-all duration-500 ${
                      i === steps.length - 1 ? "ring-2 " + step.ring : ""
                    }`}
                    style={{ height: `${heightPct}px`, minHeight: "20px" }}
                  />
                </div>
                {/* Label */}
                <div className="text-center">
                  <p className="text-xs font-medium text-content-primary">{step.label}</p>
                  <p className="text-[10px] text-content-tertiary">{step.desc}</p>
                </div>
                {/* Arrow */}
                {i < steps.length - 1 && (
                  <div className="absolute" style={{ display: "none" }}>
                    {/* arrows handled by gap */}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Connecting arrows */}
        <div className="flex items-center justify-center mt-3 gap-1">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1 justify-center">
              {i > 0 && (
                <svg className="w-5 h-3 text-content-tertiary mr-1" viewBox="0 0 20 12">
                  <path d="M0 6h16M12 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical funnel */}
      <div className="md:hidden space-y-2">
        {steps.map((step, i) => {
          const val = values[step.key];
          const widthPct = Math.max(25, (val / maxVal) * 100);
          return (
            <div key={step.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-content-secondary">{step.label}</span>
                <span className={`font-mono text-sm font-bold ${step.accent}`}>
                  {val.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${step.color} transition-all duration-500`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <svg className="w-3 h-4 text-content-tertiary" viewBox="0 0 12 16">
                    <path d="M6 0v12M1 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
