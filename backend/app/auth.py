import re
import random
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Header
from sqlmodel import Session, select
from .responses import ApiResponse
from .emailer import send_verification_email
from .db import get_session
from .models import User
from .schemas import RegisterIn, LoginIn, VerifyCodeIn, UserOut
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from .config import settings
from .emailer import send_verification_email
from datetime import datetime
from .schemas import ForgotPasswordIn, ResetPasswordIn
from .reset_tokens import generate_reset_token, hash_token, expires_at
from .emailer import send_password_reset_email

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


def _base_username_from_email(email: str) -> str:
    base = email.split("@")[0]
    base = re.sub(r"[^a-zA-Z0-9_]", "", base)
    return base[:20] if base else "user"


def _unique_username(session: Session, base: str) -> str:
    username = base
    tries = 0
    while session.exec(select(User).where(User.username == username)).first():
        tries += 1
        username = f"{base}_{random.randint(10, 9999)}"
        if tries > 20:
            username = f"user_{random.randint(1000, 999999)}"
            break
    return username


@router.post("/register", response_model=ApiResponse[dict])
async def register(data: RegisterIn, session: Session = Depends(get_session)):
    email = data.email.lower()

    exists = session.exec(select(User).where(User.email == email)).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    username = _unique_username(session, _base_username_from_email(email))
    code = f"{random.randint(0, 9999):04d}"

    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(data.password),
        is_verified=False,
        verification_code=code,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    print(f"[DEV] Verification code for {user.email}: {code}")
    await send_verification_email(user.email, code)

    return ApiResponse(data={"message": "Account created. Verify your email.", "email": user.email})


@router.post("/verify", response_model=UserOut)
def verify_email(data: VerifyCodeIn, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == data.email.lower())).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return UserOut(id=user.id, email=user.email, username=user.username, is_verified=user.is_verified , createdAt=user.created_at,) 

    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    user.is_verified = True
    user.verification_code = None
    session.add(user)
    session.commit()
    session.refresh(user)

    return UserOut(id=user.id, email=user.email, username=user.username, is_verified=user.is_verified)



@router.post("/login", response_model=ApiResponse[dict])
def login(data: LoginIn, response: Response, session: Session = Depends(get_session)):
    email = data.email.lower().strip()

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found (DEV)")

    if not user.hashed_password:
        raise HTTPException(status_code=500, detail="User has no hashed_password (DEV)")

    try:
        ok = verify_password(data.password, user.hashed_password)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"verify_password crashed: {type(e).__name__} (DEV)")

    if not ok:
        raise HTTPException(status_code=401, detail="Password mismatch (DEV)")

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    _set_refresh_cookie(response, refresh)

    return ApiResponse(data={"accessToken": access})


from .schemas import UserMeOut

@router.get("/me", response_model=ApiResponse[UserMeOut])
def me(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing access token")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user = session.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return ApiResponse(
        data=UserMeOut(
            id=user.id,
            email=user.email,
            username=user.username,
            emailVerified=user.is_verified,
            createdAt=user.created_at,
    )
)



@router.post("/refresh", response_model=ApiResponse[dict])
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    session: Session = Depends(get_session),
):
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

    return ApiResponse(data={"accessToken": access})

@router.post("/logout", response_model=ApiResponse[dict])
def logout(response: Response):
    response.delete_cookie(key="refresh_token", path="/api/auth/refresh")
    return ApiResponse(data={"ok": True})

@router.post("/verify-email", response_model=ApiResponse[dict])
def verify_email_and_login(
    data: VerifyCodeIn,
    response: Response,
    session: Session = Depends(get_session),
):
    user = session.exec(
        select(User).where(User.email == data.email.lower())
    ).first()

    if not user or user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    user.is_verified = True
    user.verification_code = None
    session.commit()

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    _set_refresh_cookie(response, refresh)

    return ApiResponse(
        data={
            "accessToken": access,
        }
    )
@router.post("/forgot-password", response_model=ApiResponse[dict])
async def forgot_password(
    data: ForgotPasswordIn,
    session: Session = Depends(get_session),
):
    # réponse neutre (sécurité)
    generic = ApiResponse(data={"message": "If an account exists, you'll receive an email."})

    email = data.email.lower()
    user = session.exec(select(User).where(User.email == email)).first()

    if not user:
        return generic

    # génère token + stocke hash
    token = generate_reset_token()
    user.password_reset_token_hash = hash_token(token)
    user.password_reset_expires_at = expires_at(settings.PASSWORD_RESET_EXPIRE_MINUTES)

    session.add(user)
    session.commit()

    # construit lien frontend
    reset_link = f"{settings.FRONTEND_RESET_PASSWORD_URL}?token={token}&email={email}"
    await send_password_reset_email(email, reset_link)

    return generic


@router.post("/reset-password", response_model=ApiResponse[dict])
def reset_password(
    data: ResetPasswordIn,
    session: Session = Depends(get_session),
):
    email = data.email.lower()
    user = session.exec(select(User).where(User.email == email)).first()

    # réponse neutre (ne pas leak si user existe)
    if not user:
        return ApiResponse(data={"message": "Password updated if the token was valid."})

    # vérifs token
    if not user.password_reset_token_hash or not user.password_reset_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if datetime.utcnow() > user.password_reset_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if hash_token(data.token) != user.password_reset_token_hash:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # update password
    user.hashed_password = hash_password(data.new_password)

    # invalide le token (one-time)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None

    session.add(user)
    session.commit()

    return ApiResponse(data={"message": "Password updated."})
