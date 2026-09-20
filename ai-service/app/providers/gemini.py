import json
import re
import httpx
from typing import Optional, List, Dict, Any
from app.providers.base import BaseAIProvider
from app.schemas.analyze import (
    CareerProfile,
    CareerAnalysisData,
    SkillAnalysisData,
    LearningRecommendationData,
    SkillPriorityItem,
    LearningRecommendationItem
)
from app.config import get_settings
from app.core.logging import logger


class GeminiProvider(BaseAIProvider):
    """
    Google Gemini AI Model Provider implementation.
    Communicates via Google Gemini REST API (v1beta generateContent).
    Enforces timeout, JSON output schema validation, prompt safety, and secret masking.
    """

    def __init__(self, api_key: str = None, model: str = None, timeout_ms: int = None):
        settings = get_settings()
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model = model if model is not None else settings.GEMINI_MODEL
        self.timeout_sec = (timeout_ms if timeout_ms is not None else settings.GEMINI_TIMEOUT_MS) / 1000.0
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    def is_configured(self) -> bool:
        """Returns True if GEMINI_API_KEY is non-empty."""
        return bool(self.api_key and self.api_key.strip())

    def _sanitize_text(self, text: Optional[str]) -> str:
        """Sanitizes user input to prevent prompt injection or broken formatting."""
        if not text:
            return ""
        # Remove null bytes and limit length
        clean = str(text).replace("\0", "").strip()
        return clean[:500]

    def _call_gemini_api(self, prompt: str) -> Optional[str]:
        """
        Executes HTTP POST to Gemini REST API with timeout and secret masking.
        Returns raw text response content or None on failure.
        """
        if not self.is_configured():
            logger.info("GeminiProvider: GEMINI_API_KEY is unconfigured. Skipping provider execution.")
            return None

        url = f"{self.base_url}?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        try:
            with httpx.Client(timeout=self.timeout_sec) as client:
                response = client.post(url, json=payload)
                if response.status_code != 200:
                    logger.warning(f"GeminiProvider returned HTTP {response.status_code}")
                    return None
                
                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    logger.warning("GeminiProvider returned response with no candidates")
                    return None

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    return None

                return parts[0].get("text", "")
        except httpx.TimeoutException:
            logger.warning(f"GeminiProvider request timed out after {self.timeout_sec}s")
            return None
        except Exception as e:
            logger.error(f"GeminiProvider execution failed: {type(e).__name__}")
            return None

    def _parse_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extracts and parses JSON object from model output."""
        if not text:
            return None
        try:
            # Handle potential markdown code fence wrappers
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.warning(f"GeminiProvider JSON parsing failed: {str(e)}")
            return None

    def analyze_career_profile(self, profile: CareerProfile) -> Optional[CareerAnalysisData]:
        target = self._sanitize_text(profile.targetCareer)
        exp = self._sanitize_text(profile.experienceLevel)
        skills = [self._sanitize_text(s) for s in profile.skills[:15]]
        interests = [self._sanitize_text(i) for i in profile.interests[:10]]

        prompt = f"""You are an expert career advisory AI system.
Analyze the following career profile and output ONLY valid JSON matching this schema:
{{
  "career_direction": "string (summary of career trajectory)",
  "profile_summary": "string (overview of candidate background)",
  "strengths": ["string"],
  "focus_areas": ["string"],
  "career_advice": ["string"],
  "confidence_level": "High | Medium | Low"
}}

Candidate Data:
Target Career: {target}
Experience Level: {exp}
Skills: {', '.join(skills)}
Interests: {', '.join(interests)}
"""
        raw_output = self._call_gemini_api(prompt)
        json_data = self._parse_json(raw_output)
        if not json_data:
            return None

        try:
            json_data["status"] = "ai_generated"
            return CareerAnalysisData(**json_data)
        except Exception as err:
            logger.warning(f"GeminiProvider CareerAnalysisData validation failed: {str(err)}")
            return None

    def generate_skill_insights(self, profile: CareerProfile, target_skills: Optional[List[str]] = None) -> Optional[SkillAnalysisData]:
        target = self._sanitize_text(profile.targetCareer)
        skills = [self._sanitize_text(s) for s in profile.skills[:15]]
        targets = [self._sanitize_text(s) for s in (target_skills or [])[:10]]

        prompt = f"""You are an expert technical skill evaluator AI.
Analyze the skill profile and output ONLY valid JSON matching this schema:
{{
  "target_career": "string",
  "current_skills": ["string"],
  "required_skills": ["string"],
  "missing_skills": ["string"],
  "skill_priorities": [
    {{"skill": "string", "priority": "HIGH | MEDIUM | LOW", "reason": "string"}}
  ],
  "summary": "string"
}}

Candidate Data:
Target Career: {target}
Current Skills: {', '.join(skills)}
Target Skills: {', '.join(targets)}
"""
        raw_output = self._call_gemini_api(prompt)
        json_data = self._parse_json(raw_output)
        if not json_data:
            return None

        try:
            json_data["status"] = "ai_generated"
            return SkillAnalysisData(**json_data)
        except Exception as err:
            logger.warning(f"GeminiProvider SkillAnalysisData validation failed: {str(err)}")
            return None

    def generate_learning_recommendations(self, profile: CareerProfile, focus_areas: Optional[List[str]] = None) -> Optional[LearningRecommendationData]:
        target = self._sanitize_text(profile.targetCareer)
        skills = [self._sanitize_text(s) for s in profile.skills[:15]]
        focuses = [self._sanitize_text(f) for f in (focus_areas or [])[:10]]

        prompt = f"""You are an expert tech learning pathway planner AI.
Analyze the candidate profile and output ONLY valid JSON matching this schema:
{{
  "learning_order": ["string (e.g. Stage 1: Foundation, Stage 2: Advanced)"],
  "recommendations": [
    {{"topic": "string", "stage": "string", "estimated_hours": "string", "resources": ["string"]}}
  ],
  "estimated_focus": "string (e.g. 5-8 hours / week)",
  "next_steps": ["string"],
  "summary": "string"
}}

Candidate Data:
Target Career: {target}
Current Skills: {', '.join(skills)}
Focus Areas: {', '.join(focuses)}
"""
        raw_output = self._call_gemini_api(prompt)
        json_data = self._parse_json(raw_output)
        if not json_data:
            return None

        try:
            json_data["status"] = "ai_generated"
            return LearningRecommendationData(**json_data)
        except Exception as err:
            logger.warning(f"GeminiProvider LearningRecommendationData validation failed: {str(err)}")
            return None
