import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.notifications.reminder_service import ReminderService

def run_daily_overdue_reminders():
    db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://user:password@localhost:5432/library_assistant")
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    
    db = SessionLocal()
    try:
        service = ReminderService()
        result = service.process_overdue_reminders(db)
        print(f"Daily Overdue Reminders Complete: {result}")
    finally:
        db.close()

if __name__ == "__main__":
    run_daily_overdue_reminders()