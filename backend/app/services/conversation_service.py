import re


def _technical_answer_before_aside(transcript: str) -> str | None:
    aside_match = re.search(
        r"\b(?:by the way|before we continue|also),?\s+.*?\b(?:do you remember|what(?:'s| is)) my name\b",
        transcript,
        re.IGNORECASE,
    )

    if aside_match is None:
        return None

    answer = transcript[:aside_match.start()].strip(" .,!?")
    return answer or None


def build_conversation_reply(
    candidate_name: str,
    current_question: str,
    transcript: str,
) -> tuple[str | None, str | None]:
    normalized = transcript.lower()
    asks_about_name = re.search(
        r"\b(do you remember|what(?:'s| is)) my name\b", normalized)

    if asks_about_name:
        technical_answer = _technical_answer_before_aside(transcript)
        if technical_answer:
            return (
                f"Yes, your name is {candidate_name}. I heard your explanation, and we'll build on it.",
                technical_answer,
            )

        return (
            f"Yes, your name is {candidate_name}. Let's continue with the interview. "
            "I will repeat the current question for you.",
            None,
        )

    return None, None