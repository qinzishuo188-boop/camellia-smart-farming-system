import httpx
from datetime import date
from sqlmodel import Session, select
from .models import Plot, WeatherRecord


OPEN_METEO_BASE = "https://api.open-meteo.com/v1"


async def fetch_weather_forecast(plot: Plot) -> list[dict]:
    """Fetch 7-day weather forecast for a plot from Open-Meteo (free, no API key)."""
    if not plot.longitude or not plot.latitude:
        return []

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{OPEN_METEO_BASE}/forecast",
                params={
                    "latitude": plot.latitude,
                    "longitude": plot.longitude,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code",
                    "forecast_days": 7,
                    "timezone": "auto",
                },
            )
            data = resp.json()
            daily = data.get("daily", {})
            times = daily.get("time", [])
            if not times:
                return []

            weather_codes = daily.get("weather_code", [])
            results = []
            for i, day in enumerate(times):
                results.append({
                    "fxDate": day,
                    "tempMax": daily.get("temperature_2m_max", [0])[i] if i < len(daily.get("temperature_2m_max", [])) else 0,
                    "tempMin": daily.get("temperature_2m_min", [0])[i] if i < len(daily.get("temperature_2m_min", [])) else 0,
                    "precip": daily.get("precipitation_sum", [0])[i] if i < len(daily.get("precipitation_sum", [])) else 0,
                    "pop": daily.get("precipitation_probability_max", [0])[i] if i < len(daily.get("precipitation_probability_max", [])) else 0,
                    "text": weather_code_to_desc(weather_codes[i]) if i < len(weather_codes) else "未知",
                })
            return results
        except Exception:
            return []


def weather_code_to_desc(code: int) -> str:
    """Convert WMO weather code to Chinese description."""
    codes = {
        0: "晴天", 1: "少云", 2: "多云", 3: "阴天",
        45: "有雾", 48: "雾凇",
        51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨",
        56: "冻毛毛雨", 57: "冻毛毛雨",
        61: "小雨", 63: "中雨", 65: "大雨",
        66: "冻雨", 67: "冻雨",
        71: "小雪", 73: "中雪", 75: "大雪",
        77: "雪粒",
        80: "阵雨", 81: "中阵雨", 82: "大阵雨",
        85: "小阵雪", 86: "大阵雪",
        95: "雷暴", 96: "雷暴加冰雹", 99: "雷暴加冰雹",
    }
    return codes.get(code, "未知")


async def sync_weather_for_plot(session: Session, plot: Plot) -> list[WeatherRecord]:
    """Fetch and store 7-day forecast for a plot."""
    if not plot.longitude or not plot.latitude:
        return []

    forecast = await fetch_weather_forecast(plot)
    records = []

    for day in forecast:
        forecast_date = date.fromisoformat(day["fxDate"])
        existing = session.exec(
            select(WeatherRecord).where(
                WeatherRecord.plot_id == plot.id,
                WeatherRecord.forecast_date == forecast_date,
                WeatherRecord.data_source == "weather",
            )
        ).first()
        if existing:
            continue

        record = WeatherRecord(
            plot_id=plot.id,
            temperature_high=float(day.get("tempMax", 0)),
            temperature_low=float(day.get("tempMin", 0)),
            rainfall=float(day.get("precip", 0)),
            rainfall_prob=float(day.get("pop", 0)),
            weather_desc=day.get("text", ""),
            forecast_date=forecast_date,
            data_source="weather",
        )
        session.add(record)
        records.append(record)

    if records:
        session.commit()
        for r in records:
            session.refresh(r)
    return records


async def sync_all_weather(session: Session) -> dict:
    """Fetch weather for all plots."""
    plots = session.exec(select(Plot)).all()
    total = 0
    errors = 0
    for plot in plots:
        try:
            records = await sync_weather_for_plot(session, plot)
            total += len(records)
        except Exception:
            errors += 1
    return {"synced": total, "plots": len(plots), "errors": errors}


def check_weather_alerts(session: Session, plot_id: int, weather_records: list[WeatherRecord]) -> list[dict]:
    """Generate weather-based alerts for a plot."""
    alerts = []
    today = date.today()
    upcoming = [w for w in weather_records if w.forecast_date >= today][:3]

    for w in upcoming:
        if w.temperature_low is not None and w.temperature_low < 0:
            alerts.append({
                "type": "冻害预警",
                "level": "严重",
                "condition": f"预报 {w.forecast_date} 最低温 {w.temperature_low}℃",
                "content": f"{w.forecast_date}预报低温{w.temperature_low}℃，存在冻害风险。",
                "suggestion": "建议提前覆盖防寒、树干防护，特别是幼树和花期植株。",
            })
        if w.temperature_high is not None and w.temperature_high > 38:
            alerts.append({
                "type": "高温预警",
                "level": "警告",
                "condition": f"预报 {w.forecast_date} 最高温 {w.temperature_high}℃",
                "content": f"{w.forecast_date}预报高温{w.temperature_high}℃，存在高温胁迫风险。",
                "suggestion": "建议早晚补水，必要时遮阴降温，避免中午作业。",
            })
        if w.rainfall_prob is not None and w.rainfall_prob >= 70 and w.rainfall is not None and w.rainfall > 20:
            alerts.append({
                "type": "暴雨预警",
                "level": "警告",
                "condition": f"预报 {w.forecast_date} 降雨量{w.rainfall}mm，概率{w.rainfall_prob}%",
                "content": f"{w.forecast_date}预报有强降雨（{w.rainfall}mm），注意排水防涝。",
                "suggestion": "建议提前疏通排水沟，防止果园积水和裂果。",
            })
    return alerts
