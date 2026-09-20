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
    assert "learning_sequence" not in skill_data


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


# --------------------------------------------------
# Phase 8.9.4 Learning Intelligence Tests
# --------------------------------------------------

# 10. Learning Recommendation Fallback (Unconfigured Key)
@patch.object(GeminiProvider, "is_configured", return_value=False)
def test_analyze_learning_fallback_when_unconfigured(mock_is_conf):
    response = client.post(
        "/api/v1/analyze/learning",
        json={
            "profile": SAMPLE_PROFILE,
            "missingSkills": ["Statistics & Probability", "Machine Learning"],
            "developingSkills": ["TensorFlow"],
            "priorityGaps": [{"skill": "Statistics & Probability", "priority": "HIGH", "reason": "Fundamental"}],
            "focusAreas": ["ML Pipelines"]
        },
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "fallback"
    l_data = data["data"]
    assert l_data["status"] == "fallback"
    assert l_data["target_career"] == "AI/ML Engineer"
    assert isinstance(l_data["learning_priorities"], list)
    assert isinstance(l_data["learning_sequence"], list)
    assert isinstance(l_data["recommended_topics"], list)
    assert isinstance(l_data["practice_focus"], list)
    assert l_data["confidence_level"] == "HIGH"


# 11. Learning Sequence & Prerequisite Validation (Gemini Provider Mocked)
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_learning_sequence_prerequisites(mock_gemini, mock_is_conf):
    mock_gemini.return_value = json.dumps({
        "target_career": "AI/ML Engineer",
        "learning_priorities": [
            {"skill": "Statistics & Probability", "priority": "HIGH", "reason": "Prerequisite for ML algorithms"}
        ],
        "learning_sequence": [
            {
                "order": 1,
                "skill": "Statistics & Probability",
                "topics": ["Probability Distributions", "Hypothesis Testing"],
                "prerequisites": ["Basic Mathematics"],
                "practice_focus": ["Solve statistical inference problems"],
                "estimated_effort": "MEDIUM"
            },
            {
                "order": 2,
                "skill": "Machine Learning",
                "topics": ["Supervised Learning", "Unsupervised Learning"],
                "prerequisites": ["Statistics & Probability"],
                "practice_focus": ["Train scikit-learn models"],
                "estimated_effort": "HIGH"
            }
        ],
        "recommended_topics": ["Probability Distributions", "Supervised Learning"],
        "practice_focus": ["Solve statistical inference problems", "Train scikit-learn models"],
        "learning_summary": "Sequenced learning plan prioritizing statistics before machine learning.",
        "confidence_level": "HIGH"
    })

    provider = GeminiProvider(api_key="test_key_learning")
    profile = CareerProfile(**SAMPLE_PROFILE)
    result = provider.generate_learning_recommendations(profile)

    assert result is not None
    assert result.status == "ai_generated"
    assert result.target_career == "AI/ML Engineer"
    assert len(result.learning_sequence) == 2
    assert result.learning_sequence[0].order == 1
    assert result.learning_sequence[0].skill == "Statistics & Probability"
    assert result.learning_sequence[1].order == 2
    assert result.learning_sequence[1].skill == "Machine Learning"
    assert "Statistics & Probability" in result.learning_sequence[1].prerequisites


# 12. Mastered Skill Protection (Current Skills Not Classified as Missing)
@patch.object(GeminiProvider, "is_configured", return_value=False)
def test_analyze_learning_mastered_skill_protection(mock_is_conf):
    # Profile with mastered Python skill
    profile_with_python = {
        "targetCareer": "AI/ML Engineer",
        "skills": ["Python", "NumPy", "Pandas"]
    }
    response = client.post(
        "/api/v1/analyze/learning",
        json={"profile": profile_with_python, "missingSkills": ["Python", "Machine Learning"]},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    l_data = data["data"]
    # Python is in profile.skills, so it should be filtered out from missing skills in learning_priorities
    missing_priority_skills = [p["skill"] for p in l_data["learning_priorities"] if p["priority"] == "HIGH"]
    assert "Python" not in missing_priority_skills


# 13. Learning Analysis Malformed Output Fallback
@patch.object(GeminiProvider, "is_configured", return_value=True)
@patch.object(GeminiProvider, "_call_gemini_api")
def test_analyze_learning_malformed_json_fallback(mock_gemini, mock_is_conf):
    mock_gemini.return_value = "Non-JSON response text"
    response = client.post(
        "/api/v1/analyze/learning",
        json={"profile": SAMPLE_PROFILE},
        headers=VALID_HEADER
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "fallback"
    assert data["data"]["status"] == "fallback"
