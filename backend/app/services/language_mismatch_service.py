import re
import unicodedata


def _normalize(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.lower())
    return "".join(character for character in normalized if not unicodedata.combining(character))


def is_language_mismatch(selected_language: str, transcript: str) -> bool:
    text = _normalize(transcript)
    language_patterns = {
        "en-US": [
            r"\b(i (do not|don't|cannot|can't) (speak|understand|continue in) english)\b",
        ],
        "pt-PT": [
            r"\b(nao (falo|sei falar|consigo falar|consigo continuar em|entendo) portugues)\b",
            r"\beu nao (falo|entendo) portugues\b",
        ],
        "de-DE": [
            r"\bich (spreche|kann|verstehe) kein deutsch\b",
            r"\bich kann nicht auf deutsch weitermachen\b",
            r"\bich kann nicht deutsch sprechen\b",
        ],
        "es-ES": [
            r"\b(no hablo|no se|no puedo hablar|no entiendo|no puedo continuar en) espanol\b",
        ],
        "it-IT": [
            r"\b(non parlo|non so parlare|non capisco|non posso continuare in|non riesco a parlare) (l )?italiano\b",
        ],
        "zh-CN": [
            r"(我不说中文|我不会说中文|我不懂中文|我不理解中文|我不能用中文继续|我无法用中文继续)",
        ],
    }

    return any(
        re.search(pattern, text) is not None
        for pattern in language_patterns.get(selected_language, [])
    )