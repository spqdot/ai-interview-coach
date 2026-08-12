import uuid


# ==========================================
# Temporary In-Memory Interview Storage
# ==========================================

interviews = {}


# ==========================================
# Create Interview
# ==========================================

def create_interview(
    candidate_name: str,
    role: str,
    topic: str,
    difficulty: str,
    first_question: str,
    language: str = "en-US",
    max_questions: int = 5,
):

    interview_id = str(uuid.uuid4())

    interviews[interview_id] = {
        "candidate_name": candidate_name,
        "role": role,
        "topic": topic,
        "difficulty": difficulty,
        "language": language,
        "current_question": first_question,
        "question_count": 1,
        "max_questions": max_questions,
        "history": [],
        "is_complete": False,
}

    return interview_id


# ==========================================
# Get Interview
# ==========================================

def get_interview(
    interview_id: str,
):

    return interviews.get(interview_id)


# ==========================================
# Save Candidate Answer
# ==========================================

def save_answer(
    interview_id: str,
    answer: str,
    score: int,
    feedback: str,
    next_question: str | None = None,
):

    interview = interviews[interview_id]

    # Save current question and candidate answer
    interview["history"].append(
        {
            "question_number": interview["question_count"],
            "question": interview["current_question"],
            "answer": answer,
            "score": score,
            "feedback": feedback,
        }
    )

    # ==========================================
    # Check if Interview is Finished
    # ==========================================

    if interview["question_count"] >= interview["max_questions"]:

        interview["is_complete"] = True
        interview["current_question"] = None

        return

    # ==========================================
    # Move to Next Question
    # ==========================================

    interview["question_count"] += 1
    interview["current_question"] = next_question


# ==========================================
# Check Interview Completion
# ==========================================

def is_interview_complete(
    interview_id: str,
) -> bool:

    interview = interviews.get(interview_id)

    if interview is None:
        return False

    return interview["is_complete"]


def end_interview(
    interview_id: str,
):
    interview = interviews[interview_id]
    interview["is_complete"] = True
    interview["current_question"] = None


# ==========================================
# Calculate Final Score
# ==========================================

def calculate_final_score(
    interview_id: str,
) -> float:

    interview = interviews[interview_id]

    history = interview["history"]

    if not history:
        return 0.0

    scores = [
        item["score"]
        for item in history
    ]

    average_score = sum(scores) / len(scores)

    return round(average_score, 1)

# ==========================================
# Get Question Scores
# ==========================================

def get_question_scores(
    interview_id: str,
) -> list[int]:

    interview = interviews[interview_id]

    return [
        item["score"]
        for item in interview["history"]
    ]