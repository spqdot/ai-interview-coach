from pydantic import BaseModel


# ==========================================
# Start Interview
# ==========================================
class InterviewStartRequest(BaseModel):
    candidate_name: str
    role: str
    topic: str
    difficulty: str
    language: str | None = None


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


class LanguageMismatchRequest(BaseModel):
    interview_id: str
    transcript: str
    selected_language: str | None = None


class LanguageMismatchResponse(BaseModel):
    language_mismatch: bool
    reason: str | None = None


class ConversationTurnRequest(BaseModel):
    interview_id: str
    transcript: str
    language: str | None = None


class ConversationTurnResponse(BaseModel):
    is_conversation_turn: bool
    reply: str | None = None
    technical_answer: str | None = None


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