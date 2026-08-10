from pathlib import Path
import re

from langchain_core.documents import Document


QUESTIONS_DIR = Path("data/questions")


def extract_topic(content: str) -> str:
    """
    Extract the topic from a Markdown line such as:
    ## Topic: LLM Fundamentals
    """

    match = re.search(
        r"^## Topic:\s*(.+)$",
        content,
        re.MULTILINE,
    )

    if match:
        return match.group(1).strip()

    return "Unknown"


def load_interview_documents():
    documents = []

    roles = [
        "AI_Engineer",
        "ML_Engineer",
        "Data_Scientist",
    ]

    difficulties = [
        "easy",
        "medium",
        "hard",
    ]

    for role in roles:
        for difficulty in difficulties:

            folder = QUESTIONS_DIR / role / difficulty

            for file_path in folder.glob("*.md"):

                content = file_path.read_text(
                    encoding="utf-8"
                )

                # Extract topic from Markdown
                topic = extract_topic(content)

                document = Document(
                    page_content=content,
                    metadata={
                        "role": role,
                        "difficulty": difficulty,
                        "topic": topic,
                        "source": file_path.name,
                    },
                )

                documents.append(document)

    return documents


if __name__ == "__main__":

    docs = load_interview_documents()

    print(
        f"Loaded {len(docs)} interview documents"
    )

    if docs:
        print("\nExample document metadata:")
        print(docs[0].metadata)

        print("\nExample document content:")
        print(docs[0].page_content[:500])