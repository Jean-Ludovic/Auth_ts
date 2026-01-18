import random
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlmodel import Session, select
from .db import get_session
from .models import User
from .schemas import RegisterIn, LoginIn, VerifyCodeIn, UserOut
from .security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from .config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=bool(settings.COOKIE_SECURE),
        samesite="lax",
        path="/api/auth/refresh",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )


@router.post("/register", response_model=UserOut)
def register(data: RegisterIn, session: Session = Depends(get_session)):
    exists = session.exec(select(User).where((User.email == data.email) | (User.username == data.username))).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email or username already exists")

    code = f"{random.randint(0, 9999):04d}"  # 4-digit code
    user = User(
        email=data.email.lower(),
        username=data.username,
        hashed_password=hash_password(data.password),
        is_verified=False,
        verification_code=code,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # NOTE: for now we "return" code in console (dev). In production: send email.
    print(f"[DEV] Verification code for {user.email}: {code}")

    return UserOut(id=user.id, email=user.email, username=user.username, is_verified=user.is_verified)


@router.post("/verify", response_model=UserOut)
def verify_email(data: VerifyCodeIn, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == data.email.lower())).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return UserOut(id=user.id, email=user.email, username=user.username, is_verified=user.is_verified)
    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    user.is_verified = True
    user.verification_code = None
    session.add(user)
    session.commit()
    session.refresh(user)

    return UserOut(id=user.id, email=user.email, username=user.username, is_verified=user.is_verified)


@router.post("/login")
def login(data: LoginIn, response: Response, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == data.email.lower())).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    _set_refresh_cookie(response, refresh)

    return {"access_token": access, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(authorization: str | None = None, session: Session = Depends(get_session)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing access token")

    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid access token")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserOut(id=user.id, email=user.email, username=user.username, is_verified=user.is_verified)


@router.post("/refresh")
def refresh(response: Response, refresh_token: str | None = Cookie(default=None), session: Session = Depends(get_session)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access = create_access_token(str(user.id))
    new_refresh = create_refresh_token(str(user.id))
    _set_refresh_cookie(response, new_refresh)

    return {"access_token": access, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="refresh_token", path="/api/auth/refresh")
    return {"ok": True}
