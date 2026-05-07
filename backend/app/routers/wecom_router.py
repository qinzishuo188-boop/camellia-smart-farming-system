from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse, Response
from ..config import get_settings

router = APIRouter(tags=["wecom"])
settings = get_settings()

@router.get("/wecom/callback", response_class=PlainTextResponse)
async def wecom_verify(request: Request):
    """Handle WeCom URL verification (GET)."""
    params = dict(request.query_params)
    msg_signature = params.get("msg_signature", "")
    timestamp = params.get("timestamp", "")
    nonce = params.get("nonce", "")
    echostr = params.get("echostr", "")

    if not all([msg_signature, timestamp, nonce, echostr]):
        return Response(content="缺少参数", status_code=400)

    from ..wecom import verify_url
    if verify_url(settings.wecom_token, msg_signature, timestamp, nonce, echostr):
        return PlainTextResponse(content=echostr)
    return Response(content="验证失败", status_code=403)


@router.post("/wecom/callback")
async def wecom_callback(request: Request):
    """Handle WeCom messages (POST)."""
    return {"errcode": 0, "errmsg": "ok"}
