import json
import os
import re
import unicodedata

from openai import OpenAI


def _normalize(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.lower())
    return "".join(character for character in normalized if not unicodedata.combining(character))


LANGUAGE_NAMES = {
    "en-US": "English",
    "pt-PT": "Portuguese (Portugal)",
    "de-DE": "German",
    "zh-CN": "Chinese",
    "es-ES": "Spanish",
    "it-IT": "Italian",
}


def _llm_language_mismatch(selected_language: str, transcript: str) -> bool | None:
    """Return None when an LLM decision is unavailable so the local fallback can run."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    prompt = f"""
Classify whether a candidate cannot continue an interview in the selected language.
Selected language: {LANGUAGE_NAMES.get(selected_language, selected_language)}
Candidate transcript: {transcript!r}

Return JSON only: {{\"language_mismatch\": true}} or {{\"language_mismatch\": false}}.
Return true only when the candidate clearly says they cannot speak, understand, or
continue in the selected language. Return false for not knowing a technical concept,
not knowing an answer, or any other interview answer.
"""
    try:
        response = OpenAI(api_key=api_key).chat.completions.create(
            model=os.getenv("LANGUAGE_MISMATCH_MODEL", "gpt-4o-mini"),
            messages=[{"role": "system", "content": "You are a precise intent classifier."},
                      {"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        payload = json.loads(response.choices[0].message.content or "{}")
        return payload.get("language_mismatch") is True
    except Exception:
        return None


def is_language_mismatch(selected_language: str, transcript: str) -> bool:
    llm_decision = _llm_language_mismatch(selected_language, transcript)
    if llm_decision is not None:
        return llm_decision

    text = _normalize(transcript)
    language_patterns = {
        "en-US": [
            r"\b(i (do not|don't|cannot|can't) (speak|understand|continue in) english)\b",
            r"\bi (do not|don't|cannot|can't) (know|speak|understand) this language\b",
            r"\bi cannot continue in this language\b",
            r"\bi want to (stop|end) (this )?interview\b",
            r"\b(stop|end|quit) (this )?interview\b",
        ],
        "pt-PT": [
            r"\b(nao (falo|sei falar|consigo falar|consigo continuar em|entendo) portugues)\b",
            r"\beu nao (falo|entendo) portugues\b",
            r"\beu nao (falo|entendo) esta lingua\b",
            r"\bnao sei falar esta lingua\b",
            r"\bnao consigo continuar nesta lingua\b",
            r"\bquero (parar|terminar) (a )?entrevista\b",
        ],
        "de-DE": [
            r"\bich (spreche|kann|verstehe) kein deutsch\b",
            r"\bich kann nicht auf deutsch weitermachen\b",
            r"\bich kann nicht deutsch sprechen\b",
            r"\bich (spreche|verstehe|kann) diese sprache nicht\b",
            r"\bich kann in dieser sprache nicht weitermachen\b",
            r"\bich mochte das interview (beenden|stoppen)\b",
        ],
        "es-ES": [
            r"\b(no hablo|no se|no puedo hablar|no entiendo|no puedo continuar en) espanol\b",
            r"\b(no hablo|no entiendo|no se hablar) este idioma\b",
            r"\bno puedo continuar en este idioma\b",
            r"\bquiero (parar|terminar) la entrevista\b",
        ],
        "it-IT": [
            r"\b(non parlo|non so parlare|non capisco|non posso continuare in|non riesco a parlare) (l )?italiano\b",
            r"\b(non parlo|non capisco|non so parlare) questa lingua\b",
            r"\bnon posso continuare in questa lingua\b",
            r"\bvoglio (interrompere|terminare) (il )?colloquio\b",
        ],
        "zh-CN": [
            r"(我不说中文|我不会说中文|我不懂中文|我不理解中文|我不能用中文继续|我无法用中文继续)",
            r"(我不会说这门语言|我不懂这门语言|我不理解这门语言|我不能用这门语言继续|我无法用这门语言继续)",
            r"(我想停止面试|我想结束面试|我要停止面试|我要结束面试)",
        ],
    }

    return any(
        re.search(pattern, text) is not None
        for pattern in language_patterns.get(selected_language, [])
    )