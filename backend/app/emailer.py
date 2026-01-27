from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from .config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_STARTTLS=getattr(settings, "SMTP_TLS", True),
    MAIL_SSL_TLS=getattr(settings, "SMTP_SSL", False),
    USE_CREDENTIALS=True,
)

async def send_verification_email(to_email: str, code: str) -> None:
    message = MessageSchema(
        subject="Your verification code",
        recipients=[to_email],
        body=f"Your verification code is: {code}",
        subtype="plain",
    )
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_password_reset_email(to_email: str, reset_link: str) -> None:
    message = MessageSchema(
        subject="Reset your password",
        recipients=[to_email],
        body=(
            "You requested a password reset.\n\n"
            f"Reset link: {reset_link}\n\n"
            "If you didn't request this, you can ignore this email."
        ),
        subtype="plain",
    )
    fm = FastMail(conf)
    await fm.send_message(message)
