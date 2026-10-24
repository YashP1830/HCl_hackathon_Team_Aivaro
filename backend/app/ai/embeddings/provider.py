from typing import List
from openai import OpenAI
from backend.app.ai.embeddings.base import BaseEmbedder
from backend.app.ai.config import LLM_API_KEY, EMBEDDING_MODEL, EMBEDDING_DIMENSION

class OpenAIEmbedder(BaseEmbedder):
    def __init__(self):
        self.client = OpenAI(api_key=LLM_API_KEY)
        self.model = EMBEDDING_MODEL
        self.dimension = EMBEDDING_DIMENSION

    def embed_text(self, text: str) -> List[float]:
        cleaned = text.replace("\n", " ").strip()
        response = self.client.embeddings.create(input=[cleaned], model=self.model)
        return response.data[0].embedding

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        cleaned = [t.replace("\n", " ").strip() for t in texts]
        response = self.client.embeddings.create(input=cleaned, model=self.model)
        return [item.embedding for item in response.data]