from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import User
from ..schemas import LoginRequest, PasswordRequest, RegisterRequest
from ..security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(payload: RegisterRequest, session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.username == payload.username)).first():
        raise HTTPException(status_code=400, detail="用户名已存在")
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        email=payload.email,
        role=payload.role,
        organization_id=payload.organization_id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}


@router.post("/login")
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where((User.username == payload.username) | (User.phone == payload.username))).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="用户已被禁用")
    return {"access_token": create_access_token(user.username), "token_type": "bearer", "user": public_user(user)}


@router.post("/logout")
def logout():
    return {"message": "已退出登录"}


@router.get("/profile")
def profile(user: User = Depends(get_current_user)):
    return public_user(user)


@router.put("/password")
def change_password(payload: PasswordRequest, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_user = session.get(User, user.id)
    if not db_user or not verify_password(payload.old_password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="原密码错误")
    db_user.password_hash = hash_password(payload.new_password)
    session.add(db_user)
    session.commit()
    return {"message": "密码已更新"}


def public_user(user: User):
    return {
        "id": user.id,
        "username": user.username,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
        "organization_id": user.organization_id,
        "status": user.status,
    }
