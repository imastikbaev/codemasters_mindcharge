import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

from routers import auth, tests, courses, ai_chat, analytics, users

Base.metadata.create_all(bind=engine)

# Auto-seed on startup if DB is empty
try:
    from database import SessionLocal
    db = SessionLocal()
    from models import User
    if db.query(User).count() == 0:
        db.close()
        import seed
    else:
        db.close()
except Exception as e:
    print(f"Seed check error: {e}")

app = FastAPI(title="MindCharge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tests.router)
app.include_router(courses.router)
app.include_router(ai_chat.router)
app.include_router(analytics.router)
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "MindCharge API"}
