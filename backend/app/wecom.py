import hashlib
import httpx
from .config import get_settings

settings = get_settings()
WECOM_BASE = "https://qyapi.weixin.qq.com/cgi-bin"


def site_link(label: str = "山茶智耘") -> str:
    return f"[{label}]({settings.public_site_url})" if settings.public_site_url else label


async def get_access_token() -> str | None:
    """Get WeCom access token."""
    if not settings.wecom_corp_id or not settings.wecom_agent_secret:
        return None
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{WECOM_BASE}/gettoken",
                params={
                    "corpid": settings.wecom_corp_id,
                    "corpsecret": settings.wecom_agent_secret,
                },
            )
            data = resp.json()
            if data.get("errcode") == 0:
                return data["access_token"]
        except Exception:
            return None
    return None


async def send_message(content: str, agent_id: int = None) -> dict:
    """Send application message to all WeCom users."""
    token = await get_access_token()
    if not token:
        return {"success": False, "message": "企业微信配置错误或 Access Token 获取失败"}

    aid = agent_id or settings.wecom_agent_id
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(
                f"{WECOM_BASE}/message/send?access_token={token}",
                json={
                    "touser": "@all",
                    "msgtype": "markdown",
                    "agentid": aid,
                    "markdown": {"content": content},
                    "safe": 0,
                    "enable_id_trans": 0,
                },
            )
            data = resp.json()
            if data.get("errcode") == 0:
                return {"success": True, "message": "推送成功"}
            return {"success": False, "message": data.get("errmsg", f"错误码: {data.get('errcode')}")}
        except Exception as e:
            return {"success": False, "message": str(e)}


async def send_warning(plot_name: str, warning_type: str, warning_level: str, content: str, suggestion: str) -> dict:
    """发送预警通知到企业微信"""
    level_icon = {"严重": "🔴", "警告": "🟡", "关注": "🟢", "正常": "✅"}
    icon = level_icon.get(warning_level, "⚠️")
    msg = f"""## {icon} 油茶预警通知

**地块：** {plot_name}
**类型：** {warning_type}
**等级：** {warning_level}

**内容：**
>{content}

**建议：**
>{suggestion}

---
{site_link("山茶智耘 · 油茶全周期智慧监测系统")}"""
    return await send_message(msg)


async def send_weather_alert(plot_name: str, alert_type: str, alert_level: str, content: str, suggestion: str) -> dict:
    """发送天气预警通知到企业微信"""
    icon = {"冻害预警": "❄️", "高温预警": "🌡️", "暴雨预警": "🌧️"}
    msg = f"""## {icon.get(alert_type, '⚠️')} 天气预警通知

**地块：** {plot_name}
**类型：** {alert_type}
**等级：** {alert_level}

**内容：**
>{content}

**建议：**
>{suggestion}

---
{site_link()}"""
    return await send_message(msg)


async def send_decision(plot_name: str, suggestion_type: str, content: str, confidence: str) -> dict:
    """发送农事决策建议到企业微信"""
    msg = f"""## 💡 农事决策建议

**地块：** {plot_name}
**类型：** {suggestion_type}
**可信度：** {confidence}

**建议：**
>{content}

---
{site_link()}"""
    return await send_message(msg)


def verify_url(token: str, msg_signature: str, timestamp: str, nonce: str, echostr: str) -> bool:
    """Verify WeCom URL callback signature."""
    arr = sorted([token, timestamp, nonce, echostr])
    s = "".join(arr)
    sha1 = hashlib.sha1(s.encode("utf-8")).hexdigest()
    return sha1 == msg_signature
