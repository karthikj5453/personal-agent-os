import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_vision_status_endpoint():
    """Verify GET /api/v1/vision/status returns online status."""
    response = client.get("/api/v1/vision/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_vision_analyze_endpoint():
    """Verify POST /api/v1/vision/analyze returns mood analysis."""
    response = client.post(
        "/api/v1/vision/analyze",
        json={"image_b64": "data:image/jpeg;base64,mockframe"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["detected_mood"] in ["Focused", "Happy", "Tired"]
    assert "recommendation" in data
