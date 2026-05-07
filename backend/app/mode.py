from sqlmodel import Session, select
from .models import SystemConfig


def get_system_mode(session: Session) -> str:
    row = session.exec(select(SystemConfig).where(SystemConfig.key == "system_mode")).first()
    return row.value if row else "demo"


def set_system_mode(session: Session, mode: str):
    if mode not in ("production", "demo"):
        raise ValueError("mode must be 'production' or 'demo'")
    row = session.exec(select(SystemConfig).where(SystemConfig.key == "system_mode")).first()
    if row:
        row.value = mode
        session.add(row)
    else:
        session.add(SystemConfig(key="system_mode", value=mode, description="系统运行模式"))
    session.commit()


def is_production(session: Session) -> bool:
    return get_system_mode(session) == "production"
