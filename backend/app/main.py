from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import create_db_and_tables
from .auth import router as auth_router
from .admin import router as admin_router



app = FastAPI(title="Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from .config import settings
print("ADMIN_EMAILS:", settings.admin_emails)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(auth_router)
app.include_router(admin_router)
