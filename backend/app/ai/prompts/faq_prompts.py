FAQ_GRADE_PROMPT = """
You are judging whether a retrieved FAQ answers a user's question.
User question: "{question}"
Retrieved FAQ Question: "{retrieved_question}"
Retrieved FAQ Answer: "{retrieved_answer}"

Does this retrieved answer adequately and accurately address the user question?
Answer only YES or NO.
"""

FAQ_REWRITE_PROMPT = """
Rewrite the following user inquiry to make it more specific and better suited for semantic FAQ retrieval:
Inquiry: "{question}"
Output only the rephrased query.
"""