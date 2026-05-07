import httpx
from .config import get_settings

settings = get_settings()
WXPUSHER_BASE = "https://wxpusher.zjiecode.com/api"


async def send_message(content: str, uids: list[str] = None, topic_ids: list[int] = None, summary: str = None) -> dict:
    """Send a WeChat push notification via WxPusher."""
    app_token = settings.wxpusher_app_token
    if not app_token:
        return {"success": False, "message": "WxPusher App Token 未配置"}

    payload = {
        "appToken": app_token,
        "content": content,
        "contentType": 1,
        "uids": uids or [],
        "topicIds": topic_ids or [],
    }
    if summary:
        payload["summary"] = summary

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(f"{WXPUSHER_BASE}/send/message", json=payload)
            data = resp.json()
            return data
        except Exception as e:
            return {"success": False, "message": str(e)}


async def send_warning_notification(plot_name: str, warning_type: str, warning_level: str, content: str, suggestion: str, uids: list[str]) -> dict:
    """Send a warning alert to WeChat users."""
    level_icon = {"严重": "🔴", "警告": "🟡", "关注": "🟢", "正常": "✅"}
    icon = level_icon.get(warning_level, "⚠️")
    message = f"""{icon} *油茶预警通知*

📍 地块：{plot_name}
📢 类型：{warning_type}
📊 等级：{warning_level}
📝 内容：{content}

💡 建议：{suggestion}

---
山茶智耘 · 油茶全周期智慧监测系统"""
    return await send_message(message, uids=uids)


async def send_decision_notification(plot_name: str, suggestion_type: str, content: str, confidence: str, uids: list[str]) -> dict:
    """Send a decision recommendation to WeChat users."""
    message = f"""💡 *农事决策建议*

📍 地块：{plot_name}
📋 类型：{suggestion_type}
📊 可信度：{confidence}
📝 建议：{content}

---
山茶智耘 · 油茶全周期智慧监测系统"""
    return await send_message(message, uids=uids)


async def send_weather_alert(plot_name: str, alert_type: str, alert_level: str, content: str, suggestion: str, uids: list[str]) -> dict:
    """Send a weather alert to WeChat users."""
    icon = {"冻害预警": "❄️", "高温预警": "🌡️", "暴雨预警": "🌧️"}
    level_icon = {"严重": "🔴", "警告": "🟡"}
    msg = f"""{icon.get(alert_type, '⚠️')}{level_icon.get(alert_level, '⚠️')} *天气预警通知*

📍 地块：{plot_name}
📢 类型：{alert_type}
📊 等级：{alert_level}
📝 内容：{content}

💡 建议：{suggestion}

---
山茶智耘 · 油茶全周期智慧监测系统"""
    return await send_message(msg, uids=uids)
