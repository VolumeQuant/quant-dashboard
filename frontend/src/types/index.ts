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

export interface RankingData {
  date: string;
  generated_at: string;
  rankings: Stock[];
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
  trajectory: number[];
}

export interface PicksResponse {
  picks: Pick[];
  dates?: string[];
  total_common?: number;
  message?: string;
}

export interface DeathListItem {
  ticker: string;
  name: string;
  sector: string;
  yesterday_rank: number;
  today_rank: number | null;
  dropped_out: boolean;
}

export interface DeathListResponse {
  death_list: DeathListItem[];
  dates: { yesterday: string; today: string };
}

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
