"""Smoke tests for the meta endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["app"] == "DocExplainSG"
    # Key must never be leaked; only a boolean about configuration.
    assert isinstance(body["gemini_configured"], bool)
    assert "gemini_api_key" not in body


def test_root_ok():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["health"] == "/api/health"
