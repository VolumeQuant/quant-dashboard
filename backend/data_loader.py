"""
quant_py-main의 state/ranking JSON과 output CSV를 읽어서 API용 데이터로 변환
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


def compute_picks(n_days: int = 3, top_n: int = 30, max_picks: int = 5) -> dict:
    """
    3일 교집합 (Slow In) 계산
    - 3거래일 연속 Top N에 있는 종목만
    - 가중순위: T0×0.5 + T1×0.3 + T2×0.2
    - 최대 max_picks 종목
    """
    dates = get_available_dates()
    if len(dates) < n_days:
        return {"picks": [], "message": f"순위 데이터가 {len(dates)}일밖에 없습니다 ({n_days}일 필요)"}

    weights = [0.5, 0.3, 0.2]
    rankings_by_day = []

    for i in range(n_days):
        data = load_ranking(dates[i])
        if not data:
            return {"picks": [], "message": f"{dates[i]} 데이터 로드 실패"}
        # composite_rank 기준으로 Top N 필터
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

        picks.append({
            "ticker": ticker,
            "name": stock_info["name"],
            "sector": stock_info.get("sector", ""),
            "weighted_rank": round(weighted_rank, 1),
            "composite_rank": stock_info.get("composite_rank", stock_info.get("rank")),
            "score": stock_info.get("score", 0),
            "per": stock_info.get("per"),
            "pbr": stock_info.get("pbr"),
            "trajectory": trajectory,  # [T-2, T-1, T-0]
        })

    picks.sort(key=lambda x: x["weighted_rank"])
    picks = picks[:max_picks]

    return {
        "picks": picks,
        "dates": dates[:n_days],
        "total_common": len(common_tickers),
    }


def compute_death_list(top_n: int = 50) -> dict:
    """
    Death List (Fast Out) 계산
    - 어제(T-1) Top 50에 있었으나 오늘(T-0) 51위+ 이탈한 종목
    """
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

    # 오늘 순위 맵
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
            death_list.append({
                "ticker": ticker,
                "name": y_stock["name"],
                "sector": y_stock.get("sector", ""),
                "yesterday_rank": yesterday_cr,
                "today_rank": today_cr,
                "dropped_out": today_cr is None,
            })

    death_list.sort(key=lambda x: x["yesterday_rank"])

    return {
        "death_list": death_list,
        "dates": {"yesterday": dates[1], "today": dates[0]},
    }


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
