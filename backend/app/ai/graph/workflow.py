from langgraph.graph import StateGraph, END
from openai import OpenAI
from backend.app.ai.graph.state import FAQState
from backend.app.ai.graph.router import route_faq_relevance
from backend.app.ai.retrieval.vector_store import VectorStoreRetrieval
from backend.app.ai.embeddings.provider import OpenAIEmbedder
from backend.app.ai.prompts.faq_prompts import FAQ_GRADE_PROMPT, FAQ_REWRITE_PROMPT
from backend.app.ai.config import LLM_API_KEY, LLM_MODEL, SUPPORT_EMAIL

class FAQGraphRunner:
    def __init__(self, db_session):
        self.db = db_session
        self.embedder = OpenAIEmbedder()
        self.client = OpenAI(api_key=LLM_API_KEY)
        self.workflow = self._build_graph()

    def _retrieve_node(self, state: FAQState) -> dict:
        q = state["rephrased_question"] if state["retries"] > 0 and state.get("rephrased_question") else state["question"]
        vec = self.embedder.embed_text(q)
        matches = VectorStoreRetrieval.search_faqs(self.db, vec, top_k=1)
        match = matches[0] if matches else None
        return {"match": match}

    def _grade_node(self, state: FAQState) -> dict:
        match = state.get("match")
        if not match or match.get("distance", 1.0) > 0.45:
            return {"is_relevant": False}

        prompt = FAQ_GRADE_PROMPT.format(
            question=state["question"],
            retrieved_question=match.get("question", ""),
            retrieved_answer=match.get("answer", "")
        )
        res = self.client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        content = (res.choices[0].message.content or "").strip().upper()
        return {"is_relevant": "YES" in content}

    def _retry_node(self, state: FAQState) -> dict:
        prompt = FAQ_REWRITE_PROMPT.format(question=state["question"])
        res = self.client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        rephrased = (res.choices[0].message.content or state["question"]).strip()
        return {"rephrased_question": rephrased, "retries": state["retries"] + 1}

    def _answer_node(self, state: FAQState) -> dict:
        match = state["match"]
        return {
            "status": "answered",
            "answer": match["answer"],
            "support_contact": None,
            "sources": [{"faq_id": str(match["id"]), "question": match["question"]}]
        }

    def _fallback_node(self, state: FAQState) -> dict:
        return {
            "status": "fallback",
            "answer": "We couldn't find a direct answer to your question in our FAQ. Please reach out to our support team.",
            "support_contact": SUPPORT_EMAIL,
            "sources": []
        }

    def _build_graph(self):
        builder = StateGraph(FAQState)
        builder.add_node("retrieve", self._retrieve_node)
        builder.add_node("grade", self._grade_node)
        builder.add_node("retry", self._retry_node)
        builder.add_node("answer", self._answer_node)
        builder.add_node("fallback", self._fallback_node)

        builder.set_entry_point("retrieve")
        builder.add_edge("retrieve", "grade")
        builder.add_conditional_edges("grade", route_faq_relevance, {
            "answer": "answer",
            "retry": "retry",
            "fallback": "fallback"
        })
        builder.add_edge("retry", "retrieve")
        builder.add_edge("answer", END)
        builder.add_edge("fallback", END)

        return builder.compile()

    def run(self, question: str) -> dict:
        initial_state: FAQState = {
            "question": question,
            "rephrased_question": None,
            "retries": 0,
            "match": None,
            "is_relevant": False,
            "status": "error",
            "answer": "",
            "support_contact": None,
            "sources": []
        }
        return self.workflow.invoke(initial_state)