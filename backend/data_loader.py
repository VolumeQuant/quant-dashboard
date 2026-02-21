"""
quant_py-main의 state/ranking JSON, web_data JSON, credit_monitor를 읽어서 API용 데이터로 변환

v2.0 — 웹 대시보드 전용 확장:
  - load_web_cache: web_data_YYYYMMDD.json 로드
  - get_market_data: 시장 지표 (인덱스 + 신용시장 + VIX)
  - compute_pipeline_status: 파이프라인 (verified/pending/new)
  - compute_factor_grades: 팩터별 등급 (A+~D)
  - get_ai_data: AI 분석 결과
  - Enhanced compute_picks / compute_death_list
"""
import json
import os
import glob
from pathlib import Path
from typing import Optional

# quant_py-main 프로젝트 경로
QUANT_PROJECT = Path(__file__).resolve().parent.parent.parent / "quant_py-main" / "claude code" / "quant_py-main"
STATE_DIR = QUANT_PROJECT / "state"
OUTPUT_DIR = QUANT_PROJECT / "output"


# ============================================================
# 기존 함수 (유지)
# ============================================================

def get_available_dates() -> list[str]:
    """state/ 디렉토리에서 사용 가능한 날짜 목록 반환 (최신순)"""
    pattern = str(STATE_DIR / "ranking_*.json")
    files = glob.glob(pattern)
    dates = []
    for f in files:
        name = os.path.basename(f)
        date_str = name.replace("ranking_", "").replace(".json", "")
        if date_str.isdigit() and len(date_str) == 8:
            dates.append(date_str)
    dates.sort(reverse=True)
    return dates


def _get_web_cache_dates() -> list[str]:
    """state/ 디렉토리에서 web_data 캐시 날짜 목록 반환 (최신순)"""
    pattern = str(STATE_DIR / "web_data_*.json")
    files = glob.glob(pattern)
    dates = []
    for f in files:
        name = os.path.basename(f)
        date_str = name.replace("web_data_", "").replace(".json", "")
        if date_str.isdigit() and len(date_str) == 8:
            dates.append(date_str)
    dates.sort(reverse=True)
    return dates


def load_ranking(date: str) -> Optional[dict]:
    """특정 날짜의 ranking JSON 로드"""
    path = STATE_DIR / f"ranking_{date}.json"
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_latest_ranking() -> Optional[dict]:
    """최신 ranking JSON 로드"""
    dates = get_available_dates()
    if not dates:
        return None
    return load_ranking(dates[0])


def get_ranking_history(ticker: str) -> list[dict]:
    """특정 종목의 날짜별 순위 히스토리"""
    dates = get_available_dates()
    history = []
    for date in reversed(dates):  # 오래된 순
        data = load_ranking(date)
        if not data:
            continue
        for stock in data.get("rankings", []):
            if stock["ticker"] == ticker:
                history.append({
                    "date": date,
                    "rank": stock.get("rank"),
                    "composite_rank": stock.get("composite_rank", stock.get("rank")),
                    "score": stock.get("score", 0),
                    "value_s": stock.get("value_s"),
                    "quality_s": stock.get("quality_s"),
                    "growth_s": stock.get("growth_s"),
                    "momentum_s": stock.get("momentum_s"),
                })
                break
    return history


def get_all_history() -> dict:
    """전 종목의 날짜별 순위 변동 (Top 30만)"""
    dates = get_available_dates()
    result = {}  # ticker -> [{date, rank, name, ...}]

    for date in reversed(dates):
        data = load_ranking(date)
        if not data:
            continue
        for stock in data.get("rankings", []):
            cr = stock.get("composite_rank", stock.get("rank", 999))
            if cr > 30:
                continue
            ticker = stock["ticker"]
            if ticker not in result:
                result[ticker] = {"name": stock["name"], "sector": stock.get("sector", ""), "history": []}
            result[ticker]["history"].append({
                "date": date,
                "composite_rank": cr,
                "score": stock.get("score", 0),
            })

    return {"stocks": result, "dates": list(reversed(dates))}


# ============================================================
# 새 함수: Web Cache 로드
# ============================================================

def load_web_cache(date: str = None) -> Optional[dict]:
    """
    state/web_data_YYYYMMDD.json 로드
    - date가 None이면 가장 최신 캐시
    - 없으면 None 반환
    """
    if date:
        path = STATE_DIR / f"web_data_{date}.json"
        if not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None

    # 최신 캐시 찾기
    cache_dates = _get_web_cache_dates()
    if not cache_dates:
        return None
    path = STATE_DIR / f"web_data_{cache_dates[0]}.json"
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


# ============================================================
# 새 함수: Market Data (시장 지표)
# ============================================================

def get_market_data() -> dict:
    """
    시장 지표 반환: 인덱스 + 신용시장(HY/KR/VIX) + 행동 등급

    1순위: web_data 캐시에서 로드
    2순위: credit_monitor.py에서 실시간 수집 (fallback)
    3순위: 빈 기본값 반환
    """
    # 1순위: web_data 캐시
    cache = load_web_cache()
    if cache:
        return _market_from_cache(cache)

    # 2순위: credit_monitor 실시간 수집
    try:
        return _market_from_live()
    except Exception as e:
        print(f"[market] 실시간 수집 실패: {e}")

    # 3순위: 기본값
    return _market_empty()


def _market_from_cache(cache: dict) -> dict:
    """web_data 캐시에서 마켓 데이터 추출"""
    market_raw = cache.get("market", {})
    credit_raw = cache.get("credit", {})
    hy_raw = credit_raw.get("hy") or {}
    kr_raw = credit_raw.get("kr") or {}
    vix_raw = credit_raw.get("vix") or {}

    # indices
    indices = {}
    for key in ("kospi", "kosdaq"):
        idx = market_raw.get(key, {})
        indices[key] = {
            "close": _safe_float(idx.get("close")),
            "change_pct": _safe_float(idx.get("change_pct")),
        }

    # credit - HY
    hy = None
    if hy_raw:
        hy = {
            "value": _safe_float(hy_raw.get("hy_spread")),
            "median": _safe_float(hy_raw.get("median_10y")),
            "quadrant": hy_raw.get("quadrant", ""),
            "season": hy_raw.get("quadrant_label", ""),
            "season_icon": hy_raw.get("quadrant_icon", ""),
            "q_days": hy_raw.get("q_days", 0),
            "direction": "rising" if hy_raw.get("quadrant") in ("Q3", "Q4") else "falling",
            "signals": hy_raw.get("signals", []),
        }

    # credit - KR
    kr = None
    if kr_raw:
        kr = {
            "spread": _safe_float(kr_raw.get("spread")),
            "regime": kr_raw.get("regime", "normal"),
            "regime_label": kr_raw.get("regime_label", ""),
            "regime_icon": kr_raw.get("regime_icon", ""),
        }

    # credit - VIX
    vix = None
    if vix_raw:
        vix = {
            "value": _safe_float(vix_raw.get("vix_current")),
            "percentile": _safe_float(vix_raw.get("vix_pct")),
            "slope_direction": vix_raw.get("vix_slope_dir", "flat"),
            "regime": vix_raw.get("regime", "normal"),
            "regime_label": vix_raw.get("regime_label", ""),
            "regime_icon": vix_raw.get("regime_icon", ""),
        }

    # action
    final_action = credit_raw.get("final_action", "")
    concordance = credit_raw.get("concordance", "both_stable")
    action_grade = _action_to_grade(final_action)
    pick_level = _compute_pick_level(final_action)

    return {
        "indices": indices,
        "credit": {
            "hy": hy,
            "kr": kr,
            "vix": vix,
            "concordance": concordance,
            "action": {
                "text": final_action,
                "grade": action_grade,
            },
        },
        "pick_level": pick_level,
        "warnings": market_raw.get("warnings", []),
        "date": cache.get("date", ""),
    }


def _market_from_live() -> dict:
    """credit_monitor.py에서 실시간으로 수집 (fallback)"""
    import sys
    quant_path = str(QUANT_PROJECT)
    if quant_path not in sys.path:
        sys.path.insert(0, quant_path)

    from credit_monitor import get_credit_status

    credit = get_credit_status()
    hy_raw = credit.get("hy") or {}
    kr_raw = credit.get("kr") or {}
    vix_raw = credit.get("vix") or {}

    hy = None
    if hy_raw:
        hy = {
            "value": _safe_float(hy_raw.get("hy_spread")),
            "median": _safe_float(hy_raw.get("median_10y")),
            "quadrant": hy_raw.get("quadrant", ""),
            "season": hy_raw.get("quadrant_label", ""),
            "season_icon": hy_raw.get("quadrant_icon", ""),
            "q_days": hy_raw.get("q_days", 0),
            "direction": "rising" if hy_raw.get("quadrant") in ("Q3", "Q4") else "falling",
            "signals": hy_raw.get("signals", []),
        }

    kr = None
    if kr_raw:
        kr = {
            "spread": _safe_float(kr_raw.get("spread")),
            "regime": kr_raw.get("regime", "normal"),
            "regime_label": kr_raw.get("regime_label", ""),
            "regime_icon": kr_raw.get("regime_icon", ""),
        }

    vix = None
    if vix_raw:
        vix = {
            "value": _safe_float(vix_raw.get("vix_current")),
            "percentile": _safe_float(vix_raw.get("vix_pct")),
            "slope_direction": vix_raw.get("vix_slope_dir", "flat"),
            "regime": vix_raw.get("regime", "normal"),
            "regime_label": vix_raw.get("regime_label", ""),
            "regime_icon": vix_raw.get("regime_icon", ""),
        }

    final_action = credit.get("final_action", "")
    concordance = credit.get("concordance", "both_stable")
    action_grade = _action_to_grade(final_action)
    pick_level = _compute_pick_level(final_action)

    dates = get_available_dates()
    return {
        "indices": {
            "kospi": {"close": None, "change_pct": None},
            "kosdaq": {"close": None, "change_pct": None},
        },
        "credit": {
            "hy": hy,
            "kr": kr,
            "vix": vix,
            "concordance": concordance,
            "action": {
                "text": final_action,
                "grade": action_grade,
            },
        },
        "pick_level": pick_level,
        "warnings": [],
        "date": dates[0] if dates else "",
    }


def _market_empty() -> dict:
    """마켓 데이터 없을 때 기본값"""
    dates = get_available_dates()
    return {
        "indices": {
            "kospi": {"close": None, "change_pct": None},
            "kosdaq": {"close": None, "change_pct": None},
        },
        "credit": {
            "hy": None,
            "kr": None,
            "vix": None,
            "concordance": "both_stable",
            "action": {
                "text": "데이터 수집 실패로 기본값을 적용했어요.",
                "grade": "unknown",
            },
        },
        "pick_level": {"max_picks": 5, "label": "정상", "warning": None},
        "warnings": [],
        "date": dates[0] if dates else "",
    }


def _compute_pick_level(action_text: str) -> dict:
    """시장 위험 상태에 따른 추천 종목 수 결정 (v20.4)"""
    if not action_text:
        return {'max_picks': 5, 'label': '정상', 'warning': None}
    if '즉시 매도' in action_text:
        return {'max_picks': 0, 'label': '전량 매도',
                'warning': '🚨 시장 위험으로 매수를 중단합니다. 보유 종목 매도를 검토하세요.'}
    elif '매도하세요' in action_text:
        return {'max_picks': 0, 'label': '매도',
                'warning': '⚠️ 시장 위험으로 매수를 중단합니다. 보유 종목 매도를 검토하세요.'}
    elif '멈추' in action_text:
        return {'max_picks': 0, 'label': '매수 중단',
                'warning': '⚠️ 시장 위험으로 신규 매수를 중단합니다.'}
    elif '관망' in action_text:
        return {'max_picks': 0, 'label': '관망',
                'warning': '시장 불확실성으로 관망합니다.'}
    elif '줄이' in action_text:
        return {'max_picks': 3, 'label': '축소',
                'warning': '⚠️ 시장 경고로 추천을 3종목으로 축소합니다.'}
    elif '분할 매수' in action_text:
        return {'max_picks': 3, 'label': '분할 매수', 'warning': None}
    elif '신중' in action_text:
        return {'max_picks': 5, 'label': '신중',
                'warning': '신규 매수 시 신중하세요.'}
    else:
        return {'max_picks': 5, 'label': '정상', 'warning': None}


def _action_to_grade(action_text: str) -> str:
    """행동 멘트 → 등급 변환 (프론트엔드 색상 매핑용)"""
    if not action_text:
        return "unknown"
    text = action_text.lower()
    # 가장 위험 → 가장 안전 순서로 매칭
    if "즉시 매도" in action_text or "🚨" in action_text:
        return "danger"
    if "보유 종목을 매도" in action_text or "보유 종목을 줄이" in action_text:
        return "high_risk"
    if "신규 매수를 멈추" in action_text:
        return "reduce"
    if "신규 매수를 줄이" in action_text:
        return "caution"
    if "신중" in action_text:
        return "caution"
    if "분할 매수" in action_text:
        return "accumulate"
    if "적극 매수" in action_text or "적극 투자" in action_text:
        return "aggressive"
    if "평소대로" in action_text:
        return "normal"
    return "neutral"


# ============================================================
# 새 함수: Pipeline Status (파이프라인)
# ============================================================

def compute_pipeline_status(top_n: int = 30) -> dict:
    """
    Top 30 종목의 파이프라인 상태 계산

    1순위: web_data 캐시에서 로드
    2순위: ranking JSON 3개 로드하여 직접 계산

    Returns:
        {
            "verified": [3일 연속 Top30],
            "pending": [2일 연속],
            "new_entry": [신규 진입],
            "sectors": {"반도체": 5, ...}
        }
    """
    # 1순위: web_data 캐시
    cache = load_web_cache()
    if cache and cache.get("pipeline"):
        return _pipeline_from_cache(cache)

    # 2순위: ranking JSON에서 직접 계산
    return _pipeline_from_rankings(top_n)


def _pipeline_from_cache(cache: dict) -> dict:
    """web_data 캐시에서 파이프라인 추출"""
    pipeline_raw = cache.get("pipeline", {})
    sectors_raw = cache.get("sectors", {})

    def _normalize_stock(stock: dict, status: str) -> dict:
        """캐시 종목 데이터를 API 포맷으로 정규화"""
        base = {
            "ticker": stock.get("ticker", ""),
            "name": stock.get("name", ""),
            "sector": stock.get("sector", ""),
            "rank": stock.get("rank", stock.get("composite_rank", 999)),
            "composite_rank": stock.get("composite_rank", stock.get("rank", 999)),
            "score": _safe_float(stock.get("score")),
            "per": _safe_float(stock.get("per")),
            "pbr": _safe_float(stock.get("pbr")),
            "roe": _safe_float(stock.get("roe")),
            "fwd_per": _safe_float(stock.get("fwd_per")),
            "status": status,
        }
        return base

    verified = [_normalize_stock(s, "verified") for s in pipeline_raw.get("verified", [])]
    pending = [_normalize_stock(s, "pending") for s in pipeline_raw.get("pending", [])]
    new_entry = [_normalize_stock(s, "new_entry") for s in pipeline_raw.get("new_entry", [])]

    return {
        "verified": verified,
        "pending": pending,
        "new_entry": new_entry,
        "sectors": sectors_raw,
    }


def _pipeline_from_rankings(top_n: int = 30) -> dict:
    """ranking JSON에서 직접 파이프라인 계산"""
    dates = get_available_dates()
    if not dates:
        return {"verified": [], "pending": [], "new_entry": [], "sectors": {}}

    rankings = []
    for i in range(min(3, len(dates))):
        data = load_ranking(dates[i])
        if data:
            rankings.append(data)

    if not rankings:
        return {"verified": [], "pending": [], "new_entry": [], "sectors": {}}

    # T-0 Top N
    t0_map = {}
    for stock in rankings[0].get("rankings", []):
        cr = stock.get("composite_rank", stock.get("rank", 999))
        if cr <= top_n:
            t0_map[stock["ticker"]] = stock

    # T-1, T-2 ticker sets
    t1_set = set()
    if len(rankings) > 1:
        for stock in rankings[1].get("rankings", []):
            cr = stock.get("composite_rank", stock.get("rank", 999))
            if cr <= top_n:
                t1_set.add(stock["ticker"])

    t2_set = set()
    if len(rankings) > 2:
        for stock in rankings[2].get("rankings", []):
            cr = stock.get("composite_rank", stock.get("rank", 999))
            if cr <= top_n:
                t2_set.add(stock["ticker"])

    # trajectory 계산 헬퍼
    def _get_rank_from_day(ticker: str, day_data: dict, top_n: int) -> Optional[int]:
        for s in day_data.get("rankings", []):
            if s["ticker"] == ticker:
                return s.get("composite_rank", s.get("rank", 999))
        return None

    verified, pending, new_entry = [], [], []
    sectors = {}

    for ticker, stock in t0_map.items():
        in_t1 = ticker in t1_set
        in_t2 = ticker in t2_set

        base = {
            "ticker": ticker,
            "name": stock["name"],
            "sector": stock.get("sector", ""),
            "rank": stock.get("rank", 999),
            "composite_rank": stock.get("composite_rank", stock.get("rank", 999)),
            "score": _safe_float(stock.get("score")),
            "per": _safe_float(stock.get("per")),
            "pbr": _safe_float(stock.get("pbr")),
            "roe": _safe_float(stock.get("roe")),
            "fwd_per": _safe_float(stock.get("fwd_per")),
        }

        # trajectory: [T-2, T-1, T-0]
        trajectory = []
        if len(rankings) > 2:
            trajectory.append(_get_rank_from_day(ticker, rankings[2], 999))
        if len(rankings) > 1:
            trajectory.append(_get_rank_from_day(ticker, rankings[1], 999))
        trajectory.append(stock.get("composite_rank", stock.get("rank", 999)))
        base["trajectory"] = trajectory

        if in_t1 and in_t2:
            base["status"] = "verified"
            # 가중순위 계산
            ranks = []
            for i, day_data in enumerate(rankings[:3]):
                r = _get_rank_from_day(ticker, day_data, 999) or 999
                ranks.append(r)
            base["weighted_rank"] = round(ranks[0] * 0.5 + ranks[1] * 0.3 + (ranks[2] if len(ranks) > 2 else ranks[-1]) * 0.2, 1)
            verified.append(base)
        elif in_t1:
            base["status"] = "pending"
            pending.append(base)
        else:
            base["status"] = "new_entry"
            new_entry.append(base)

        # 섹터 집계
        sec = stock.get("sector", "기타") or "기타"
        sectors[sec] = sectors.get(sec, 0) + 1

    verified.sort(key=lambda x: x.get("weighted_rank", 999))
    pending.sort(key=lambda x: x["rank"])
    new_entry.sort(key=lambda x: x["rank"])

    return {
        "verified": verified,
        "pending": pending,
        "new_entry": new_entry,
        "sectors": sectors,
    }


# ============================================================
# 새 함수: Factor Grades (팩터 등급)
# ============================================================

def compute_factor_grades(stocks: list) -> dict:
    """
    Top 30 종목의 팩터별 등급 계산

    각 팩터(value_s, quality_s, growth_s, momentum_s)에 대해:
    - Top 30 내 순위 산정
    - 백분위 → 등급: top 10%=A+, 20%=A, 30%=B+, 50%=B, 70%=C, bottom=D

    Args:
        stocks: ranking JSON의 rankings 리스트 (Top 30만)

    Returns:
        {ticker: {"value": "A+", "quality": "B", "growth": "C", "momentum": "A"}}
    """
    if not stocks:
        return {}

    n = len(stocks)
    factors = {
        "value_s": "value",
        "quality_s": "quality",
        "growth_s": "growth",
        "momentum_s": "momentum",
    }

    result = {}
    for stock in stocks:
        result[stock["ticker"]] = {}

    for factor_key, factor_name in factors.items():
        # 스코어로 정렬 (높을수록 좋음)
        valid_stocks = [(s["ticker"], s.get(factor_key, 0) or 0) for s in stocks]
        valid_stocks.sort(key=lambda x: x[1], reverse=True)

        for rank_idx, (ticker, score) in enumerate(valid_stocks):
            percentile = rank_idx / max(n, 1)  # 0이 최고
            grade = _percentile_to_grade(percentile)
            result[ticker][factor_name] = grade

    return result


def _percentile_to_grade(percentile: float) -> str:
    """백분위(0=최고) → 등급 변환"""
    if percentile < 0.10:
        return "A+"
    elif percentile < 0.20:
        return "A"
    elif percentile < 0.30:
        return "B+"
    elif percentile < 0.50:
        return "B"
    elif percentile < 0.70:
        return "C"
    else:
        return "D"


# ============================================================
# Enhanced: compute_picks (3일 교집합)
# ============================================================

def compute_picks(n_days: int = 3, top_n: int = 30, max_picks: int = 5) -> dict:
    """
    3일 교집합 (Slow In) 계산 — Enhanced with factor_grades, roe, fwd_per, weight, buy_rationale

    - 3거래일 연속 Top N에 있는 종목만
    - 가중순위: T0x0.5 + T1x0.3 + T2x0.2
    - 최대 max_picks 종목
    """
    # 1순위: web_data 캐시의 picks 사용
    cache = load_web_cache()
    if cache and cache.get("picks"):
        return _picks_from_cache(cache)

    # 2순위: ranking JSON에서 직접 계산
    return _picks_from_rankings(n_days, top_n, max_picks)


def _picks_from_cache(cache: dict) -> dict:
    """web_data 캐시에서 picks 추출 (이미 계산되어 있음)"""
    picks_raw = cache.get("picks", [])

    picks = []
    for p in picks_raw:
        # trajectory 재구성
        trajectory = []
        for key in ("rank_t2", "rank_t1", "rank_t0"):
            val = p.get(key)
            if val is not None:
                trajectory.append(val)

        pick = {
            "ticker": p.get("ticker", ""),
            "name": p.get("name", ""),
            "sector": p.get("sector", ""),
            "weighted_rank": _safe_float(p.get("weighted_rank")),
            "composite_rank": p.get("rank_t0", p.get("composite_rank")),
            "score": _safe_float(p.get("score")),
            "per": _safe_float(p.get("per")),
            "pbr": _safe_float(p.get("pbr")),
            "roe": _safe_float(p.get("roe")),
            "fwd_per": _safe_float(p.get("fwd_per")),
            "weight": p.get("weight", 20),
            "trajectory": trajectory,
        }

        # factor grades (캐시에는 없을 수 있음 - 계산해야 함)
        pick["factor_grades"] = None
        pick["buy_rationale"] = _generate_buy_rationale(pick, trajectory)
        picks.append(pick)

    # factor grades 일괄 계산 (최신 ranking에서)
    latest = load_latest_ranking()
    if latest:
        top30 = [s for s in latest.get("rankings", [])
                 if s.get("composite_rank", s.get("rank", 999)) <= 30]
        grades = compute_factor_grades(top30)
        for pick in picks:
            pick["factor_grades"] = grades.get(pick["ticker"])

    return {
        "picks": picks,
        "dates": [],
        "total_common": len(picks),
    }


def _picks_from_rankings(n_days: int = 3, top_n: int = 30, max_picks: int = 5) -> dict:
    """ranking JSON에서 직접 picks 계산"""
    dates = get_available_dates()
    if len(dates) < n_days:
        return {"picks": [], "message": f"순위 데이터가 {len(dates)}일밖에 없습니다 ({n_days}일 필요)"}

    weights = [0.5, 0.3, 0.2]
    rankings_by_day = []

    for i in range(n_days):
        data = load_ranking(dates[i])
        if not data:
            return {"picks": [], "message": f"{dates[i]} 데이터 로드 실패"}
        top_stocks = {}
        for stock in data.get("rankings", []):
            cr = stock.get("composite_rank", stock.get("rank", 999))
            if cr <= top_n:
                top_stocks[stock["ticker"]] = stock
        rankings_by_day.append(top_stocks)

    # 3일 모두 Top N에 있는 종목 찾기
    common_tickers = set(rankings_by_day[0].keys())
    for day_stocks in rankings_by_day[1:]:
        common_tickers &= set(day_stocks.keys())

    # factor grades from T-0 Top 30
    t0_top30 = list(rankings_by_day[0].values())
    grades = compute_factor_grades(t0_top30)

    # 가중순위 계산
    picks = []
    for ticker in common_tickers:
        weighted_rank = 0
        stock_info = rankings_by_day[0][ticker]  # T-0 정보 사용
        for i, day_stocks in enumerate(rankings_by_day):
            cr = day_stocks[ticker].get("composite_rank", day_stocks[ticker].get("rank", 999))
            weighted_rank += cr * weights[i]

        trajectory = []
        for i in range(n_days - 1, -1, -1):
            cr = rankings_by_day[i][ticker].get("composite_rank", rankings_by_day[i][ticker].get("rank", 999))
            trajectory.append(cr)

        pick = {
            "ticker": ticker,
            "name": stock_info["name"],
            "sector": stock_info.get("sector", ""),
            "weighted_rank": round(weighted_rank, 1),
            "composite_rank": stock_info.get("composite_rank", stock_info.get("rank")),
            "score": _safe_float(stock_info.get("score", 0)),
            "per": _safe_float(stock_info.get("per")),
            "pbr": _safe_float(stock_info.get("pbr")),
            "roe": _safe_float(stock_info.get("roe")),
            "fwd_per": _safe_float(stock_info.get("fwd_per")),
            "weight": 20,
            "trajectory": trajectory,  # [T-2, T-1, T-0]
            "factor_grades": grades.get(ticker),
        }
        pick["buy_rationale"] = _generate_buy_rationale(pick, trajectory)
        picks.append(pick)

    picks.sort(key=lambda x: x["weighted_rank"])
    picks = picks[:max_picks]

    return {
        "picks": picks,
        "dates": dates[:n_days],
        "total_common": len(common_tickers),
    }


def _generate_buy_rationale(stock: dict, trajectory: list) -> str:
    """종목의 매수 근거 텍스트 생성"""
    parts = []

    # PER 평가
    per = stock.get("per")
    fwd_per = stock.get("fwd_per")
    if fwd_per and fwd_per > 0:
        if fwd_per < 10:
            parts.append(f"Forward PER {fwd_per:.1f} (저평가)")
        elif fwd_per < 15:
            parts.append(f"Forward PER {fwd_per:.1f} (적정)")
        else:
            parts.append(f"Forward PER {fwd_per:.1f}")
    elif per and per > 0:
        if per < 10:
            parts.append(f"PER {per:.1f} (저평가)")
        elif per < 15:
            parts.append(f"PER {per:.1f} (적정)")
        else:
            parts.append(f"PER {per:.1f}")

    # ROE 평가
    roe = stock.get("roe")
    if roe and roe > 0:
        if roe >= 20:
            parts.append(f"ROE {roe:.1f}% (고수익)")
        elif roe >= 10:
            parts.append(f"ROE {roe:.1f}% (양호)")
        else:
            parts.append(f"ROE {roe:.1f}%")

    # 순위 안정성
    if trajectory and len(trajectory) >= 3:
        if all(r == trajectory[0] for r in trajectory):
            parts.append(f"3일 연속 {trajectory[0]}위")
        elif trajectory[-1] <= trajectory[0]:
            parts.append(f"순위 상승 중 ({trajectory[0]}→{trajectory[-1]}위)")

    return " · ".join(parts) if parts else ""


# ============================================================
# Enhanced: compute_death_list (Fast Out)
# ============================================================

def compute_death_list(top_n: int = 50) -> dict:
    """
    Death List (Fast Out) 계산 — Enhanced with exit_reason tags

    - 어제(T-1) Top 50에 있었으나 오늘(T-0) 51위+ 이탈한 종목
    - 이탈 사유: V↓ Q↓ M↓ (팩터 스코어 비교)
    """
    # 1순위: web_data 캐시
    cache = load_web_cache()
    if cache and cache.get("exited"):
        return _deathlist_from_cache(cache)

    # 2순위: ranking JSON에서 직접 계산
    return _deathlist_from_rankings(top_n)


def _deathlist_from_cache(cache: dict) -> dict:
    """web_data 캐시에서 death list 추출"""
    exited_raw = cache.get("exited", [])

    death_list = []
    for e in exited_raw:
        death_list.append({
            "ticker": e.get("ticker", ""),
            "name": e.get("name", ""),
            "sector": e.get("sector", ""),
            "yesterday_rank": e.get("prev_rank", e.get("rank")),
            "today_rank": e.get("rank"),
            "exit_reason": e.get("exit_reason", ""),
            "dropped_out": e.get("rank") is None,
        })

    return {
        "death_list": death_list,
        "dates": {"yesterday": "", "today": cache.get("date", "")},
    }


def _deathlist_from_rankings(top_n: int = 50) -> dict:
    """ranking JSON에서 직접 death list 계산"""
    dates = get_available_dates()
    if len(dates) < 2:
        return {"death_list": [], "message": "2일 이상의 데이터가 필요합니다"}

    today_data = load_ranking(dates[0])
    yesterday_data = load_ranking(dates[1])
    if not today_data or not yesterday_data:
        return {"death_list": [], "message": "데이터 로드 실패"}

    # 어제 Top 50
    yesterday_top = {}
    for stock in yesterday_data.get("rankings", []):
        cr = stock.get("composite_rank", stock.get("rank", 999))
        if cr <= top_n:
            yesterday_top[stock["ticker"]] = stock

    # 오늘 전체 순위 맵 (이탈 종목의 현재 스코어 조회용)
    today_all_map = {}
    for stock in today_data.get("rankings", []):
        today_all_map[stock["ticker"]] = stock

    # 오늘 Top N 맵
    today_rank_map = {}
    for stock in today_data.get("rankings", []):
        cr = stock.get("composite_rank", stock.get("rank", 999))
        today_rank_map[stock["ticker"]] = {**stock, "current_composite": cr}

    # 이탈 종목 찾기
    death_list = []
    for ticker, y_stock in yesterday_top.items():
        t_info = today_rank_map.get(ticker)
        if not t_info or t_info["current_composite"] > top_n:
            yesterday_cr = y_stock.get("composite_rank", y_stock.get("rank", 999))
            today_cr = t_info["current_composite"] if t_info else None

            # exit_reason 계산
            exit_reason = ""
            t0_item = today_all_map.get(ticker)
            if t0_item:
                exit_reason = _compute_exit_reason_inline(t0_item, y_stock)

            death_list.append({
                "ticker": ticker,
                "name": y_stock["name"],
                "sector": y_stock.get("sector", ""),
                "yesterday_rank": yesterday_cr,
                "today_rank": today_cr,
                "exit_reason": exit_reason,
                "dropped_out": today_cr is None,
            })

    death_list.sort(key=lambda x: x["yesterday_rank"])

    return {
        "death_list": death_list,
        "dates": {"yesterday": dates[1], "today": dates[0]},
    }


def _compute_exit_reason_inline(t0_item: dict, t1_item: dict) -> str:
    """이탈 종목의 사유 태그 — 전망 vs 가격 이진 분류 (v20.1)"""
    tags = []

    # 전망 (Forward EPS 컨센서스 변화)
    p0, fwd0 = t0_item.get('price'), t0_item.get('fwd_per')
    p1, fwd1 = t1_item.get('price'), t1_item.get('fwd_per')
    eps0 = p0 / fwd0 if p0 and fwd0 and fwd0 > 0 else None
    eps1 = p1 / fwd1 if p1 and fwd1 and fwd1 > 0 else None
    if eps0 is not None and eps1 is not None and eps1 != 0:
        eps_chg = (eps0 - eps1) / abs(eps1)
        if abs(eps_chg) >= 0.03:
            tags.append('💪전망↑' if eps_chg > 0 else '⚠️전망↓')

    # 가격 (실제 주가 비교)
    if p0 and p1 and p1 > 0:
        pct = (p0 - p1) / p1
        if abs(pct) >= 0.03:
            tags.append('📈가격↑' if pct > 0 else '📉가격↓')

    return ' '.join(tags) if tags else ''


# ============================================================
# 새 함수: AI Data
# ============================================================

def get_ai_data() -> dict:
    """
    AI 분석 결과 반환

    web_data 캐시의 "ai" 필드에서 로드
    없으면 available: false 반환
    """
    cache = load_web_cache()
    if not cache:
        return {"available": False, "risk_filter": None, "picks_text": None, "flagged_tickers": []}

    ai_raw = cache.get("ai", {})
    if not ai_raw:
        return {"available": False, "risk_filter": None, "picks_text": None, "flagged_tickers": []}

    return {
        "available": True,
        "risk_filter": ai_raw.get("risk_filter"),
        "picks_text": ai_raw.get("picks_text"),
        "flagged_tickers": ai_raw.get("flagged_tickers", []),
    }


# ============================================================
# 유틸리티
# ============================================================

def _safe_float(val, precision: int = 2) -> Optional[float]:
    """안전한 float 변환 — None/NaN/문자열 처리"""
    if val is None:
        return None
    try:
        f = float(val)
        if f != f:  # NaN check
            return None
        return round(f, precision)
    except (ValueError, TypeError):
        return None
