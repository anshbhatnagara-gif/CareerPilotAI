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
def test_analyze_unauthorized():
    response = client.post("/api/v1/analyze/career", json={"profile": SAMPLE_PROFILE})
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "UNAUTHORIZED"


def test_analyze_invalid_key():
    response = client.post(
        "/api/v1/analyze/career",
        json={"profile": SAMPLE_PROFILE},
        headers=INVALID_HEADER
    )
    assert response.status_code == 401


# 2. Career Analysis Fallback (Unconfigured API Key)
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
    assert data["data"]["confidence_level"] == "HIGH"


# 3. Skill Gap Analysis Fallback (Unconfigured API Key & Case Normalization)
@patch.object(GeminiProvider, "is_configured", return_value=False)
def test_analyze_skills_fallback_when_unconfigured(mock_is_conf):
    response = client.post(
        "/api/v1/analyze/skills",
        json={"profile": SAMPLE_PROFILE, "targetSkills": ["MLOps"]},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "fallback"
    skill_data = data["data"]
    assert skill_data["status"] == "fallback"
    assert skill_data["target_career"] == "AI/ML Engineer"
    assert isinstance(skill_data["required_skills"], list)
    assert isinstance(skill_data["matched_skills"], list)
    assert isinstance(skill_data["missing_skills"], list)
    assert isinstance(skill_data["priority_gaps"], list)
    assert skill_data["confidence_level"] == "HIGH"
    # Ensure no learning roadmap fields were added to skill gap payload
    assert "learning_order" not in skill_data
    assert "recommendations" not in skill_data


# 4. Target Career Preservation Test
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_skills_target_career_preservation(mock_gemini, mock_is_conf):
    mock_gemini.return_value = json.dumps({
        "target_career": "AI/ML Engineer",
        "required_skills": ["Python", "Statistics", "Machine Learning"],
        "matched_skills": ["Python"],
        "developing_skills": [],
        "missing_skills": ["Statistics", "Machine Learning"],
        "priority_gaps": [
            {"skill": "Statistics", "priority": "HIGH", "reason": "Fundamental for ML theory"}
        ],
        "skill_gap_summary": "Candidate has solid Python foundation but requires statistics depth.",
        "confidence_level": "HIGH"
    })

    provider = GeminiProvider(api_key="test_api_key_123")
    profile = CareerProfile(**SAMPLE_PROFILE)
    result = provider.generate_skill_insights(profile)

    assert result is not None
    assert result.status == "ai_generated"
    assert result.target_career == "AI/ML Engineer"
    assert "Python" in result.matched_skills
    assert "Statistics" in result.missing_skills


# 5. Empty Skills Fallback Confidence Test
@patch.object(GeminiProvider, "is_configured", return_value=False)
def test_analyze_skills_empty_skills_fallback(mock_is_conf):
    empty_profile = {"targetCareer": "Frontend Developer", "skills": []}
    response = client.post(
        "/api/v1/analyze/skills",
        json={"profile": empty_profile},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["confidence_level"] == "LOW"
    assert len(data["data"]["missing_skills"]) > 0


# 6. Malformed Gemini JSON -> Fallback Engine Activation
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_skills_malformed_json_fallback(mock_gemini, mock_is_conf):
    mock_gemini.return_value = "Invalid json text output!"
    response = client.post(
        "/api/v1/analyze/skills",
        json={"profile": SAMPLE_PROFILE},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "fallback"
    assert data["data"]["status"] == "fallback"


# 7. Gemini Provider Error -> Fallback Engine Activation
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_skills_provider_error_fallback(mock_gemini, mock_is_conf):
    mock_gemini.return_value = None
    response = client.post(
        "/api/v1/analyze/skills",
        json={"profile": SAMPLE_PROFILE},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "fallback"


# 8. Secret Protection Audit
def test_secret_protection_in_outputs():
    response = client.post(
        "/api/v1/analyze/skills",
        json={"profile": SAMPLE_PROFILE},
        headers=VALID_HEADER
    )
    raw_res = response.text
    assert "test_api_key" not in raw_res
    assert "placeholder_secret_key" not in raw_res


# 9. Invalid Payload Schema Validation Rejection (422)
def test_analyze_invalid_payload():
    response = client.post(
        "/api/v1/analyze/skills",
        json={"invalidField": 123},
        headers=VALID_HEADER
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "VALIDATION_ERROR"
