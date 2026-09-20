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
    "targetCareer": "AI/ML Engineer",
    "experienceLevel": "Entry Level",
    "goal": "Specialize in machine learning pipelines",
    "skills": ["Python", "NumPy", "TensorFlow"],
    "interests": ["Artificial Intelligence", "Deep Learning"],
    "personal": {
        "fullName": "Alex Rivera",
        "location": "San Francisco, CA"
    },
    "education": {
        "college": "Stanford University",
        "degree": "Bachelor of Science",
        "branch": "Computer Science",
        "currentYear": "Senior",
        "graduationYear": "2026"
    }
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
    assert "AI/ML Engineer" in data["data"]["career_direction"]
    assert "strengths" in data["data"]
    assert data["data"]["confidence_level"] == "HIGH"


# 3. Target Career Preservation in Gemini Response
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_career_gemini_target_preservation(mock_gemini, mock_is_conf):
    mock_gemini.return_value = json.dumps({
        "career_direction": "Target career alignment focused on AI/ML Engineer trajectory.",
        "profile_summary": "Stanford University CS candidate with Python exposure.",
        "strengths": ["Exposure to Python", "Exposure to TensorFlow"],
        "focus_areas": ["Advanced Linear Algebra", "Model Deployment"],
        "career_advice": ["Build end-to-end ML model APIs.", "Contribute to open-source ML frameworks."],
        "confidence_level": "HIGH"
    })

    provider = GeminiProvider(api_key="test_api_key_123")
    profile = CareerProfile(**SAMPLE_PROFILE)
    result = provider.analyze_career_profile(profile)

    assert result is not None
    assert result.status == "ai_generated"
    assert result.confidence_level == "HIGH"
    assert "AI/ML Engineer" in result.career_direction
    assert "Stanford" in result.profile_summary


# 4. Confidence Level Validation (HIGH, MODERATE, LOW)
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_career_confidence_validation(mock_gemini, mock_is_conf):
    mock_gemini.return_value = json.dumps({
        "career_direction": "Career path targeting AI/ML Engineer.",
        "profile_summary": "Minimal candidate details provided.",
        "strengths": ["Interest in tech"],
        "focus_areas": ["Foundations"],
        "career_advice": ["Study core concepts."],
        "confidence_level": "low"
    })

    provider = GeminiProvider(api_key="test_api_key_123")
    profile = CareerProfile(**{"targetCareer": "AI/ML Engineer"})
    result = provider.analyze_career_profile(profile)

    assert result is not None
    assert result.confidence_level == "LOW"


# 5. Malformed Gemini Response -> Fallback Activation
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_career_gemini_malformed_json(mock_gemini, mock_is_conf):
    mock_gemini.return_value = "This is not valid JSON content!"
    provider = GeminiProvider(api_key="test_api_key_123")
    profile = CareerProfile(**SAMPLE_PROFILE)
    result = provider.analyze_career_profile(profile)
    assert result is None  # Triggers fallback engine in AIService


# 6. Provider Error / Timeout -> Fallback Activation
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_career_gemini_provider_error(mock_gemini, mock_is_conf):
    mock_gemini.return_value = None
    provider = GeminiProvider(api_key="test_api_key_123")
    profile = CareerProfile(**SAMPLE_PROFILE)
    result = provider.analyze_career_profile(profile)
    assert result is None


# 7. Secret Value Protection Check
def test_secret_protection_in_outputs():
    response = client.post(
        "/api/v1/analyze/career",
        json={"profile": SAMPLE_PROFILE},
        headers=VALID_HEADER
    )
    raw_res = response.text
    assert "test_api_key" not in raw_res
    assert "placeholder_secret_key" not in raw_res


# 8. Invalid Payload Schema Validation Rejection (422)
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
