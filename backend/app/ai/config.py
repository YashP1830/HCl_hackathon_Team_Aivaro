import os

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "1536"))
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "")
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "support@library.example.com")