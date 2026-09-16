from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from config import settings
from routers import events, registrations, attendance, feedback, certificates, ai_agent

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("eventflow.main")

app = FastAPI(
    title="EventFlow AI Backend API",
    description="Real-time Event Operations & AI Agent Backend for College Events, Hackathons & GDG Chapters",
    version="1.0.0"
)

# Configure CORS for React Vite frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(events.router)
app.include_router(registrations.router)
app.include_router(attendance.router)
app.include_router(feedback.router)
app.include_router(certificates.router)
app.include_router(ai_agent.router)

@app.get("/api/health", tags=["Health Check"])
def health_check():
    from db import supabase
    return {
        "status": "healthy",
        "service": "EventFlow AI Backend",
        "version": "1.0.0",
        "database_connected": supabase is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
