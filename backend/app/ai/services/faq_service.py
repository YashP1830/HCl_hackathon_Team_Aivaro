from sqlalchemy.orm import Session
from backend.app.ai.graph.workflow import FAQGraphRunner

class FAQService:
    @staticmethod
    def answer_faq(db: Session, question: str) -> dict:
        runner = FAQGraphRunner(db)
        result = runner.run(question)
        return {
            "answer": result.get("answer", "An error occurred."),
            "status": result.get("status", "error"),
            "support_contact": result.get("support_contact"),
            "sources": result.get("sources", [])
        }