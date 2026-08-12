from pydantic import BaseModel


# ==========================================
# Start Interview
# ==========================================
class InterviewStartRequest(BaseModel):
    candidate_name: str
    role: str
    topic: str
    difficulty: str


class InterviewStartResponse(BaseModel):
    interview_id: str
    greeting: str
    question: str


# ==========================================
# Submit Interview Answer
# ==========================================

class InterviewAnswerRequest(BaseModel):
    interview_id: str
    answer: str


class InterviewStopRequest(BaseModel):
    interview_id: str


class InterviewAnswerResponse(BaseModel):
    score: int
    feedback: str

    next_question: str | None = None

    is_complete: bool = False

    final_score: float | None = None

    strengths: list[str] | None = None

    areas_for_improvement: list[str] | None = None

    final_feedback: str | None = None

    overall_rating: str | None = None

    hiring_recommendation: str | None = None

    question_scores: list[int] | None = None

    recommended_topics: list[str] | None = None

    is_incomplete: bool = False

    answered_questions: int = 0