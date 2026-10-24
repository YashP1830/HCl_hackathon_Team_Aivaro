from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.app.notifications.email_provider import EmailProvider
from backend.app.notifications.templates import DUE_DATE_REMINDER_SUBJECT, DUE_DATE_REMINDER_BODY

class ReminderService:
    def __init__(self):
        self.email_provider = EmailProvider()

    def process_overdue_reminders(self, db: Session) -> dict:
        now = datetime.now(timezone.utc)
        
        # Query unreturned, overdue loans without existing reminder sent
        query = text("""
            SELECT 
                l.id AS loan_id,
                l.due_at,
                l.borrowed_at,
                u.name AS user_name,
                u.email AS user_email,
                b.title AS book_title
            FROM loans l
            JOIN users u ON l.user_id = u.id
            JOIN books b ON l.book_id = b.id
            WHERE l.returned_at IS NULL
              AND l.due_at < :now
              AND l.reminder_sent_at IS NULL
        """)
        overdue_loans = db.execute(query, {"now": now}).mappings().all()

        sent_count = 0
        failed_count = 0

        for loan in overdue_loans:
            body = DUE_DATE_REMINDER_BODY.format(
                user_name=loan["user_name"],
                book_title=loan["book_title"],
                borrowed_at=loan["borrowed_at"].strftime("%Y-%m-%d"),
                due_at=loan["due_at"].strftime("%Y-%m-%d")
            )
            success = self.email_provider.send_email(
                to_addr=loan["user_email"],
                subject=DUE_DATE_REMINDER_SUBJECT,
                body=body
            )
            if success:
                update_query = text("""
                    UPDATE loans 
                    SET reminder_sent_at = :now 
                    WHERE id = :loan_id
                """)
                db.execute(update_query, {"now": now, "loan_id": loan["loan_id"]})
                db.commit()
                sent_count += 1
            else:
                failed_count += 1

        return {
            "processed_at": now.isoformat(),
            "reminders_sent": sent_count,
            "reminders_failed": failed_count
        }