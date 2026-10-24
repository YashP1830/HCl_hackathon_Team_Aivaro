import requests
from typing import Dict, Any, List
from backend.app.ai.config import SERPAPI_API_KEY

class ResearchService:
    SERPAPI_URL = "https://serpapi.com/search.json"

    @classmethod
    def search_scholar(cls, topic: str, max_results: int = 5) -> Dict[str, Any]:
        if not SERPAPI_API_KEY:
            return {"topic": topic, "results": []}

        params = {
            "engine": "google_scholar",
            "q": topic,
            "hl": "en",
            "num": max_results,
            "api_key": SERPAPI_API_KEY
        }

        try:
            resp = requests.get(cls.SERPAPI_URL, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return {"topic": topic, "results": []}

        results: List[Dict[str, Any]] = []
        for item in data.get("organic_results", []):
            pub_info = item.get("publication_info", {})
            authors = [a.get("name") for a in pub_info.get("authors", [])] if pub_info.get("authors") else []
            
            # Extract publication year if available in summary
            summary = pub_info.get("summary", "")
            year = None
            for token in summary.split():
                if token.isdigit() and len(token) == 4:
                    year = int(token)
                    break

            results.append({
                "title": item.get("title", "Untitled Document"),
                "authors": authors,
                "year": year,
                "snippet": item.get("snippet", ""),
                "url": item.get("link"),
                "doi": None
            })

        return {
            "topic": topic,
            "results": results[:max_results]
        }