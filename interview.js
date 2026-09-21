/**
 * CAREERPILOT AI - PHASE 8.8.5 INTERVIEW SIMULATOR & CAREER TOOLS ENGINE
 * 
 * Migrated to backend APIs:
 * - GET  /api/interview/questions
 * - POST /api/interview/evaluate
 * - GET  /api/interview/history
 * - GET  /api/career-tools/evidence
 * - POST /api/career-tools/evidence
 * - GET  /api/career-tools/passport
 */

var getApiBaseUrl = (typeof window !== 'undefined' && window.getApiBaseUrl) ? window.getApiBaseUrl : function () {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return `${window.location.protocol}//${hostname}:5000/api`;
    }
    if (window.CAREERPILOT_API_BASE_URL) {
      return window.CAREERPILOT_API_BASE_URL;
    }
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  return (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) || '/api';
};

var API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : getApiBaseUrl();

const InterviewApp = {
  profile: null,
  readiness: null,
  questionsData: null,
  activeMode: 'QUICK',
  currentQuestionIndex: 0,
  activeTab: 'interview-tab',
  completedAnswersMap: {}, // in-memory answer buffer { questionId: text }
  evaluationResultsMap: {}, // in-memory question evaluation buffer { questionId: evalObj }
  lastEvaluation: null, // latest POST /api/interview/evaluate result
  interviewHistory: [],
  careerToolsEvidence: [],
  passportData: null,

  async init() {
    if (!(await this.protectRoute())) return;
    this.bindEvents();
    await this.loadAllBackendData();
    this.renderAll();

    // Clean up legacy localStorage keys after successful backend verification
    this.cleanupLegacyLocalStorage();
  },

  /**
   * Safe HTML Escaping Helper
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Route Guard: Requires auth, profile, and readiness via backend APIs
   */
  async protectRoute() {
    try {
      // 1. Auth check
      const authRes = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (authRes.status === 401) {
        window.location.href = 'login.html';
        return false;
      }
      const authData = await authRes.json();
      if (!authData.success || !authData.user) {
        window.location.href = 'login.html';
        return false;
      }

      // 2. Profile check
      const profileRes = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (profileRes.status === 401) {
        window.location.href = 'login.html';
        return false;
      }
      const profileJson = await profileRes.json();
      const profileData = profileJson.profile || profileJson.data;
      if (!profileJson.success || !profileData || !profileData.completed) {
        window.location.href = 'onboarding.html';
        return false;
      }
      this.profile = profileData;

      // 3. Readiness check
      const readinessRes = await fetch(`${API_BASE_URL}/readiness`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (readinessRes.status === 401) {
        window.location.href = 'login.html';
        return false;
      }
      const readinessJson = await readinessRes.json();
      const readinessData = readinessJson.readiness || readinessJson.data;
      if (!readinessJson.success || !readinessData || (!readinessData.targetCareer && !readinessData.targetRole)) {
        window.location.href = 'readiness.html';
        return false;
      }
      this.readiness = readinessData;

      return true;
    } catch (e) {
      console.error('Error during protectRoute check:', e);
      window.location.href = 'login.html';
      return false;
    }
  },

  /**
   * Event Bindings
   */
  bindEvents() {
    // Header user name
    if (this.profile && this.profile.personal && this.profile.personal.fullName) {
      const badgeName = document.getElementById('header-user-name');
      if (badgeName) badgeName.textContent = this.profile.personal.fullName;
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (typeof AuthService !== 'undefined' && typeof AuthService.logout === 'function') {
          await AuthService.logout();
        } else {
          try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
          } catch (err) {}
          window.location.href = 'login.html';
        }
      });
    }

    // Navigation buttons
    const reviewBtn = document.getElementById('review-profile-btn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        window.location.href = 'onboarding.html';
      });
    }

    const backProjectsBtn = document.getElementById('back-projects-btn');
    if (backProjectsBtn) {
      backProjectsBtn.addEventListener('click', () => {
        window.location.href = 'projects.html';
      });
    }

    // Tool Tabs Switching
    const tabBtns = document.querySelectorAll('.tool-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetTabId = btn.dataset.tab;
        document.querySelectorAll('.tab-content-panel').forEach(panel => {
          panel.style.display = panel.id === targetTabId ? 'block' : 'none';
        });
        this.activeTab = targetTabId;
      });
    });

    // Mode Selector Buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const selectedMode = btn.dataset.mode;
        if (selectedMode && ['QUICK', 'STANDARD', 'DEEP'].includes(selectedMode)) {
          await this.switchInterviewMode(selectedMode);
        }
      });
    });

    // Textarea character count
    const answerInput = document.getElementById('user-answer-input');
    const charCount = document.getElementById('answer-char-count');
    if (answerInput && charCount) {
      answerInput.addEventListener('input', () => {
        charCount.textContent = answerInput.value.length + " characters";
        const q = this.getCurrentQuestion();
        if (q) {
          this.completedAnswersMap[q.id] = answerInput.value;
        }
      });
    }

    // Insert Sample Response button
    const sampleBtn = document.getElementById('btn-quick-sample');
    if (sampleBtn && answerInput) {
      sampleBtn.addEventListener('click', () => {
        const q = this.getCurrentQuestion();
        if (q && q.sampleAnswer) {
          answerInput.value = q.sampleAnswer;
          this.completedAnswersMap[q.id] = q.sampleAnswer;
          if (charCount) charCount.textContent = answerInput.value.length + " characters";
        }
      });
    }

    // Evaluate Answer Button
    const evalBtn = document.getElementById('btn-evaluate-answer');
    if (evalBtn) {
      evalBtn.addEventListener('click', async () => {
        await this.evaluateCurrentAnswer();
      });
    }

    // Next Question Button
    const nextQBtn = document.getElementById('btn-next-question');
    if (nextQBtn) {
      nextQBtn.addEventListener('click', () => {
        const questions = this.getActiveQuestions();
        if (this.currentQuestionIndex < questions.length - 1) {
          this.currentQuestionIndex++;
          this.renderQuestionView();
        } else {
          this.currentQuestionIndex = 0;
          this.renderQuestionView();
        }
      });
    }

    // Copy Resume Button
    const copyResumeBtn = document.getElementById('btn-copy-resume');
    if (copyResumeBtn) {
      copyResumeBtn.addEventListener('click', () => {
        const resumeText = this.generateMarkdownResume();
        navigator.clipboard.writeText(resumeText).then(() => {
          copyResumeBtn.textContent = 'COPIED TO CLIPBOARD ✓';
          setTimeout(() => { copyResumeBtn.textContent = 'COPY MARKDOWN'; }, 2000);
        });
      });
    }

    // Print Resume Button
    const printResumeBtn = document.getElementById('btn-print-resume');
    if (printResumeBtn) {
      printResumeBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Save Evidence Button
    const saveEvidenceBtn = document.getElementById('btn-save-evidence');
    if (saveEvidenceBtn) {
      saveEvidenceBtn.addEventListener('click', async () => {
        await this.saveEvidenceFromInputs();
      });
    }

    // Career Passport Modal Controls
    const viewPassportBtn = document.getElementById('view-passport-btn');
    const passportModal = document.getElementById('passport-modal-backdrop');
    const passportCloseBtn = document.getElementById('passport-close-btn');
    const passCloseModalBtn = document.getElementById('pass-close-modal-btn');

    if (viewPassportBtn && passportModal) {
      viewPassportBtn.addEventListener('click', async () => {
        await this.loadPassport();
        this.populatePassportModal();
        passportModal.style.display = 'flex';
      });
    }

    if (passportCloseBtn && passportModal) {
      passportCloseBtn.addEventListener('click', () => {
        passportModal.style.display = 'none';
      });
    }

    if (passCloseModalBtn && passportModal) {
      passCloseModalBtn.addEventListener('click', () => {
        passportModal.style.display = 'none';
      });
    }

    if (passportModal) {
      passportModal.addEventListener('click', (e) => {
        if (e.target === passportModal) passportModal.style.display = 'none';
      });
    }
  },

  /**
   * Load Data from Backend Services
   */
  async loadAllBackendData() {
    await Promise.all([
      this.fetchQuestions(),
      this.loadHistory(),
      this.loadEvidence(),
      this.loadPassport()
    ]);
  },

  /**
   * GET /api/interview/questions
   */
  async fetchQuestions() {
    try {
      const res = await fetch(`${API_BASE_URL}/interview/questions?mode=${encodeURIComponent(this.activeMode)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.status === 401) {
        window.location.href = 'login.html';
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        this.questionsData = data.data;
      }
    } catch (err) {
      console.error('Error fetching interview questions:', err);
    }
  },

  /**
   * GET /api/interview/history
   */
  async loadHistory() {
    try {
      const res = await fetch(`${API_BASE_URL}/interview/history`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.interviewHistory = data.data;
      }
    } catch (err) {
      console.error('Error fetching interview history:', err);
    }
  },

  /**
   * GET /api/career-tools/evidence
   */
  async loadEvidence() {
    try {
      const res = await fetch(`${API_BASE_URL}/career-tools/evidence`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.careerToolsEvidence = data.data;
      }
    } catch (err) {
      console.error('Error fetching career tools evidence:', err);
    }
  },

  /**
   * GET /api/career-tools/passport
   */
  async loadPassport() {
    try {
      const res = await fetch(`${API_BASE_URL}/career-tools/passport`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.success && data.data) {
        this.passportData = data.data;
      }
    } catch (err) {
      console.error('Error fetching career passport:', err);
    }
  },

  /**
   * Mode Switching Handler - Backend Fetch
   */
  async switchInterviewMode(mode) {
    if (!['QUICK', 'STANDARD', 'DEEP'].includes(mode)) return;
    this.activeMode = mode;
    this.currentQuestionIndex = 0;

    await this.fetchQuestions();

    this.renderModeUI();
    this.renderQuestionView();
  },

  /**
   * Get Active Questions array returned from backend
   */
  getActiveQuestions() {
    if (this.questionsData && Array.isArray(this.questionsData.questions)) {
      return this.questionsData.questions;
    }
    return [];
  },

  /**
   * Get Current Question Object for Active Index
   */
  getCurrentQuestion() {
    const questions = this.getActiveQuestions();
    return questions[this.currentQuestionIndex] || questions[0];
  },

  /**
   * Evaluate Answers via POST /api/interview/evaluate
   */
  async evaluateCurrentAnswer() {
    const answerInput = document.getElementById('user-answer-input');
    if (!answerInput) return;

    const answerText = answerInput.value.trim();
    if (answerText.length < 15) {
      alert("Please provide a more detailed response (at least 15 characters) to evaluate your interview readiness.");
      return;
    }

    const q = this.getCurrentQuestion();
    if (!q) return;

    // Record answer text in memory map
    this.completedAnswersMap[q.id] = answerText;

    // Prepare answers payload for backend evaluation
    const activeQuestions = this.getActiveQuestions();
    const answersPayload = [];

    activeQuestions.forEach(item => {
      const text = this.completedAnswersMap[item.id];
      if (text && text.trim().length >= 15) {
        answersPayload.push({
          questionId: item.id,
          responseText: text.trim()
        });
      }
    });

    if (answersPayload.length === 0) {
      alert("Please provide at least one answer with 15+ characters.");
      return;
    }

    const targetCareer = (this.readiness && this.readiness.targetCareer) || (this.profile && this.profile.careerGoal && this.profile.careerGoal.targetCareer) || 'Software Engineer';

    const reqPayload = {
      mode: this.activeMode,
      targetCareer: targetCareer,
      answers: answersPayload
    };

    try {
      const res = await fetch(`${API_BASE_URL}/interview/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reqPayload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || 'Error evaluating interview responses.');
        return;
      }

      this.lastEvaluation = data.data;

      // Update history and passport from backend
      await this.loadHistory();
      await this.loadPassport();

      // Render updated evaluation cards and history
      this.renderEvaluationResults(this.lastEvaluation);
      this.renderReadinessAudit();
      this.renderInterviewHistory();
    } catch (err) {
      console.error('Error submitting interview evaluation:', err);
      alert('Unable to connect to the CareerPilot server. Please try again.');
    }
  },

  /**
   * Render Evaluation Results Card from Backend Response
   */
  renderEvaluationResults(evalData) {
    if (!evalData) return;
    const evalCard = document.getElementById('evaluation-card');
    if (!evalCard) return;

    const overallNum = document.getElementById('eval-overall-number');
    const statusEl = document.getElementById('eval-overall-status');
    const techScoreEl = document.getElementById('eval-tech-score');
    const techBar = document.getElementById('eval-tech-bar');
    const commScoreEl = document.getElementById('eval-comm-score');
    const commBar = document.getElementById('eval-comm-bar');
    const probScoreEl = document.getElementById('eval-prob-score');
    const probBar = document.getElementById('eval-prob-bar');
    const projScoreEl = document.getElementById('eval-proj-score');
    const projBar = document.getElementById('eval-proj-bar');

    const feedbackEl = document.getElementById('eval-feedback-text');
    const strengthsContainer = document.getElementById('eval-strengths-list');
    const weaknessesContainer = document.getElementById('eval-weaknesses-list');
    const idealApproachEl = document.getElementById('eval-ideal-approach');

    const overallScore = evalData.overallScore || 0;
    if (overallNum) overallNum.textContent = "OVERALL: " + overallScore + " / 100";
    if (statusEl) {
      statusEl.textContent = overallScore >= 70 ? "STRONG RESPONSE" : "DEVELOPING";
      statusEl.className = overallScore >= 70 ? 'alignment-badge alignment-badge-high' : 'alignment-badge alignment-badge-medium';
    }

    if (techScoreEl) techScoreEl.textContent = (evalData.technicalScore || 0) + " / 100";
    if (techBar) techBar.style.width = (evalData.technicalScore || 0) + "%";

    if (commScoreEl) commScoreEl.textContent = (evalData.communicationScore || 0) + " / 100";
    if (commBar) commBar.style.width = (evalData.communicationScore || 0) + "%";

    if (probScoreEl) probScoreEl.textContent = (evalData.problemSolvingScore || 0) + " / 100";
    if (probBar) probBar.style.width = (evalData.problemSolvingScore || 0) + "%";

    if (projScoreEl) projScoreEl.textContent = (evalData.projectKnowledgeScore || 0) + " / 100";
    if (projBar) projBar.style.width = (evalData.projectKnowledgeScore || 0) + "%";

    if (feedbackEl) {
      if (overallScore >= 80) {
        feedbackEl.textContent = "Excellent response. Your answer demonstrates strong technical depth, domain accuracy, and structured reasoning addressing trade-offs and architecture.";
      } else if (overallScore >= 60) {
        feedbackEl.textContent = "Solid foundation. Your answer covers core principles well. To reach top interview readiness, elaborate further on architectural edge cases and performance trade-offs.";
      } else {
        feedbackEl.textContent = "Developing response. Focus on expanding technical detail, using domain terms, and explicitly analyzing trade-offs.";
      }
    }

    const currentQ = this.getCurrentQuestion();
    if (idealApproachEl && currentQ) {
      idealApproachEl.textContent = currentQ.sampleAnswer || "Structure answer systematically using technical depth and trade-off analysis.";
    }

    if (strengthsContainer) {
      strengthsContainer.innerHTML = '';
      const strengths = ["Verified backend score evaluation", "Technical terminology accuracy"];
      strengths.forEach(s => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag skill-tag-met';
        tag.textContent = '✓ ' + this.escapeHtml(s);
        strengthsContainer.appendChild(tag);
      });
    }

    if (weaknessesContainer) {
      weaknessesContainer.innerHTML = '';
      const weaknesses = ["Expand on architectural trade-offs", "Provide concrete benchmark metrics"];
      weaknesses.forEach(w => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        tag.style.color = '#f87171';
        tag.textContent = '▲ ' + this.escapeHtml(w);
        weaknessesContainer.appendChild(tag);
      });
    }

    evalCard.style.display = 'block';

    // Update overall header status
    const headerStatus = document.getElementById('iv-interview-status');
    if (headerStatus) {
      headerStatus.textContent = overallScore + "% OVERALL SCORE";
    }
  },

  /**
   * Render Mode Selection Buttons UI
   */
  renderModeUI() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      if (btn.dataset.mode === this.activeMode) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    const modeLabel = document.getElementById('q-mode-label');
    if (modeLabel) {
      modeLabel.textContent = `${this.activeMode} MODE`;
    }
  },

  /**
   * Render Question View & Dots Progress
   */
  renderQuestionView() {
    this.renderModeUI();
    const questions = this.getActiveQuestions();

    if (this.currentQuestionIndex >= questions.length) {
      this.currentQuestionIndex = Math.max(0, questions.length - 1);
    }

    const q = this.getCurrentQuestion();
    if (!q) return;

    // Progress counter
    const currNum = document.getElementById('q-curr-num');
    const totalNum = document.getElementById('q-total-num');
    if (currNum) currNum.textContent = this.currentQuestionIndex + 1;
    if (totalNum) totalNum.textContent = questions.length;

    // Dots navigation
    const dotsContainer = document.getElementById('question-nav-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      questions.forEach((item, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'q-dot-btn';
        if (idx === this.currentQuestionIndex) dot.classList.add('active');
        if (this.completedAnswersMap[item.id]) {
          dot.classList.add('answered');
        }
        dot.textContent = idx + 1;
        dot.addEventListener('click', () => {
          this.currentQuestionIndex = idx;
          this.renderQuestionView();
        });
        dotsContainer.appendChild(dot);
      });
    }

    // Question content
    const titleEl = document.getElementById('q-title');
    const scenarioEl = document.getElementById('q-scenario');
    const hintEl = document.getElementById('q-hint');
    const catBadge = document.getElementById('q-category-badge');
    const diffBadge = document.getElementById('q-difficulty-badge');

    if (titleEl) titleEl.textContent = q.title || '';
    if (scenarioEl) scenarioEl.textContent = q.scenario || '';
    if (hintEl) hintEl.textContent = q.hint || 'Structure your answer by stating the Situation, Technical Task, Action, and Result.';
    if (catBadge) catBadge.textContent = q.category || 'TECHNICAL SCENARIO';
    if (diffBadge) {
      diffBadge.textContent = q.difficulty || 'INTERMEDIATE';
      diffBadge.className = 'diff-badge diff-' + (q.difficulty || 'intermediate').toLowerCase();
    }

    // Answer textarea
    const answerInput = document.getElementById('user-answer-input');
    const charCount = document.getElementById('answer-char-count');

    if (answerInput) {
      answerInput.value = this.completedAnswersMap[q.id] || '';
      if (charCount) charCount.textContent = answerInput.value.length + " characters";
    }
  },

  /**
   * Render Interview History Section from Backend Array
   */
  renderInterviewHistory() {
    const list = document.getElementById('interview-history-list');
    if (!list) return;

    list.innerHTML = '';

    if (!Array.isArray(this.interviewHistory) || this.interviewHistory.length === 0) {
      list.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">
          No completed interview sessions recorded yet. Evaluate responses in Tab 1 to build session history.
        </div>
      `;
      return;
    }

    this.interviewHistory.forEach((session) => {
      const card = document.createElement('div');
      card.className = 'history-item-card';

      const dateStr = session.completedAt || session.createdAt ? new Date(session.completedAt || session.createdAt).toLocaleDateString() : 'Recent';
      card.innerHTML = `
        <div class="history-item-left">
          <div class="history-item-title">${this.escapeHtml(session.targetCareer)} (${this.escapeHtml(session.mode)} Mode — ${session.questionCount} Qs)</div>
          <div class="history-item-meta">Completed: ${dateStr} &bull; Tech: ${session.technicalScore}% | Prob: ${session.problemSolvingScore}% | Comm: ${session.communicationScore}% | Proj: ${session.projectKnowledgeScore}%</div>
        </div>
        <div class="history-item-score">${session.overallScore} / 100</div>
      `;
      list.appendChild(card);
    });
  },

  /**
   * Render 4-Tier Career Readiness Audit Checklist
   */
  renderReadinessAudit() {
    // 1. Profile Completeness
    const icon1 = document.getElementById('audit-icon-1');
    const desc1 = document.getElementById('audit-desc-1');
    if (icon1 && desc1) {
      icon1.textContent = '✓';
      icon1.className = 'audit-icon text-green';
      desc1.textContent = 'Profile complete: ' + (this.profile && this.profile.personal ? this.profile.personal.fullName : 'Verified');
    }

    // 2. Skill Gap Coverage
    const icon2 = document.getElementById('audit-icon-2');
    const desc2 = document.getElementById('audit-desc-2');
    if (icon2 && desc2) {
      const score = this.readiness ? (this.readiness.score || 0) : 0;
      icon2.textContent = score >= 50 ? '✓' : '⚙';
      icon2.className = score >= 50 ? 'audit-icon text-green' : 'audit-icon text-amber';
      desc2.textContent = 'Readiness Score: ' + score + '/100 (' + (this.readiness && this.readiness.metSkills ? this.readiness.metSkills.length : 0) + ' requirements satisfied)';
    }

    // 3. Project Proof
    const icon3 = document.getElementById('audit-icon-3');
    const desc3 = document.getElementById('audit-desc-3');
    if (icon3 && desc3) {
      const compProjects = this.passportData && this.passportData.projects ? (this.passportData.projects.completedProjects || 0) : 0;
      if (compProjects > 0) {
        icon3.textContent = '✓';
        icon3.className = 'audit-icon text-green';
      } else {
        icon3.textContent = '⚙';
        icon3.className = 'audit-icon text-amber';
      }
      desc3.textContent = compProjects + ' projects completed in tracker.';
    }

    // 4. Technical Interview Readiness
    const icon4 = document.getElementById('audit-icon-4');
    const desc4 = document.getElementById('audit-desc-4');
    if (icon4 && desc4) {
      const latestScore = this.passportData && this.passportData.latestInterview ? (this.passportData.latestInterview.overallScore || 0) : (this.lastEvaluation ? this.lastEvaluation.overallScore : 0);
      if (latestScore > 0) {
        icon4.textContent = latestScore >= 65 ? '✓' : '⚙';
        icon4.className = latestScore >= 65 ? 'audit-icon text-green' : 'audit-icon text-amber';
        desc4.textContent = 'Latest interview evaluation score: ' + latestScore + '/100.';
      } else {
        icon4.textContent = '○';
        icon4.className = 'audit-icon';
        desc4.textContent = 'Complete interview questions in Tab 1 to unlock score verification.';
      }
    }
  },

  /**
   * Generate ATS-Friendly Markdown Resume Draft
   */
  generateMarkdownResume() {
    const p = this.profile || {};
    const name = (p.personal && p.personal.fullName) ? p.personal.fullName : "Candidate Name";
    const email = (p.personal && p.personal.email) ? p.personal.email : "email@example.com";
    const target = (this.readiness && this.readiness.targetCareer) || (p.careerGoal ? p.careerGoal.targetCareer : "Software Engineer");
    const degree = (p.education && p.education.degree) ? p.education.degree : "Computer Science";
    const skills = p.skills || [];
    const evidence = this.careerToolsEvidence || [];

    let resume = `# ${name}\n`;
    resume += `**Target Role:** ${target} | **Email:** ${email}\n\n`;
    resume += `---\n\n`;
    resume += `## Professional Summary\n`;
    resume += `Goal-oriented ${target} with strong skills in ${skills.slice(0, 4).join(', ')}. Demonstrated readiness score of ${this.readiness ? this.readiness.score || 0 : 0}/100 and practical portfolio implementation.\n\n`;
    resume += `## Education\n`;
    resume += `- **${degree}**\n\n`;
    resume += `## Core Technical Skills\n`;
    resume += `- **Verified Skills:** ${skills.join(', ')}\n\n`;
    resume += `## Key Portfolio Projects\n`;

    if (evidence.length > 0) {
      evidence.forEach(proj => {
        resume += `### ${proj.projectTitle || proj.title || 'Portfolio Project'}\n`;
        if (proj.projectDescription) resume += `- **Description:** ${proj.projectDescription}\n`;
        if (proj.githubRepoUrl) resume += `- **GitHub:** ${proj.githubRepoUrl}\n`;
        if (proj.liveDemoUrl) resume += `- **Live Demo:** ${proj.liveDemoUrl}\n`;
        resume += `\n`;
      });
    } else {
      resume += `- *Portfolio project evidence entries will be listed here after saving in Tab 3.*\n\n`;
    }

    resume += `---\n*Disclaimer: This is a structured preparation draft generated from the information you provide. It does not guarantee ATS acceptance, interview selection, employment, or job placement.*\n`;

    return resume;
  },

  /**
   * Render ATS-Friendly Resume Preview Box
   */
  renderResumePreview() {
    const previewBox = document.getElementById('resume-preview-box');
    if (!previewBox) return;

    const p = this.profile || {};
    const name = (p.personal && p.personal.fullName) ? p.personal.fullName : "Candidate Name";
    const email = (p.personal && p.personal.email) ? p.personal.email : "email@example.com";
    const target = (this.readiness && this.readiness.targetCareer) || (p.careerGoal ? p.careerGoal.targetCareer : "Software Engineer");
    const degree = (p.education && p.education.degree) ? p.education.degree : "Computer Science";
    const skills = p.skills || [];
    const evidence = this.careerToolsEvidence || [];

    let projHtml = '';
    if (evidence.length > 0) {
      evidence.forEach(proj => {
        projHtml += `
          <div style="margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 600; color: var(--text-primary);">
              <span>${this.escapeHtml(proj.projectTitle || proj.title || 'Project')}</span>
              <span style="font-size: 0.75rem; color: var(--accent-red-bright);">${this.escapeHtml(proj.proofStatus || 'MANUAL_ENTRY')}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${this.escapeHtml(proj.projectDescription || '')}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              <strong>Links:</strong> ${proj.githubRepoUrl ? `<a href="${this.escapeHtml(proj.githubRepoUrl)}" target="_blank" style="color: var(--accent-red-bright);">GitHub</a>` : ''} ${proj.liveDemoUrl ? `&bull; <a href="${this.escapeHtml(proj.liveDemoUrl)}" target="_blank" style="color: var(--accent-red-bright);">Demo</a>` : ''}
            </div>
          </div>
        `;
      });
    } else {
      projHtml = `<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">No portfolio evidence added yet. Add project repository and demo URLs in Tab 3.</div>`;
    }

    previewBox.innerHTML = `
      <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem;">
        <h2 style="font-size: 1.5rem; margin: 0 0 0.25rem 0; color: var(--text-primary);">${this.escapeHtml(name)}</h2>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          <span>${this.escapeHtml(target)}</span> &bull; <span>${this.escapeHtml(email)}</span>
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-red-bright); text-transform: uppercase; margin-bottom: 0.3rem;">
          EDUCATION
        </div>
        <div style="font-size: 0.9rem; color: var(--text-primary); font-weight: 500;">${this.escapeHtml(degree)}</div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-red-bright); text-transform: uppercase; margin-bottom: 0.3rem;">
          TECHNICAL SKILLS
        </div>
        <div class="tags-container">
          ${skills.map(s => `<span class="skill-tag skill-tag-met">✓ ${this.escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      <div>
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-red-bright); text-transform: uppercase; margin-bottom: 0.5rem;">
          KEY PORTFOLIO PROJECTS
        </div>
        ${projHtml}
      </div>
    `;
  },

  /**
   * Render GitHub & Live Demo Evidence Tracker from Backend Evidence Data
   */
  renderEvidenceTracker() {
    const list = document.getElementById('evidence-projects-list');
    if (!list) return;

    const evidenceList = Array.isArray(this.careerToolsEvidence) && this.careerToolsEvidence.length > 0
      ? this.careerToolsEvidence
      : [
          { id: null, projectTitle: 'Core Web System', githubRepoUrl: '', liveDemoUrl: '', projectDescription: 'Main portfolio application' },
          { id: null, projectTitle: 'REST API Service', githubRepoUrl: '', liveDemoUrl: '', projectDescription: 'Backend microservice API' }
        ];

    list.innerHTML = '';

    evidenceList.forEach((item, idx) => {
      const itemCard = document.createElement('div');
      itemCard.className = 'onboarding-card evidence-item-card';
      itemCard.style.marginBottom = '1rem';

      itemCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <input type="text" class="form-input evidence-title-input" data-idx="${idx}" data-id="${item.id || ''}" value="${this.escapeHtml(item.projectTitle || item.project_title || '')}" placeholder="Project Title" style="font-size: 1rem; font-weight: 700; padding: 0.3rem 0.5rem; max-width: 350px;">
          <span class="diff-badge diff-intermediate">${this.escapeHtml(item.proofStatus || 'MANUAL_ENTRY')}</span>
        </div>
        <input type="text" class="form-input evidence-desc-input" data-idx="${idx}" value="${this.escapeHtml(item.projectDescription || item.project_description || '')}" placeholder="Project Description" style="font-size: 0.85rem; padding: 0.3rem 0.5rem; margin-bottom: 0.75rem;">
        
        <div class="form-grid-2" style="gap: 0.75rem;">
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">GitHub Repository URL:</label>
            <input type="url" class="form-input evidence-github-input" data-idx="${idx}" value="${this.escapeHtml(item.githubRepoUrl || item.github_repo_url || '')}" placeholder="https://github.com/username/repository" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; margin-top: 0.2rem;">
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Live Demo / Deployment URL:</label>
            <input type="url" class="form-input evidence-live-input" data-idx="${idx}" value="${this.escapeHtml(item.liveDemoUrl || item.live_demo_url || '')}" placeholder="https://project-demo.com" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; margin-top: 0.2rem;">
          </div>
        </div>
      `;

      list.appendChild(itemCard);
    });
  },

  /**
   * Save Evidence via POST /api/career-tools/evidence
   */
  async saveEvidenceFromInputs() {
    const titleInputs = document.querySelectorAll('.evidence-title-input');
    const descInputs = document.querySelectorAll('.evidence-desc-input');
    const ghInputs = document.querySelectorAll('.evidence-github-input');
    const liveInputs = document.querySelectorAll('.evidence-live-input');

    const payloadList = [];

    titleInputs.forEach((input, idx) => {
      const title = input.value.trim();
      if (!title) return;

      const itemId = input.dataset.id ? Number(input.dataset.id) : null;
      const desc = descInputs[idx] ? descInputs[idx].value.trim() : '';
      const gh = ghInputs[idx] ? ghInputs[idx].value.trim() : '';
      const live = liveInputs[idx] ? liveInputs[idx].value.trim() : '';

      payloadList.push({
        id: itemId,
        projectTitle: title,
        projectDescription: desc,
        githubRepoUrl: gh,
        liveDemoUrl: live,
        proofStatus: 'MANUAL_ENTRY'
      });
    });

    if (payloadList.length === 0) {
      alert('Please enter at least one project title to save evidence.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/career-tools/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payloadList)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Error saving portfolio evidence.');
        return;
      }

      await this.loadEvidence();
      await this.loadPassport();

      this.renderEvidenceTracker();
      this.renderResumePreview();

      const alertBox = document.getElementById('evidence-saved-alert');
      if (alertBox) {
        alertBox.style.display = 'block';
        setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
      }
    } catch (err) {
      console.error('Error saving portfolio evidence:', err);
      alert('Unable to connect to the CareerPilot server. Please try again.');
    }
  },

  /**
   * Populate Passport Summary Modal from Backend Passport Object
   */
  populatePassportModal() {
    const pData = this.passportData;
    if (!pData) return;

    const nameEl = document.getElementById('pass-candidate-name');
    const targetEl = document.getElementById('pass-target-career');
    const scoreEl = document.getElementById('pass-interview-score');
    const statusEl = document.getElementById('pass-interview-status');
    const skillsContainer = document.getElementById('pass-skills-list');
    const projContainer = document.getElementById('pass-projects-list');

    if (nameEl) nameEl.textContent = pData.user ? pData.user.fullName : 'Candidate';
    if (targetEl) targetEl.textContent = pData.profile ? pData.profile.targetCareer : 'Software Engineer';

    const latest = pData.latestInterview;
    if (latest && typeof latest.overallScore === 'number' && latest.overallScore > 0) {
      if (scoreEl) scoreEl.textContent = latest.overallScore + " / 100";
      if (statusEl) {
        statusEl.textContent = latest.overallScore >= 70 ? "READY ✓" : "DEVELOPING ⚙";
        statusEl.style.color = latest.overallScore >= 70 ? "#22c55e" : "#f59e0b";
      }
    } else {
      if (scoreEl) scoreEl.textContent = "Not completed";
      if (statusEl) {
        statusEl.textContent = "Pending Evaluation";
        statusEl.style.color = "var(--text-muted)";
      }
    }

    if (skillsContainer) {
      skillsContainer.innerHTML = '';
      const skills = (pData.profile && Array.isArray(pData.profile.skills)) ? pData.profile.skills : [];
      skills.forEach(s => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag skill-tag-met';
        tag.textContent = '✓ ' + this.escapeHtml(s);
        skillsContainer.appendChild(tag);
      });
    }

    if (projContainer) {
      projContainer.innerHTML = '';
      const evidence = Array.isArray(pData.portfolioEvidence) ? pData.portfolioEvidence : [];

      if (evidence.length === 0) {
        projContainer.innerHTML = `<div style="color: var(--text-muted); font-style: italic;">Proof Pending — Add portfolio evidence links in Tab 3</div>`;
      } else {
        evidence.forEach(item => {
          const row = document.createElement('div');
          row.style.padding = '0.35rem 0';
          row.style.borderBottom = '1px solid var(--border-color)';
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';

          const links = [];
          if (item.githubRepoUrl) links.push(`<a href="${this.escapeHtml(item.githubRepoUrl)}" target="_blank" style="color: var(--accent-red-bright); text-decoration: none;">GitHub</a>`);
          if (item.liveDemoUrl) links.push(`<a href="${this.escapeHtml(item.liveDemoUrl)}" target="_blank" style="color: var(--accent-red-bright); text-decoration: none;">Live Demo</a>`);

          row.innerHTML = `
            <span style="color: var(--text-primary); font-weight: 500;">${this.escapeHtml(item.projectTitle || 'Project')}</span>
            <span>${links.length > 0 ? links.join(' &bull; ') : '<span style="color: var(--text-muted);">Manual Proof</span>'}</span>
          `;
          projContainer.appendChild(row);
        });
      }
    }
  },

  /**
   * Render All Views
   */
  renderAll() {
    // Header info
    const targetEl = document.getElementById('iv-target-career');
    if (targetEl && this.readiness) targetEl.textContent = this.readiness.targetCareer || 'Software Engineer';

    const scoreEl = document.getElementById('iv-readiness-score');
    if (scoreEl && this.readiness) scoreEl.textContent = (this.readiness.score || 0) + " / 100";

    const headerStatus = document.getElementById('iv-interview-status');
    if (headerStatus && this.passportData && this.passportData.latestInterview) {
      headerStatus.textContent = (this.passportData.latestInterview.overallScore || 0) + "% OVERALL SCORE";
    }

    this.renderQuestionView();
    this.renderInterviewHistory();
    this.renderReadinessAudit();
    this.renderResumePreview();
    this.renderEvidenceTracker();
  },

  /**
   * Remove obsolete localStorage keys after successful backend verification
   */
  cleanupLegacyLocalStorage() {
    try {
      localStorage.removeItem('careerPilotInterview');
      localStorage.removeItem('careerPilotInterviewHistory');
      localStorage.removeItem('careerPilotCareerTools');
    } catch (e) {
      console.error('Error removing legacy localStorage keys:', e);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  InterviewApp.init();
});
