/**
 * CAREERPILOT AI — NODE.JS TO FASTAPI CLIENT SERVICE
 * 
 * Reusable server-to-server client for communicating with the Python FastAPI AI service.
 * Handles request timeouts, header-based server-to-server authentication (X-AI-Service-Key),
 * and graceful fallback handling without exposing internal stack traces or secrets.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || 'placeholder_secret_key_change_in_production';
const DEFAULT_TIMEOUT_MS = parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '5000', 10);

const aiClient = {
  AI_SERVICE_URL,

  /**
   * Internal helper to send HTTP requests to FastAPI with timeout & authentication
   */
  async _request(path, options = {}) {
    const baseUrl = this.AI_SERVICE_URL || AI_SERVICE_URL;
    const url = `${baseUrl}${path}`;
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
      'Accept': 'application/json',
      'X-AI-Service-Key': AI_SERVICE_SECRET,
      ...(options.headers || {})
    };

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP_${response.status}`,
          message: data.message || `AI service returned status ${response.status}`,
          statusCode: response.status
        };
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'AI_SERVICE_TIMEOUT',
          message: `AI service request timed out after ${timeoutMs}ms`
        };
      }

      return {
        success: false,
        error: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI service is currently unavailable or unreachable'
      };
    }
  },

  /**
   * Check FastAPI service health status (Unprotected GET /health)
   */
  async checkHealth() {
    try {
      const baseUrl = this.AI_SERVICE_URL || AI_SERVICE_URL;
      const url = `${baseUrl}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: true, service: 'careerpilot-ai-service', data };
      }

      return { success: false, error: 'AI_SERVICE_UNHEALTHY', statusCode: response.status };
    } catch (err) {
      return { success: false, error: 'AI_SERVICE_UNAVAILABLE', message: 'FastAPI AI service is offline' };
    }
  },

  /**
   * Request AI Career Profile Analysis (POST /api/v1/analyze/career)
   */
  async analyzeCareer(profileData) {
    return this._request('/api/v1/analyze/career', {
      method: 'POST',
      body: { profile: profileData }
    });
  },

  /**
   * Request AI Skill Gap Analysis (POST /api/v1/analyze/skills)
   */
  async analyzeSkills(profileData, targetSkills = []) {
    return this._request('/api/v1/analyze/skills', {
      method: 'POST',
      body: { profile: profileData, targetSkills }
    });
  },

  /**
   * Request AI Learning Recommendation (POST /api/v1/analyze/learning)
   */
  async analyzeLearning(profileData, focusAreas = []) {
    return this._request('/api/v1/analyze/learning', {
      method: 'POST',
      body: { profile: profileData, focusAreas }
    });
  }
};

module.exports = aiClient;
