import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "active_sessions" in data


def test_sessions_endpoint():
    response = client.get("/api/sessions")
    assert response.status_code == 200
    data = response.json()
    assert "sessions" in data


def test_empty_question_chat_validation():
    response = client.post("/api/chat", json={"question": ""})
    assert response.status_code == 400


def test_chat_without_active_session():
    # If no sessions have been uploaded yet and random ID provided
    response = client.post("/api/chat", json={"question": "What is this?", "session_id": "nonexistent_sid"})
    assert response.status_code == 404
