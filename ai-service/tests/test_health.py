from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["service"] == "careerpilot-ai-service"
    assert data["message"] == "CareerPilot AI service is running"


def test_get_dependency_health():
    response = client.get("/health/dependencies")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["service"] == "careerpilot-ai-service"
    assert "dependencies" in data
    assert data["dependencies"]["configuration"] == "ready"
