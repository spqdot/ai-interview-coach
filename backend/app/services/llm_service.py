import os
import json

from dotenv import load_dotenv
from openai import OpenAI

from backend.app.prompts.interviewer_prompt import (
    INTERVIEWER_SYSTEM_PROMPT,
)

from backend.app.prompts.evaluation_prompt import (
    EVALUATION_SYSTEM_PROMPT,
)


# ==========================================
# Environment
# ==========================================

load_dotenv("backend/.env")


# ==========================================
# OpenAI Client
# ==========================================

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def use_remote_evaluation() -> bool:
    return os.getenv("USE_REMOTE_EVALUATION", "false").lower() == "true"


def fallback_evaluation(
    topic: str,
    answer: str,
    question_count: int,
) -> dict:
    normalized_answer = answer.strip().lower()
    word_count = len(answer.split())
    non_answer_phrases = {
        "dont know",
        "do not know",
        "idk",
        "no idea",
        "not sure",
        "i have no idea",
        "i am not sure",
    }
    topic_keywords = {
        "RAG": {
            "rag", "retrieval", "retrieve", "retrieves", "document",
            "documents", "context", "embedding", "embeddings", "vector",
            "database", "search", "llm", "generation", "grounded",
        },
        "LLM Fundamentals": {
            "llm", "language", "model", "token", "tokens", "training",
            "transformer", "context", "prompt", "generation",
        },
    }
    matching_keywords = {
        keyword
        for keyword in topic_keywords.get(topic, {topic.lower()})
        if keyword in normalized_answer
    }
    project_keywords = {
        "project", "built", "build", "created", "developed", "implemented",
        "worked", "work", "model", "data", "dataset", "analysis", "system",
        "application", "pipeline", "team", "contribution", "responsible",
    }
    challenge_keywords = {
        "challenge", "problem", "issue", "error", "bug", "failure", "difficulty",
        "solved", "fixed", "debugged", "improved", "handled", "addressed",
    }
    has_project_detail = any(keyword in normalized_answer for keyword in project_keywords)
    has_challenge_detail = any(keyword in normalized_answer for keyword in challenge_keywords)

    if (
        not normalized_answer
        or any(phrase in normalized_answer.replace("'", "") for phrase in non_answer_phrases)
    ):
        score = 0
        feedback = (
            "This answer does not demonstrate understanding of the concept. "
            "Review the key terms and try explaining the idea in your own words."
        )
    elif question_count <= 3 and not matching_keywords:
        score = 0
        feedback = (
            "This answer is not relevant to the interview question. "
            "Review the core concept and answer using the correct technical terms."
        )
    elif question_count == 4 and not has_project_detail:
        score = 0
        feedback = (
            "This answer does not describe a relevant project or your contribution. "
            "Explain what you built, the problem it addressed, and your role."
        )
    elif question_count == 5 and not has_challenge_detail:
        score = 0
        feedback = (
            "This answer does not address the project challenge in the question. "
            "Describe one problem you encountered and how you handled it."
        )
    elif word_count < 12:
        score = 4
        feedback = (
            "You identified part of the idea, but the answer needs more technical detail "
            "and a clearer explanation."
        )
    elif question_count <= 3 and len(matching_keywords) >= 3:
        score = 8
        feedback = (
            "Your answer is relevant and includes several important technical concepts. "
            "Add a concise example to make the explanation even stronger."
        )
    else:
        score = 6
        feedback = (
            "Your answer is relevant, but it needs more specific technical details "
            "and a concrete example."
        )

    follow_up_questions = {
        "RAG": [
            "What role do embeddings play in a RAG system?",
            "Why does a RAG system use a vector database?",
        ],
        "LLM Fundamentals": [
            "What is tokenization, and why is it important for an LLM?",
            "What is a context window in an LLM?",
        ],
    }
    topic_questions = follow_up_questions.get(
        topic,
        [
            f"What is one important use case for {topic}?",
            f"What is one challenge when working with {topic}?",
        ],
    )

    if question_count == 3:
        next_question = (
            "Can you describe one relevant project you worked on, the problem it solved, "
            "and your personal contribution?"
        )
    elif question_count == 4:
        next_question = (
            "What was one technical challenge in that project, and how did you address it?"
        )
    else:
        next_question = topic_questions[(question_count - 1) % len(topic_questions)]

    return {
        "score": score,
        "feedback": feedback,
        "next_question": next_question,
    }


def fallback_final_report(final_score: float) -> dict:
    if final_score >= 8:
        overall_rating = "Very Good"
        recommendation = "Hire"
    elif final_score >= 5:
        overall_rating = "Good"
        recommendation = "Consider"
    else:
        overall_rating = "Needs Improvement"
        recommendation = "Needs Improvement"

    return {
        "overall_rating": overall_rating,
        "hiring_recommendation": recommendation,
        "strengths": [
            "Completed the full interview.",
            "Engaged with the technical questions.",
        ],
        "areas_for_improvement": [
            "Give more detailed technical explanations.",
            "Support answers with concrete examples.",
        ],
        "recommended_topics": [
            "Core concepts",
            "Practical examples",
        ],
        "final_feedback": (
            "Keep practicing concise, structured explanations of technical concepts and "
            "include an example when possible."
        ),
    }


# ==========================================
# Generate First Interview Question
# ==========================================

def generate_interview_question(
    candidate_name: str,
    role: str,
    topic: str,
    difficulty: str,
) -> str:
    """
    Generate the first interview question.

    For deployment reliability, the first question uses
    a predefined question based on the selected topic.

    This prevents the interview from being blocked by
    RAG or OpenAI API calls when the user clicks
    "Start Interview".
    """

    fallback_questions = {
        "RAG": (
            "Explain what Retrieval-Augmented Generation (RAG) "
            "is and describe how it works."
        ),

        "LLM Fundamentals": (
            "What is a Large Language Model (LLM), "
            "and what is it used for?"
        ),

        "Machine Learning": (
            "What is the difference between supervised "
            "and unsupervised learning?"
        ),

        "Deep Learning": (
            "What is a neural network, and how does it learn?"
        ),

        "NLP": (
            "What is Natural Language Processing (NLP), "
            "and what are some common applications?"
        ),
    }

    return fallback_questions.get(
        topic,
        f"What are the fundamental concepts of {topic}, "
        f"and why are they important?"
    )


# ==========================================
# Evaluate Answer + Generate Follow-up
# ==========================================

def evaluate_answer(
    role: str,
    topic: str,
    difficulty: str,
    question: str,
    answer: str,
    question_count: int,
) -> dict:
    """
    Evaluate the candidate's answer using RAG
    reference material and generate the next
    interview question.

    Interview structure:

    Q1 -> Technical
    Q2 -> Technical
    Q3 -> Technical
    Q4 -> Project experience
    Q5 -> Project follow-up
    """

    if not use_remote_evaluation():
        return fallback_evaluation(
            topic=topic,
            answer=answer,
            question_count=question_count,
        )

    # ==========================================
    # IMPORTANT:
    # Lazy-load RAG service
    # ==========================================
    #
    # DO NOT import rag_service at the top of this
    # file. The embedding model can be expensive to
    # load and can prevent Render from completing
    # its startup/port check.
    #
    # We load it only when an answer is evaluated.
    # ==========================================

    from backend.app.services.rag_service import (
        get_interview_context
    )


    # ==========================================
    # Retrieve RAG Context
    # ==========================================

    context = get_interview_context(
        role=role,
        difficulty=difficulty,
        topic=topic,
        k=3,
    )


    # ==========================================
    # Decide Next Question Type
    # ==========================================

    if question_count == 3:

        # --------------------------------------
        # Candidate just answered Question 3.
        # Question 4 = Project Experience
        # --------------------------------------

        next_question_instruction = """
The candidate has just answered Question 3.

The NEXT question is Question 4.

Question 4 MUST be a project-experience question.

Adapt the project question to the selected role.

For AI Engineer:
Ask about ONE AI, LLM, RAG, Generative AI, NLP,
or related AI project the candidate has worked on.

For ML Engineer:
Ask about ONE machine learning project the candidate
has worked on.

For Data Scientist:
Ask about ONE data science, analytics, experimentation,
or predictive modeling project the candidate has worked on.

Ask the candidate to briefly describe:
- the project
- the problem they were solving
- their personal contribution

The project question should:
- Be conversational and realistic.
- Ask about ONE project only.
- Be concise.
- Match the selected role.
- Match the selected difficulty.
- NOT ask another theoretical question.
"""

    elif question_count == 4:

        # --------------------------------------
        # Candidate just answered Question 4.
        # Question 5 = Project Follow-up
        # --------------------------------------

        next_question_instruction = f"""
The candidate has just answered Question 4.

Question 4 was the project-experience question.

The NEXT question is Question 5.

Question 5 MUST be ONE natural follow-up question
about the project the candidate just described.

Candidate's project answer:
---------------------------
{answer}
---------------------------

Use ONLY information actually mentioned by the candidate.

Do NOT invent:
- technologies
- datasets
- models
- results
- architectures
- responsibilities
- deployment details

Choose ONE relevant aspect of the candidate's project.

Possible areas include:
- personal contribution
- model or technology choice
- dataset or data collection
- evaluation metrics
- technical challenge
- debugging
- deployment
- results
- lessons learned

The question must:
- Be based on the candidate's actual project answer.
- Ask only ONE main question.
- Be conversational.
- Match the selected role.
- Match the selected difficulty.
- Not provide hints.
- Not provide the answer.
"""

    else:

        # --------------------------------------
        # Q1 -> Q2
        # Q2 -> Q3
        # --------------------------------------

        next_question_instruction = """
Generate ONE technical follow-up interview question.

The question must:
- Match the selected role.
- Stay relevant to the selected topic.
- Strictly match the selected difficulty.
- Ask only ONE main question.
- Be concise.
- Not provide hints.
- Not provide the answer.

For EASY difficulty:
- Ask about ONE fundamental concept only.
- Prefer definitions, purpose, or simple examples.
- Do not combine several concepts into one question.
- Do not ask for production system design.
- Do not ask for complex trade-offs.
- Do not increase difficulty because the candidate
  answered the previous question well.

For MEDIUM difficulty:
- Practical implementation questions are appropriate.
- Common debugging questions are appropriate.
- Reasonable technical trade-offs are appropriate.
- Do not turn the question into a large-scale
  system-design problem.

For HARD difficulty:
- Advanced implementation questions are appropriate.
- System design is appropriate.
- Production architecture is appropriate.
- Scalability, reliability, latency, security,
  optimization, and complex trade-offs are appropriate.
"""


    # ==========================================
    # Build Evaluation Prompt
    # ==========================================

    user_prompt = f"""
You are evaluating a candidate during a technical interview.

Candidate Role:
{role}

Topic:
{topic}

Difficulty:
{difficulty}

Current Question Number:
{question_count}

Interview Question:
-------------------
{question}
-------------------

Candidate Answer:
-----------------
{answer}
-----------------

REFERENCE MATERIAL:
-------------------
{context}
-------------------

Evaluate the candidate's answer using the reference
material as technical grounding.

Evaluate based on:

1. Technical correctness
2. Important concepts covered
3. Important concepts missing
4. Relevance to the question
5. Clarity of explanation
6. Depth appropriate for the selected difficulty

NEXT QUESTION INSTRUCTION:
--------------------------
{next_question_instruction}
--------------------------

You MUST follow the NEXT QUESTION INSTRUCTION when
generating the next question.

Return ONLY valid JSON with exactly these fields:

{{
    "score": 0,
    "feedback": "Concise feedback for the candidate.",
    "next_question": "One follow-up interview question."
}}

Rules for the JSON response:

- score must be an integer from 0 to 10.
- feedback must be concise and constructive.
- next_question must contain exactly one interview question.
- Do not include Markdown.
- Do not include ```json.
- Do not include code fences.
- Do not include text before the JSON.
- Do not include text after the JSON.
"""


    # ==========================================
    # OpenAI Evaluation
    # ==========================================

    response = client.responses.create(
        model="gpt-5-mini",
        instructions=EVALUATION_SYSTEM_PROMPT,
        input=user_prompt,
    )

    result = response.output_text.strip()


    # ==========================================
    # Parse JSON Response
    # ==========================================

    try:
        evaluation = json.loads(result)

    except json.JSONDecodeError as error:

        print("Failed to parse OpenAI evaluation response.")
        print("Raw response:")
        print(result)

        raise ValueError(
            "The evaluation model returned invalid JSON."
        ) from error


    # ==========================================
    # Basic Response Validation
    # ==========================================

    required_fields = {
        "score",
        "feedback",
        "next_question",
    }

    missing_fields = required_fields - evaluation.keys()

    if missing_fields:
        raise ValueError(
            f"Evaluation response is missing fields: "
            f"{missing_fields}"
        )


    # ==========================================
    # Ensure Score Is Integer
    # ==========================================

    try:

        evaluation["score"] = int(
            evaluation["score"]
        )

    except (TypeError, ValueError) as error:

        raise ValueError(
            "Evaluation score must be an integer."
        ) from error


    # ==========================================
    # Keep Score Within 0-10
    # ==========================================

    evaluation["score"] = max(
        0,
        min(10, evaluation["score"]),
    )


    return evaluation


# ==========================================
# Generate Final Interview Report
# ==========================================

def generate_final_report(
    role: str,
    topic: str,
    difficulty: str,
    history: list,
    final_score: float,
) -> dict:
    """
    Generate an overall interview report using
    the candidate's complete interview history.
    """

    if not use_remote_evaluation():
        return fallback_final_report(final_score)

    # ==========================================
    # Format Interview History
    # ==========================================

    history_text = ""

    for item in history:

        history_text += f"""
Question {item.get("question_number", "")}:
{item.get("question", "")}

Candidate Answer:
{item.get("answer", "")}

Score:
{item.get("score", 0)}/10

Feedback:
{item.get("feedback", "")}

----------------------------------------
"""


    # ==========================================
    # Build Final Report Prompt
    # ==========================================

    user_prompt = f"""
You are a professional technical interviewer.

The candidate has completed a mock technical interview.

Candidate Role:
{role}

Interview Topic:
{topic}

Difficulty:
{difficulty}

Final Average Score:
{final_score}/10

COMPLETE INTERVIEW HISTORY:
---------------------------
{history_text}
---------------------------

Analyze the candidate's performance across the entire interview.

Generate a concise final interview report.

The report should identify:

1. The candidate's main strengths.
2. The most important areas for improvement.
3. Overall feedback about interview readiness.
4. An overall rating.
5. A hiring recommendation.
6. Recommended topics for further preparation.

IMPORTANT:

- Base the report ONLY on the interview history.
- Do not invent skills, projects, technologies, or weaknesses.
- Consider the selected difficulty when judging performance.
- Do not penalize an Easy-level candidate for not giving
  Medium- or Hard-level answers.
- Keep the feedback constructive.
- Strengths should contain 2 to 4 short points.
- Areas for improvement should contain 2 to 4 short points.
- Recommended topics should contain 2 to 5 short topics.
- The final feedback should be concise and useful.

For overall_rating, use one of:
- "Excellent"
- "Very Good"
- "Good"
- "Needs Improvement"
- "Poor"

For hiring_recommendation, use one of:
- "Strong Hire"
- "Hire"
- "Consider"
- "Needs Improvement"
- "Not Recommended"

Return ONLY valid JSON with exactly these fields:

{{
    "overall_rating": "Good",
    "hiring_recommendation": "Consider",
    "strengths": [
        "Strength 1",
        "Strength 2"
    ],
    "areas_for_improvement": [
        "Improvement 1",
        "Improvement 2"
    ],
    "recommended_topics": [
        "Topic 1",
        "Topic 2"
    ],
    "final_feedback": "Overall interview feedback."
}}

JSON RULES:

- overall_rating must be a string.
- hiring_recommendation must be a string.
- strengths must be a JSON array of strings.
- areas_for_improvement must be a JSON array of strings.
- recommended_topics must be a JSON array of strings.
- final_feedback must be a string.
- Do not include Markdown.
- Do not include ```json.
- Do not include code fences.
- Do not include any text before the JSON.
- Do not include any text after the JSON.
"""


    # ==========================================
    # OpenAI Final Report
    # ==========================================

    response = client.responses.create(
        model="gpt-5-mini",
        input=user_prompt,
    )

    result = response.output_text.strip()


    # ==========================================
    # Parse JSON
    # ==========================================

    try:

        report = json.loads(result)

    except json.JSONDecodeError as error:

        print("Failed to parse final interview report.")
        print("Raw response:")
        print(result)

        raise ValueError(
            "The final report model returned invalid JSON."
        ) from error


    # ==========================================
    # Validate Required Fields
    # ==========================================

    required_fields = {
        "overall_rating",
        "hiring_recommendation",
        "strengths",
        "areas_for_improvement",
        "recommended_topics",
        "final_feedback",
    }

    missing_fields = required_fields - report.keys()

    if missing_fields:

        raise ValueError(
            f"Final report is missing fields: "
            f"{missing_fields}"
        )


    # ==========================================
    # Validate Types
    # ==========================================

    if not isinstance(
        report["overall_rating"],
        str,
    ):

        raise ValueError(
            "Final report overall_rating must be a string."
        )


    if not isinstance(
        report["hiring_recommendation"],
        str,
    ):

        raise ValueError(
            "Final report hiring_recommendation "
            "must be a string."
        )


    if not isinstance(
        report["strengths"],
        list,
    ):

        raise ValueError(
            "Final report strengths must be a list."
        )


    if not isinstance(
        report["areas_for_improvement"],
        list,
    ):

        raise ValueError(
            "Final report areas_for_improvement "
            "must be a list."
        )


    if not isinstance(
        report["recommended_topics"],
        list,
    ):

        raise ValueError(
            "Final report recommended_topics "
            "must be a list."
        )


    if not isinstance(
        report["final_feedback"],
        str,
    ):

        raise ValueError(
            "Final report final_feedback "
            "must be a string."
        )


    return report