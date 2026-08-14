from functools import lru_cache

import os

from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore

from backend.app.services.document_loader import load_interview_documents


# Load environment variables
load_dotenv("backend/.env")


INDEX_NAME = os.getenv(
    "PINECONE_INDEX_NAME",
    "question-answering",
)

NAMESPACE = os.getenv(
    "PINECONE_NAMESPACE",
    "ai-interview-coach",
)


@lru_cache(maxsize=1)
def get_embeddings():
    """
    Load the embedding model once and reuse it.
    """

    print("Loading embedding model...")

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    print("Embedding model loaded")

    return embeddings

def upload_documents_to_pinecone():
    """
    Load interview documents, create embeddings,
    and upload them to Pinecone.
    """

    print("Loading interview documents...")

    documents = load_interview_documents()

    print(f"Loaded {len(documents)} documents")

    print("Loading embedding model...")

    embeddings = get_embeddings()

    print("Embedding model loaded")

    print("Uploading documents to Pinecone...")

    vectorstore = PineconeVectorStore.from_documents(
        documents=documents,
        embedding=embeddings,
        index_name=INDEX_NAME,
        namespace=NAMESPACE,
    )

    print(
        f"Uploaded {len(documents)} documents "
        f"to Pinecone namespace '{NAMESPACE}'"
    )

    return vectorstore


@lru_cache(maxsize=1)
def get_vectorstore():
    """
    Connect to the existing Pinecone vector store once
    and reuse the connection.
    """

    embeddings = get_embeddings()

    return PineconeVectorStore(
        index_name=INDEX_NAME,
        embedding=embeddings,
        namespace=NAMESPACE,
    )


def search_interview_questions(
    query: str,
    role: str | None = None,
    difficulty: str | None = None,
    k: int = 3,
):
    """
    Search Pinecone for interview documents
    using semantic search and optional metadata filters.
    """

    vectorstore = get_vectorstore()

    filters = {}

    if role:
        filters["role"] = role

    if difficulty:
        filters["difficulty"] = difficulty.strip().lower()

    results = vectorstore.similarity_search(
        query=query,
        k=k,
        filter=filters if filters else None,
    )

    return results


if __name__ == "__main__":

    results = search_interview_questions(
        query="RAG architecture and retrieval",
        role="AI_Engineer",
        difficulty="medium",
        k=3,
    )

    print("\nTop matching documents:\n")

    for i, doc in enumerate(results, start=1):

        print(f"Result {i}")
        print(f"Role: {doc.metadata.get('role')}")
        print(f"Difficulty: {doc.metadata.get('difficulty')}")
        print(f"Topic: {doc.metadata.get('topic')}")
        print(f"Source: {doc.metadata.get('source')}")
        print("-" * 50)
