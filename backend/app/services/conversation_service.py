import re


def build_conversation_reply(
    candidate_name: str,
    current_question: str,
    transcript: str,
) -> str | None:
    normalized = transcript.lower()
    asks_about_name = re.search(
        r"\b(do you remember|what(?:'s| is)) my name\b", normalized)

    if asks_about_name:
        return (
            f"Yes, your name is {candidate_name}. Let's continue with the interview. "
            "I will repeat the current question for you."
        )

    return None