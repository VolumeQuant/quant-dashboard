import type { GradeLetter } from "../types";

/**
 * Convert a z-score (within Top 30 stocks) to a letter grade.
 *
 * Mapping (based on percentile within the group):
 *   A+: top 10% (z >= 1.28)
 *   A:  top 20% (z >= 0.84)
 *   B+: top 30% (z >= 0.52)
 *   B:  top 50% (z >= 0.00)
 *   C:  top 70% (z >= -0.52)
 *   D:  bottom 30%
 */
export function scoreToGrade(score: number | null): GradeLetter {
  if (score == null) return "D";
  if (score >= 1.28) return "A+";
  if (score >= 0.84) return "A";
  if (score >= 0.52) return "B+";
  if (score >= 0.0) return "B";
  if (score >= -0.52) return "C";
  return "D";
}

const gradeStyles: Record<GradeLetter, { bg: string; text: string }> = {
  "A+": { bg: "bg-emerald-500/20 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  A: { bg: "bg-emerald-500/15 dark:bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400" },
  "B+": { bg: "bg-blue-500/15 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  B: { bg: "bg-blue-500/10 dark:bg-blue-500/8", text: "text-blue-500 dark:text-blue-400" },
  C: { bg: "bg-amber-500/15 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  D: { bg: "bg-red-500/15 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400" },
};

interface FactorGradeProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function FactorGrade({ score, size = "sm", showScore = false }: FactorGradeProps) {
  const grade = scoreToGrade(score);
  const style = gradeStyles[grade];

  const sizeClasses = {
    sm: "w-10 h-7 text-xs",
    md: "w-12 h-8 text-sm",
    lg: "w-16 h-10 text-base",
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center justify-center rounded-md font-bold ${sizeClasses[size]} ${style.bg} ${style.text}`}
      >
        {grade}
      </span>
      {showScore && score != null && (
        <span className="font-mono text-xs text-content-secondary">
          {score.toFixed(2)}
        </span>
      )}
    </span>
  );
}

/**
 * Larger factor grade card with label, used in StockDetail page.
 */
interface FactorGradeCardProps {
  label: string;
  labelKr: string;
  score: number | null;
  color: string;
}

export function FactorGradeCard({ label, labelKr, score, color }: FactorGradeCardProps) {
  const grade = scoreToGrade(score);
  const style = gradeStyles[grade];
  const percentile = score != null ? Math.min(99, Math.max(1, Math.round(50 + (score * 50) / 3))) : null;

  return (
    <div className="card p-4 flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-content-secondary">{label}</span>
      </div>
      <span className="text-sm text-content-tertiary">{labelKr}</span>
      <span
        className={`inline-flex items-center justify-center w-16 h-10 rounded-lg text-lg font-bold ${style.bg} ${style.text}`}
      >
        {grade}
      </span>
      <div className="text-center">
        <p className="font-mono text-sm font-semibold text-content-primary">
          {score != null ? score.toFixed(3) : "-"}
        </p>
        {percentile != null && (
          <p className="text-xs text-content-tertiary">
            상위 {100 - percentile}%
          </p>
        )}
      </div>
    </div>
  );
}
