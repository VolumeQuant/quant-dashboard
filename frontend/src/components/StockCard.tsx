import { Link } from "react-router-dom";
import type { Pick } from "../types";
import { FactorGrade, scoreToGrade } from "./FactorGrade";
import { ArrowRight, TrendingUp, ExternalLink } from "lucide-react";

interface StockCardProps {
  pick: Pick;
  index: number;
}

/**
 * Mini sparkline for the trajectory (3 data points).
 * Draws a simple polyline in an SVG.
 */
function TrajectorySparkline({ trajectory }: { trajectory: number[] }) {
  if (!trajectory || trajectory.length === 0) return null;

  const height = 28;
  const width = 60;
  const padding = 4;

  const maxVal = Math.max(...trajectory, 30);
  const minVal = Math.min(...trajectory, 1);
  const range = maxVal - minVal || 1;

  const points = trajectory.map((val, i) => {
    const x = padding + (i / Math.max(trajectory.length - 1, 1)) * (width - 2 * padding);
    // Invert Y because lower rank = better = higher on chart
    const y = padding + ((val - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(" ");

  const lastVal = trajectory[trajectory.length - 1];
  const firstVal = trajectory[0];
  const improving = lastVal <= firstVal;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={improving ? "var(--positive)" : "var(--negative)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last dot */}
      {trajectory.length > 0 && (
        <circle
          cx={padding + ((trajectory.length - 1) / Math.max(trajectory.length - 1, 1)) * (width - 2 * padding)}
          cy={padding + ((lastVal - minVal) / range) * (height - 2 * padding)}
          r="3"
          fill={improving ? "var(--positive)" : "var(--negative)"}
        />
      )}
    </svg>
  );
}

export function StockCard({ pick, index }: StockCardProps) {
  const factorScores = pick.factor_grades
    ? null
    : {
        value: pick.per != null ? null : null,
        quality: null,
        growth: null,
        momentum: null,
      };

  // We won't have individual factor scores in the picks response,
  // but we show the trajectory and basic info
  void factorScores;

  return (
    <div className="card card-hover p-4 group relative">
      {/* Rank badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-sm">
            {index + 1}
          </span>
          <div>
            <Link
              to={`/stock/${pick.ticker}`}
              className="text-sm font-semibold text-content-primary hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              {pick.name}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-xs text-content-tertiary">{pick.ticker} · {pick.sector}</p>
          </div>
        </div>
        <TrajectorySparkline trajectory={pick.trajectory} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-[10px] text-content-tertiary">가중 순위</p>
          <p className="font-mono text-sm font-semibold text-content-primary">{pick.weighted_rank}위</p>
        </div>
        <div>
          <p className="text-[10px] text-content-tertiary">PER</p>
          <p className="font-mono text-sm text-content-primary">{pick.per?.toFixed(1) ?? "-"}</p>
        </div>
        <div>
          <p className="text-[10px] text-content-tertiary">PBR</p>
          <p className="font-mono text-sm text-content-primary">{pick.pbr?.toFixed(2) ?? "-"}</p>
        </div>
      </div>

      {/* Trajectory detail */}
      <div className="flex items-center gap-1 text-xs text-content-tertiary">
        <TrendingUp className="h-3 w-3" />
        {pick.trajectory.map((r, j) => (
          <span key={j} className="flex items-center">
            <span
              className={`font-mono font-semibold ${
                r <= 5 ? "text-emerald-400" : r <= 15 ? "text-blue-400" : "text-content-secondary"
              }`}
            >
              {r}위
            </span>
            {j < pick.trajectory.length - 1 && (
              <ArrowRight className="h-3 w-3 mx-0.5 text-content-tertiary" />
            )}
          </span>
        ))}
      </div>

      {/* Factor grades if available */}
      {pick.factor_grades && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
          <FactorLabel letter="V" grade={pick.factor_grades.value} />
          <FactorLabel letter="Q" grade={pick.factor_grades.quality} />
          <FactorLabel letter="G" grade={pick.factor_grades.growth} />
          <FactorLabel letter="M" grade={pick.factor_grades.momentum} />
        </div>
      )}

      {/* Buy rationale */}
      {pick.buy_rationale && (
        <p className="text-[11px] text-content-secondary mt-2 pt-2 border-t border-border leading-relaxed">
          {pick.buy_rationale}
        </p>
      )}

      {/* Weight if available */}
      {pick.weight != null && (
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-content-tertiary">비중</span>
          <span className="text-sm font-bold text-emerald-400">{pick.weight}%</span>
        </div>
      )}
    </div>
  );
}

function FactorLabel({ letter, grade }: { letter: string; grade: string }) {
  const gradeVal = scoreToGrade(
    grade === "A+" ? 1.5 : grade === "A" ? 1.0 : grade === "B+" ? 0.7 :
    grade === "B" ? 0.2 : grade === "C" ? -0.3 : -1.0
  );
  void gradeVal;
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="text-[10px] font-medium text-content-tertiary">{letter}</span>
      <FactorGrade score={
        grade === "A+" ? 1.5 : grade === "A" ? 1.0 : grade === "B+" ? 0.7 :
        grade === "B" ? 0.2 : grade === "C" ? -0.3 : -1.0
      } size="sm" />
    </span>
  );
}
