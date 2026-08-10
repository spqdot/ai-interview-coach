from backend.app.services.vectorstore_service import (
    search_interview_questions,
)


def retrieve_interview_context(
    role: str,
    difficulty: str,
    topic: str,
    k: int = 3,
):
    """
    Retrieve relevant interview documents from Pinecone
    based on role, difficulty, and topic.
    """

    documents = search_interview_questions(
        query=topic,
        role=role,
        difficulty=difficulty,
        k=k,
    )

    return documents


def build_context(documents):
    """
    Convert retrieved LangChain documents into
    one context string that can later be sent to the LLM.
    """

    context_parts = []

    for i, document in enumerate(documents, start=1):

        metadata = document.metadata

        context_part = f"""
REFERENCE DOCUMENT {i}

Role: {metadata.get("role")}
Difficulty: {metadata.get("difficulty")}
Topic: {metadata.get("topic")}
Source: {metadata.get("source")}

{document.page_content}
"""

        context_parts.append(context_part.strip())

    return "\n\n---\n\n".join(context_parts)


def get_interview_context(
    role: str,
    difficulty: str,
    topic: str,
    k: int = 3,
):
    """
    Complete retrieval step:
    Pinecone search -> documents -> formatted context.
    """

    documents = retrieve_interview_context(
        role=role,
        difficulty=difficulty,
        topic=topic,
        k=k,
    )

    context = build_context(documents)

    return context


if __name__ == "__main__":

    context = get_interview_context(
        role="AI_Engineer",
        difficulty="medium",
        topic="RAG architecture and retrieval",
        k=3,
    )

    print("\nRetrieved RAG Context:\n")
    print(context)