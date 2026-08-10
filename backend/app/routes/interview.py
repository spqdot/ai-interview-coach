from fastapi import APIRouter, HTTPException

from backend.app.models.schemas import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewAnswerRequest,
    InterviewAnswerResponse,
)
from backend.app.services.llm_service import (
    generate_interview_question,
    evaluate_answer,
    generate_final_report,
)

from backend.app.services.interview_service import (
    create_interview,
    get_interview,
    save_answer,
    is_interview_complete,
    calculate_final_score,
    get_question_scores,
)


router = APIRouter(
    prefix="/api/interview",
    tags=["Interview"],
)


# ==========================================
# Start Interview
# ==========================================

@router.post(
    "/start",
    response_model=InterviewStartResponse,
)
def start_interview(
    request: InterviewStartRequest,
):

    # Generate first interview question
    question = generate_interview_question(
        candidate_name=request.candidate_name,
        role=request.role,
        topic=request.topic,
        difficulty=request.difficulty,
    )

    # Create interview session
    interview_id = create_interview(
        candidate_name=request.candidate_name,
        role=request.role,
        topic=request.topic,
        difficulty=request.difficulty,
        first_question=question,
    )

    greeting = (
    f"Hello {request.candidate_name}! "
    f"Welcome to your {request.role} mock interview."
    )

    return InterviewStartResponse(
        interview_id=interview_id,
        greeting=greeting,
        question=question,
    )


# ==========================================
# Submit Answer
# ==========================================

@router.post(
    "/answer",
    response_model=InterviewAnswerResponse,
)
def submit_answer(
    request: InterviewAnswerRequest,
):

    # ==========================================
    # Get Interview Session
    # ==========================================

    interview = get_interview(
        request.interview_id
    )

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    # ==========================================
    # Prevent Answers After Completion
    # ==========================================

    if interview["is_complete"]:
        raise HTTPException(
            status_code=400,
            detail="Interview is already complete.",
        )

    # ==========================================
    # Check if Current Question is Final Question
    # ==========================================

    is_final_question = (
        interview["question_count"]
        >= interview["max_questions"]
    )

    # ==========================================
    # Evaluate Candidate Answer
    # ==========================================

    evaluation = evaluate_answer(
        role=interview["role"],
        topic=interview["topic"],
        difficulty=interview["difficulty"],
        question=interview["current_question"],
        answer=request.answer,
        question_count=interview["question_count"],
    )

    # ==========================================
    # Decide Next Question
    # ==========================================

    if is_final_question:
        next_question = None
    else:
        next_question = evaluation["next_question"]

    # ==========================================
    # Save Candidate Answer
    # ==========================================

    save_answer(
        interview_id=request.interview_id,
        answer=request.answer,
        score=evaluation["score"],
        feedback=evaluation["feedback"],
        next_question=next_question,
    )

    # ==========================================
    # Check Interview Completion
    # ==========================================

    complete = is_interview_complete(
        request.interview_id
    )

    # ==========================================
    # Interview Finished
    # ==========================================

    if complete:

        final_score = calculate_final_score(
            request.interview_id
        )

        question_scores = get_question_scores(
            request.interview_id
        )

        report = generate_final_report(
            role=interview["role"],
            topic=interview["topic"],
            difficulty=interview["difficulty"],
            history=interview["history"],
            final_score=final_score,
        )

        return InterviewAnswerResponse(
            score=evaluation["score"],
            feedback=evaluation["feedback"],
            next_question=None,
            is_complete=True,

            final_score=final_score,

            overall_rating=report["overall_rating"],
            hiring_recommendation=report["hiring_recommendation"],

            question_scores=question_scores,

            strengths=report["strengths"],
            areas_for_improvement=report["areas_for_improvement"],

            recommended_topics=report["recommended_topics"],

            final_feedback=report["final_feedback"],
        )

    # ==========================================
    # Interview Continues
    # ==========================================

    return InterviewAnswerResponse(
        score=evaluation["score"],
        feedback=evaluation["feedback"],
        next_question=next_question,
        is_complete=False,

        final_score=None,

        overall_rating=None,
        hiring_recommendation=None,
        question_scores=None,

        strengths=None,
        areas_for_improvement=None,
        recommended_topics=None,

        final_feedback=None,
    )