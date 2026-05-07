from typing import Type
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, SQLModel, select
from ..database import get_session
from ..models import (
    DecisionRule,
    ExpertReview,
    FarmingLog,
    GrowthStage,
    KnowledgeArticle,
    Organization,
    PestDiseaseKnowledge,
    Plot,
    SensorDevice,
    SystemConfig,
    User,
    WeatherRecord,
)
from ..security import get_current_user, hash_password, require_roles
from ..mode import is_production


def crud_router(model: Type[SQLModel], prefix: str, tag: str, admin_only: bool = False) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("")
    def list_items(
        q: str | None = None,
        limit: int = Query(100, le=500),
        offset: int = 0,
        session: Session = Depends(get_session),
        user: User = Depends(get_current_user),
    ):
        query = select(model).offset(offset).limit(limit)
        if is_production(session) and hasattr(model, "data_source"):
            query = query.where(model.data_source != "demo")
        if model is Plot and user.role == "farmer":
            query = query.where(Plot.user_id == user.id)
        elif model is Plot and user.role == "org_admin":
            query = query.where(Plot.organization_id == user.organization_id)
        rows = session.exec(query).all()
        if q and model is Plot:
            rows = [r for r in rows if q in r.plot_name or q in r.plot_code or q in r.town]
        if q and model is KnowledgeArticle:
            rows = [r for r in rows if q in r.title or q in r.category or q in r.summary]
        return rows

    @router.post("")
    def create_item(
        payload: model,  # type: ignore[valid-type]
        session: Session = Depends(get_session),
        user: User = Depends(require_roles("admin", "org_admin") if admin_only else get_current_user),
    ):
        if model is Plot and user.role == "farmer":
            payload.user_id = user.id
            payload.organization_id = user.organization_id
        if model is User:
            payload.password_hash = hash_password(payload.password_hash)
        session.add(payload)
        session.commit()
        session.refresh(payload)
        return payload

    @router.get("/{item_id}")
    def get_item(item_id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
        item = session.get(model, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="记录不存在")
        if model is Plot and user.role == "farmer" and item.user_id != user.id:
            raise HTTPException(status_code=403, detail="权限不足")
        return item

    @router.put("/{item_id}")
    def update_item(
        item_id: int,
        payload: dict,
        session: Session = Depends(get_session),
        user: User = Depends(require_roles("admin", "org_admin") if admin_only else get_current_user),
    ):
        item = session.get(model, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="记录不存在")
        for key, value in payload.items():
            if key in {"id", "created_at"}:
                continue
            if hasattr(item, key):
                if model is User and key == "password_hash" and value:
                    value = hash_password(value)
                setattr(item, key, value)
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

    @router.delete("/{item_id}")
    def delete_item(
        item_id: int,
        session: Session = Depends(get_session),
        user: User = Depends(require_roles("admin", "org_admin") if admin_only else get_current_user),
    ):
        item = session.get(model, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="记录不存在")
        session.delete(item)
        session.commit()
        return {"message": "已删除"}

    return router


routers = [
    crud_router(Organization, "/organizations", "organizations", True),
    crud_router(Plot, "/plots", "plots"),
    crud_router(GrowthStage, "/growth-stages", "growth-stages", True),
    crud_router(DecisionRule, "/decision-rules", "decision-rules", True),
    crud_router(PestDiseaseKnowledge, "/pest-disease", "pest-disease"),
    crud_router(FarmingLog, "/farming-logs", "farming-logs"),
    crud_router(KnowledgeArticle, "/knowledge", "knowledge"),
    crud_router(User, "/users", "users", True),
    crud_router(ExpertReview, "/expert-reviews", "expert-reviews"),
    crud_router(SensorDevice, "/sensor-devices", "sensor-devices", True),
    crud_router(WeatherRecord, "/weather-records", "weather-records"),
    crud_router(SystemConfig, "/system-config", "system-config", True),
]
