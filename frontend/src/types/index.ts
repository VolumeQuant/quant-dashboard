/* ───────────── Core Stock ───────────── */
export interface Stock {
  rank: number;
  composite_rank: number;
  ticker: string;
  name: string;
  score: number;
  sector: string;
  per: number | null;
  pbr: number | null;
  roe?: number | null;
  fwd_per?: number | null;
  value_s: number | null;
  quality_s: number | null;
  growth_s: number | null;
  momentum_s: number | null;
}

/* ───────────── Ranking ───────────── */
export interface RankingMetadata {
  total_universe: number;
  prefilter_passed: number;
  scored_count: number;
  version: string;
}

export interface RankingData {
  date: string;
  generated_at: string;
  rankings: Stock[];
  metadata?: RankingMetadata;
}

/* ───────────── Picks ───────────── */
export interface FactorGrades {
  value: string;
  quality: string;
  growth: string;
  momentum: string;
}

export interface Pick {
  ticker: string;
  name: string;
  sector: string;
  weighted_rank: number;
  composite_rank: number;
  score: number;
  per: number | null;
  pbr: number | null;
  roe?: number | null;
  fwd_per?: number | null;
  trajectory: number[];
  factor_grades?: FactorGrades;
  weight?: number;
  buy_rationale?: string;
}

export interface PicksResponse {
  picks: Pick[];
  dates?: string[];
  total_common?: number;
  skipped?: number;
  message?: string;
}

/* ───────────── Death List ───────────── */
export interface DeathListItem {
  ticker: string;
  name: string;
  sector: string;
  yesterday_rank: number;
  today_rank: number | null;
  dropped_out: boolean;
  exit_reason?: string[];
}

export interface DeathListResponse {
  death_list: DeathListItem[];
  dates: { yesterday: string; today: string };
  message?: string;
}

/* ───────────── Market ───────────── */
export interface IndexData {
  close: number | null;
  change_pct: number | null;
}

export interface HYData {
  value: number | null;
  median: number | null;
  quadrant: string;
  season: string;
  season_icon: string;
  q_days: number;
  direction: string;
  signals: string[];
}

export interface KRData {
  spread: number | null;
  regime: string;
  regime_label: string;
  regime_icon: string;
}

export interface VIXData {
  value: number | null;
  percentile: number | null;
  slope_direction: string;
  regime: string;
  regime_label: string;
  regime_icon: string;
}

export interface ActionData {
  text: string;
  grade: string;
}

export interface CreditData {
  hy: HYData | null;
  kr: KRData | null;
  vix: VIXData | null;
  concordance?: string | null;
  action?: ActionData | null;
}

export interface MarketResponse {
  indices: {
    kospi: IndexData | null;
    kosdaq: IndexData | null;
  };
  credit: CreditData | null;
  warnings: string[];
  date: string;
}

/* ───────────── Pipeline ───────────── */
export interface PipelineResponse {
  verified: string[];
  pending: string[];
  new_entry: string[];
  sectors: Record<string, number>;
}

/* ───────────── AI ───────────── */
export interface AIResponse {
  risk_filter: string;
  picks_text: string;
  flagged_tickers: string[];
  available: boolean;
}

/* ───────────── History ───────────── */
export interface StockHistory {
  date: string;
  rank: number;
  composite_rank: number;
  score: number;
  value_s: number | null;
  quality_s: number | null;
  growth_s: number | null;
  momentum_s: number | null;
}

export interface AllHistoryStock {
  name: string;
  sector: string;
  history: { date: string; composite_rank: number; score: number }[];
}

export interface AllHistoryResponse {
  stocks: Record<string, AllHistoryStock>;
  dates: string[];
}

/* ───────────── Factor Grades ───────────── */
export type GradeLetter = "A+" | "A" | "B+" | "B" | "C" | "D";

export interface FactorInfo {
  key: "value" | "quality" | "growth" | "momentum";
  label: string;
  labelKr: string;
  color: string;
  score: number | null;
}

/* ───────────── Sort ───────────── */
export type SortDirection = "asc" | "desc";
export interface SortConfig {
  key: string;
  direction: SortDirection;
}
