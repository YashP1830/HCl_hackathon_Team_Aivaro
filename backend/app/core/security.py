from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash

_password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return _password_hash.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return _password_hash.verify(password, password_hash)

def create_access_token(user_id: str, secret_key: str, expires_minutes: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": user_id, "iat": now, "exp": now + timedelta(minutes=expires_minutes)},
        secret_key,
        algorithm="HS256",
    )
