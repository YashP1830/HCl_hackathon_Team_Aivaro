import os
import smtplib
from email.mime.text import MIMEText

class EmailProvider:
    def __init__(self):
        self.host = os.getenv("SMTP_HOST", "localhost")
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.username = os.getenv("SMTP_USERNAME", "")
        self.password = os.getenv("SMTP_PASSWORD", "")
        self.from_addr = os.getenv("EMAIL_FROM", "no-reply@library.example.com")

    def send_email(self, to_addr: str, subject: str, body: str) -> bool:
        if not self.username or not self.password:
            # Safe local dry-run if credentials are empty
            print(f"[DRY-RUN EMAIL] To: {to_addr} | Subject: {subject}\n{body}")
            return True

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = self.from_addr
        msg["To"] = to_addr

        try:
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"Failed to send email to {to_addr}: {e}")
            return False