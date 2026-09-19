from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings

client = TestClient(app)
settings = get_settings()

VALID_HEADER = {"X-AI-Service-Key": settings.AI_SERVICE_SECRET}
INVALID_HEADER = {"X-AI-Service-Key": "wrong_secret_key"}

SAMPLE_PROFILE = {
    "targetCareer": "Software Engineer",
    "experienceLevel": "Entry Level",
    "skills": ["JavaScript", "Node.js", "Python"],
    "interests": ["Backend Development", "Cloud Computing"]
}


def test_analyze_career_unauthorized():
    response = client.post("/api/v1/analyze/career", json={"profile": SAMPLE_PROFILE})
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "UNAUTHORIZED"


def test_analyze_career_invalid_key():
    response = client.post(
        "/api/v1/analyze/career",
        json={"profile": SAMPLE_PROFILE},
        headers=INVALID_HEADER
    )
    assert response.status_code == 401


def test_analyze_career_success():
    response = client.post(
        "/api/v1/analyze/career",
        json={"profile": SAMPLE_PROFILE},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["service"] == "careerpilot-ai-service"
    assert data["status"] == "ready"
    assert "targetCareer" in data["data"]
    assert data["data"]["targetCareer"] == "Software Engineer"


def test_analyze_skills_success():
    response = client.post(
        "/api/v1/analyze/skills",
        json={
            "profile": SAMPLE_PROFILE,
            "targetSkills": ["System Design", "Docker"]
        },
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["skillsProvided"] == 3
    assert data["data"]["targetSkillsCount"] == 2


def test_analyze_learning_success():
    response = client.post(
        "/api/v1/analyze/learning",
        json={
            "profile": SAMPLE_PROFILE,
            "focusAreas": ["Algorithms", "Database Tuning"]
        },
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["focusAreasProvided"] == 2


def test_analyze_invalid_payload():
    response = client.post(
        "/api/v1/analyze/career",
        json={"invalidField": 123},
        headers=VALID_HEADER
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "VALIDATION_ERROR"
