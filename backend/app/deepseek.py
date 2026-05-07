import json
import httpx
from .config import get_settings

settings = get_settings()


async def chat(messages: list[dict], max_tokens: int = 1024) -> str:
    """Call DeepSeek Chat API."""
    if not settings.deepseek_api_key:
        return "DeepSeek API Key 未配置，请在 .env 中设置 DEEPSEEK_API_KEY"

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                f"{settings.deepseek_api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.deepseek_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": messages,
                    "max_tokens": max_tokens,
                },
            )
            data = resp.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "AI 分析暂时不可用")
        except Exception as e:
            return f"AI 接口调用异常: {str(e)}"


async def diagnose_pest(symptoms: list[str], image_description: str = "") -> dict:
    """Use DeepSeek to assist in pest/disease diagnosis."""
    prompt = f"""你是一位油茶病虫害防治专家。请根据以下信息进行诊断分析：

症状：{'、'.join(symptoms)}
{f'图片描述：{image_description}' if image_description else ''}

请返回 JSON 格式：
{{
  "possible_diseases": [
    {{"name": "病害名称", "probability": "高/中/低", "reason": "判断依据"}}
  ],
  "risk_level": "严重/警告/关注/正常",
  "suggestion": "防治建议",
  "note": "诊断说明"
}}

注意：这只是辅助诊断，最终需专家复核确认。"""
    try:
        result = await chat([{"role": "user", "content": prompt}], max_tokens=1024)
        return json.loads(result) if result.startswith("{") else {"raw_analysis": result}
    except Exception:
        return {"error": "诊断分析失败，请重试"}


async def generate_farming_advice(plot_info: dict, env_data: dict, growth_data: dict = None) -> str:
    """Generate farming advice using DeepSeek based on real data."""
    prompt = f"""你是一位油茶种植专家。请根据以下数据给出农事管理建议：

地块信息：{json.dumps(plot_info, ensure_ascii=False)}
环境数据：{json.dumps(env_data, ensure_ascii=False)}
{f'长势数据：{json.dumps(growth_data, ensure_ascii=False)}' if growth_data else ''}

请简洁地给出：
1. 当前风险评估
2. 建议的农事操作
3. 注意事项
4. 数据缺口提示（如果数据不足）

注意：请基于数据给出建议，不要在没有数据支持时给出确定性结论。"""
    return await chat([{"role": "user", "content": prompt}])
