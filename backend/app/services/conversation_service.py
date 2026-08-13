import re


def _technical_answer_before_aside(transcript: str) -> str | None:
    aside_match = re.search(
        r"\b(?:by the way|before we continue|also),?\s+.*?\b(?:do|can|will|would) you remember my name\b|\b(?:by the way|before we continue|also),?\s+.*?\bwhat(?:'s| is) my name\b",
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
    language: str = "en-US",
) -> tuple[str | None, str | None]:
    normalized = transcript.lower()
    asks_about_name = re.search(
        r"\b(?:do|can|will|would) you remember my name\b|\bwhat(?:'s| is) my name\b",
        normalized,
    )

    if asks_about_name:
        technical_answer = _technical_answer_before_aside(transcript)
        replies = {
            "pt-PT": (
                f"Sim, o seu nome é {candidate_name}. Ouvi a sua explicação e vamos desenvolvê-la.",
                f"Sim, o seu nome é {candidate_name}. Vamos continuar a entrevista. Vou repetir a pergunta atual.",
            ),
            "de-DE": (
                f"Ja, Ihr Name ist {candidate_name}. Ich habe Ihre Erklärung gehört und wir bauen darauf auf.",
                f"Ja, Ihr Name ist {candidate_name}. Setzen wir das Interview fort. Ich wiederhole die aktuelle Frage.",
            ),
            "zh-CN": (
                f"是的，你的名字是 {candidate_name}。我听到了你的解释，我们会在此基础上继续。",
                f"是的，你的名字是 {candidate_name}。让我们继续面试。我会重复当前的问题。",
            ),
            "es-ES": (
                f"Sí, tu nombre es {candidate_name}. He escuchado tu explicación y continuaremos a partir de ella.",
                f"Sí, tu nombre es {candidate_name}. Continuemos la entrevista. Repetiré la pregunta actual.",
            ),
            "it-IT": (
                f"Sì, il tuo nome è {candidate_name}. Ho ascoltato la tua spiegazione e continueremo da lì.",
                f"Sì, il tuo nome è {candidate_name}. Continuiamo il colloquio. Ripeterò la domanda attuale.",
            ),
        }
        answer_reply, repeat_reply = replies.get(
            language,
            (
                f"Yes, your name is {candidate_name}. I heard your explanation, and we'll build on it.",
                f"Yes, your name is {candidate_name}. Let's continue with the interview. "
                "I will repeat the current question for you.",
            ),
        )
        if technical_answer:
            return answer_reply, technical_answer

        return repeat_reply, None

    return None, None