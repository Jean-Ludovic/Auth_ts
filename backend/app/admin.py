from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select
from sqlalchemy import func
from datetime import datetime, timedelta
from .config import settings
from .db import get_session
from .models import User
from .security import decode_token
from .responses import ApiResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])

def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing access token")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user = session.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user



def require_admin(user: User = Depends(get_current_user)) -> User:
    # 1) allowlist emails
    if user.email.lower() in [e.lower() for e in settings.admin_emails]:
        return user

    # 2) ou role en DB
    if getattr(user, "role", "user") == "admin":
        return user

    raise HTTPException(status_code=403, detail="Admin only")

@router.get("/users", response_model=ApiResponse[list[dict]])
def list_users(
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
    limit: int = 200,
    offset: int = 0,
):
    users = session.exec(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(limit)
    ).all()

    return ApiResponse(
        data=[
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "emailVerified": u.is_verified,
                "role": getattr(u, "role", "user"),
                "createdAt": u.created_at,
            }
            for u in users
        ]
    )

@router.get("/stats/signups", response_model=ApiResponse[list[dict]])
def signups(
    days: int = 30,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    days = max(1, min(days, 365))
    since = datetime.utcnow() - timedelta(days=days - 1)

    rows = session.exec(
        select(
            func.date(User.created_at).label("d"),
            func.count(User.id).label("c"),
        )
        .where(User.created_at >= since)
        .group_by("d")
        .order_by("d")
    ).all()

    counts = {str(d): int(c) for (d, c) in rows}

    out = []
    for i in range(days):
        d = (since.date() + timedelta(days=i))
        key = str(d)
        out.append({"date": key, "count": counts.get(key, 0)})

    return ApiResponse(data=out)
