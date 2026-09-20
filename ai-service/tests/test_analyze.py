import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings
from app.providers.gemini import GeminiProvider
from app.schemas.analyze import CareerProfile, CareerAnalysisData, SkillAnalysisData, LearningRecommendationData

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


# 1. Unauthorized & Invalid Key Tests
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


# 2. Missing GEMINI_API_KEY -> Deterministic Fallback Activation
@patch.object(GeminiProvider, "is_configured", return_value=False)
def test_analyze_career_fallback_when_unconfigured(mock_is_conf):
    response = client.post(
        "/api/v1/analyze/career",
        json={"profile": SAMPLE_PROFILE},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "fallback"
    assert data["data"]["status"] == "fallback"
    assert "career_direction" in data["data"]
    assert "strengths" in data["data"]
    assert "focus_areas" in data["data"]


@patch.object(GeminiProvider, "is_configured", return_value=False)
def test_analyze_skills_fallback_when_unconfigured(mock_is_conf):
    response = client.post(
        "/api/v1/analyze/skills",
        json={"profile": SAMPLE_PROFILE, "targetSkills": ["Docker"]},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "fallback"
    assert data["data"]["status"] == "fallback"
    assert "target_career" in data["data"]
    assert "skill_priorities" in data["data"]


@patch.object(GeminiProvider, "is_configured", return_value=False)
def test_analyze_learning_fallback_when_unconfigured(mock_is_conf):
    response = client.post(
        "/api/v1/analyze/learning",
        json={"profile": SAMPLE_PROFILE, "focusAreas": ["Algorithms"]},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "fallback"
    assert data["data"]["status"] == "fallback"
    assert "learning_order" in data["data"]
    assert "recommendations" in data["data"]


# 3. Successful Mocked Gemini Response -> status: "ai_generated"
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_career_gemini_success(mock_gemini, mock_is_conf):
    mock_gemini.return_value = json.dumps({
        "career_direction": "Strong backend trajectory targeting Cloud Software Engineer.",
        "profile_summary": "Candidate exhibits backend proficiency in Node.js and Python.",
        "strengths": ["Backend API Design", "Asynchronous Programming"],
        "focus_areas": ["Kubernetes", "Distributed Databases"],
        "career_advice": ["Build high-throughput microservices.", "Deploy projects on GCP/AWS."],
        "confidence_level": "High"
    })

    provider = GeminiProvider(api_key="test_api_key_123")
    profile = CareerProfile(**SAMPLE_PROFILE)
    result = provider.analyze_career_profile(profile)

    assert result is not None
    assert result.status == "ai_generated"
    assert result.confidence_level == "High"
    assert "Strong backend" in result.career_direction


# 4. Malformed Gemini Response -> Fallback Activation
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_career_gemini_malformed_json(mock_gemini, mock_is_conf):
    mock_gemini.return_value = "This is not valid JSON content!"
    provider = GeminiProvider(api_key="test_api_key_123")
    profile = CareerProfile(**SAMPLE_PROFILE)
    result = provider.analyze_career_profile(profile)
    assert result is None  # Triggers fallback engine in AIService


# 5. Gemini Provider Timeout / Error -> Fallback Activation
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_career_gemini_provider_error(mock_gemini, mock_is_conf):
    mock_gemini.return_value = None
    provider = GeminiProvider(api_key="test_api_key_123")
    profile = CareerProfile(**SAMPLE_PROFILE)
    result = provider.analyze_career_profile(profile)
    assert result is None  # Triggers fallback engine in AIService


# 6. Secret Value Protection Check
def test_secret_protection_in_outputs():
    response = client.post(
        "/api/v1/analyze/career",
        json={"profile": SAMPLE_PROFILE},
        headers=VALID_HEADER
    )
    raw_res = response.text
    assert "test_api_key" not in raw_res
    assert "placeholder_secret_key" not in raw_res


# 7. Invalid Payload Schema Validation Rejection (422)
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
