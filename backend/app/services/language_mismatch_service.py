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