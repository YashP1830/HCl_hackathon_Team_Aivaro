def route_faq_relevance(state: dict) -> str:
    if state.get("is_relevant", False):
        return "answer"
    if state.get("retries", 0) < 1:
        return "retry"
    return "fallback"