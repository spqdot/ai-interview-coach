VOICE_CONTENT = {
    "pt-PT": {
        "greeting": "Olá {name}! Bem-vinda à sua entrevista simulada para {role}.",
        "rag": "Explique o que é a Geração Aumentada por Recuperação (RAG) e descreva como funciona.",
        "embeddings": "Que papel desempenham os embeddings num sistema RAG?",
        "vector": "Porque é que um sistema RAG utiliza uma base de dados vetorial?",
        "project": "Pode descrever um projeto relevante em que trabalhou, o problema que resolveu e a sua contribuição pessoal?",
        "challenge": "Qual foi um desafio técnico nesse projeto e como o resolveu?",
    },
    "de-DE": {
        "greeting": "Hallo {name}! Willkommen zu Ihrem Probeinterview als {role}.",
        "rag": "Erklären Sie Retrieval-Augmented Generation (RAG) und beschreiben Sie, wie es funktioniert.",
        "embeddings": "Welche Rolle spielen Embeddings in einem RAG-System?",
        "vector": "Warum verwendet ein RAG-System eine Vektordatenbank?",
        "project": "Beschreiben Sie ein relevantes Projekt, an dem Sie gearbeitet haben, das Problem und Ihren persönlichen Beitrag.",
        "challenge": "Was war eine technische Herausforderung in diesem Projekt und wie haben Sie sie gelöst?",
    },
    "zh-CN": {
        "greeting": "你好，{name}！欢迎参加 {role} 模拟面试。",
        "rag": "请解释什么是检索增强生成（RAG），并说明它如何工作。",
        "embeddings": "嵌入在 RAG 系统中起什么作用？",
        "vector": "为什么 RAG 系统要使用向量数据库？",
        "project": "请描述你参与过的一个相关项目、它解决的问题，以及你的个人贡献。",
        "challenge": "该项目中一个技术挑战是什么？你是如何解决的？",
    },
    "es-ES": {
        "greeting": "Hola {name}. Bienvenida a tu entrevista simulada para {role}.",
        "rag": "Explica qué es la Generación Aumentada por Recuperación (RAG) y describe cómo funciona.",
        "embeddings": "¿Qué papel desempeñan los embeddings en un sistema RAG?",
        "vector": "¿Por qué un sistema RAG utiliza una base de datos vectorial?",
        "project": "¿Puedes describir un proyecto relevante en el que trabajaste, el problema que resolvió y tu contribución personal?",
        "challenge": "¿Cuál fue un desafío técnico de ese proyecto y cómo lo resolviste?",
    },
    "it-IT": {
        "greeting": "Ciao {name}! Benvenuta al colloquio simulato per {role}.",
        "rag": "Spiega cos'è la Retrieval-Augmented Generation (RAG) e descrivi come funziona.",
        "embeddings": "Che ruolo hanno gli embedding in un sistema RAG?",
        "vector": "Perché un sistema RAG utilizza un database vettoriale?",
        "project": "Puoi descrivere un progetto rilevante a cui hai lavorato, il problema risolto e il tuo contributo personale?",
        "challenge": "Quale difficoltà tecnica hai incontrato nel progetto e come l'hai affrontata?",
    },
}


def localized_greeting(language: str, name: str, role: str) -> str:
    content = VOICE_CONTENT.get(language)
    if content is None:
        return f"Hello {name}! Welcome to your {role} mock interview."
    return content["greeting"].format(name=name, role=role)


def localize_question(question: str, language: str) -> str:
    content = VOICE_CONTENT.get(language)
    if content is None:
        return question

    questions = {
        "Explain what Retrieval-Augmented Generation (RAG) is and describe how it works.": "rag",
        "What role do embeddings play in a RAG system?": "embeddings",
        "Why does a RAG system use a vector database?": "vector",
        "Can you describe one relevant project you worked on, the problem it solved, and your personal contribution?": "project",
        "What was one technical challenge in that project, and how did you address it?": "challenge",
    }
    key = questions.get(question)
    return content[key] if key else question