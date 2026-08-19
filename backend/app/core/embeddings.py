"""
Local embedding model wrapper (runs on CPU, no external API call —
docs/04-technical-architecture.md §5 rationale: avoids a second metered
dependency beyond the LLM itself).
"""

from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import get_settings

settings = get_settings()


@lru_cache
def get_embedding_model() -> SentenceTransformer:
    # Cached so the (fairly large) model loads only once per process,
    # not once per job. First call downloads the model from Hugging Face
    # (~90MB) — this requires internet access the first time only.
    return SentenceTransformer(settings.embedding_model_name)


def embed_text(text: str) -> list[float]:
    model = get_embedding_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()