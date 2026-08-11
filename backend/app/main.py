from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes.interview import router as interview_router


app = FastAPI(
    title="AI Interview Coach API",
    description="Backend API for the AI Interview Coach",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local frontend
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",

        # Local frontend using 127.0.0.1
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",

        # Vercel frontend
        "https://ai-interview-coach-ten-black.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(interview_router)


@app.get("/")
def home():
    return {
        "message": "AI Interview Coach API is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }