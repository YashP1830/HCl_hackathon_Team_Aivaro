from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_reports_running():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_liveness_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
