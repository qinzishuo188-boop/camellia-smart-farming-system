import httpx
from .config import get_settings

settings = get_settings()


async def send_notification(title: str, content: str) -> dict:
    """Send WeChat push notification via Server酱."""
    send_key = settings.serverchan_key
    if not send_key:
        return {"success": False, "message": "Server酱 SendKey 未配置"}

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"https://sctapi.ftqq.com/{send_key}.send",
                params={"title": title, "desp": content},
            )
            data = resp.json()
            if data.get("code") == 0:
                return {"success": True, "message": "推送成功"}
            return {"success": False, "message": data.get("message", "推送失败")}
        except Exception as e:
            return {"success": False, "message": str(e)}


async def send_warning(plot_name: str, warning_type: str, warning_level: str, content: str, suggestion: str) -> dict:
    """发送预警通知到微信"""
    title = f"🔔 {warning_type} - {plot_name}"
    body = f"""## {warning_type}

**地块：** {plot_name}
**等级：** {warning_level}
**内容：** {content}

**建议：** {suggestion}

---
山茶智耘 · 油茶全周期智慧监测系统
"""
    return await send_notification(title, body)


async def send_weather_alert(plot_name: str, alert_type: str, alert_level: str, content: str, suggestion: str) -> dict:
    """发送天气预警通知到微信"""
    title = f"🌤 {alert_type} - {plot_name}"
    body = f"""## {alert_type}

**地块：** {plot_name}
**等级：** {alert_level}
**内容：** {content}

**建议：** {suggestion}

---
山茶智耘 · 油茶全周期智慧监测系统
"""
    return await send_notification(title, body)


async def send_decision(plot_name: str, suggestion_type: str, content: str, confidence: str) -> dict:
    """发送农事决策建议到微信"""
    title = f"💡 {suggestion_type} - {plot_name}"
    body = f"""## 农事决策建议

**地块：** {plot_name}
**类型：** {suggestion_type}
**可信度：** {confidence}

**建议：** {content}

---
山茶智耘 · 油茶全周期智慧监测系统
"""
    return await send_notification(title, body)
