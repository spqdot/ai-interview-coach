from fastapi import APIRouter, HTTPException

from backend.app.models.schemas import (
    InterviewStartRequest,
    InterviewStartResponse,
    InterviewAnswerRequest,
    InterviewAnswerResponse,
    InterviewStopRequest,
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
    end_interview,
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
# Stop Interview Early
# ==========================================
@router.post(
    "/stop",
    response_model=InterviewAnswerResponse,
)
def stop_interview(
    request: InterviewStopRequest,
):
    interview = get_interview(request.interview_id)

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    if interview["is_complete"]:
        raise HTTPException(
            status_code=400,
            detail="Interview already completed.",
        )

    end_interview(request.interview_id)

    final_score = calculate_final_score(request.interview_id)
    question_scores = get_question_scores(request.interview_id)
    answered_questions = len(question_scores)

    return InterviewAnswerResponse(
        score=0,
        feedback="Interview ended before completion.",
        next_question=None,
        is_complete=True,
        final_score=final_score,
        overall_rating="Incomplete Interview",
        hiring_recommendation="Not Assessed",
        question_scores=question_scores,
        strengths=[
            "You completed the questions answered before ending the interview.",
        ] if answered_questions else [
            "No answers were submitted before the interview ended.",
        ],
        areas_for_improvement=[
            "Complete the full interview for a more reliable assessment.",
        ],
        recommended_topics=[interview["topic"]],
        final_feedback=(
            "Thank you for the interview. You did not complete all five questions, "
            "so this score reflects only the answers you submitted."
        ),
        is_incomplete=True,
        answered_questions=answered_questions,
    )


# ==========================================
# Submit Interview Answer
# ==========================================
@router.post(
    "/answer",
    response_model=InterviewAnswerResponse,
)
def submit_interview_answer(
    request: InterviewAnswerRequest,
):
    interview = get_interview(
        request.interview_id
    )

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found.",
        )

    if interview["is_complete"]:
        raise HTTPException(
            status_code=400,
            detail="Interview already completed.",
        )

    try:
        evaluation = evaluate_answer(
            role=interview["role"],
            topic=interview["topic"],
            difficulty=interview["difficulty"],
            question=interview["current_question"],
            answer=request.answer,
            question_count=interview["question_count"],
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to evaluate answer. "
                "Please try again."
            ),
        ) from error

    next_question = evaluation.get(
        "next_question"
    )

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

        interview = get_interview(
            request.interview_id
        )

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

            is_incomplete=False,
            answered_questions=len(question_scores),
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

        is_incomplete=False,
        answered_questions=0,
    )