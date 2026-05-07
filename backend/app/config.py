from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "山茶智耘"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./camellia.db"
    secret_key: str = "change-this-secret-in-production"
    access_token_expire_minutes: int = 1440
    upload_dir: str = "uploads"
    debug: bool = False
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    system_mode: str = "demo"
    deepseek_api_key: str = ""
    deepseek_api_base: str = "https://api.deepseek.com/v1"
    serverchan_key: str = ""
    wxpusher_app_token: str = ""
    wecom_corp_id: str = ""
    wecom_agent_secret: str = ""
    wecom_agent_id: int = 0
    wecom_token: str = "change-this-wecom-token"
    public_site_url: str = ""

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
