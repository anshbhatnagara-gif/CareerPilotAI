const pool = require('../config/db');
const config = require('../config/env');

// In-memory fallback profile store for local dev/testing when TIDB_HOST is unconfigured
const mockProfiles = new Map();

const ProfileService = {
  /**
   * Check if live database configuration is enabled
   */
  isDbConfigured() {
    return Boolean(config.TIDB_HOST && config.TIDB_HOST.trim() !== '');
  },

  /**
   * Calculate profile completion status based on required Phase 2 fields
   */
  calculateCompletion(profileData) {
    if (!profileData) return false;

    const personal = profileData.personal || {};
    const education = profileData.education || {};
    const skills = Array.isArray(profileData.skills) ? profileData.skills : [];
    const interests = Array.isArray(profileData.interests) ? profileData.interests : [];
    const careerGoal = profileData.careerGoal || {};

    const hasLocation = Boolean(personal.location && personal.location.trim());
    const hasCollege = Boolean(education.college && education.college.trim());
    const hasDegree = Boolean(education.degree && education.degree.trim());
    const hasBranch = Boolean(education.branch && education.branch.trim());
    const hasCurrentYear = Boolean(education.currentYear && education.currentYear.trim());
    const hasGraduationYear = education.graduationYear !== undefined && education.graduationYear !== null && String(education.graduationYear).trim() !== '';

    const hasSkills = skills.filter(s => typeof s === 'string' && s.trim()).length > 0;
    const hasInterests = interests.filter(i => typeof i === 'string' && i.trim()).length > 0;

    const hasTargetCareer = Boolean(careerGoal.targetCareer && careerGoal.targetCareer.trim());
    const hasExperienceLevel = Boolean(careerGoal.experienceLevel && ['Beginner', 'Intermediate', 'Advanced'].includes(careerGoal.experienceLevel.trim()));
    const hasGoal = Boolean(careerGoal.goal && careerGoal.goal.trim());

    return (
      hasLocation &&
      hasCollege &&
      hasDegree &&
      hasBranch &&
      hasCurrentYear &&
      hasGraduationYear &&
      hasSkills &&
      hasInterests &&
      hasTargetCareer &&
      hasExperienceLevel &&
      hasGoal
    );
  },

  /**
   * Fetch complete profile by user ID
   */
  async getProfile(userId) {
    if (!userId) throw new Error('User ID is required');

    if (this.isDbConfigured()) {
      // Query user credentials
      const [userRows] = await pool.query(
        'SELECT full_name, email FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      if (userRows.length === 0) return null;
      const user = userRows[0];

      // Query profiles table
      const [profRows] = await pool.query(
        'SELECT location, college, degree, branch, current_year, graduation_year, target_career, experience_level, career_goal, completed FROM profiles WHERE user_id = ? LIMIT 1',
        [userId]
      );
      const prof = profRows.length > 0 ? profRows[0] : null;

      // Query profile_skills table
      const [skillRows] = await pool.query(
        'SELECT skill_name FROM profile_skills WHERE user_id = ? ORDER BY id ASC',
        [userId]
      );
      const skills = skillRows.map(r => r.skill_name);

      // Query profile_interests table
      const [interestRows] = await pool.query(
        'SELECT interest_name FROM profile_interests WHERE user_id = ? ORDER BY id ASC',
        [userId]
      );
      const interests = interestRows.map(r => r.interest_name);

      const profileObj = {
        personal: {
          fullName: user.full_name || '',
          email: user.email || '',
          location: prof ? (prof.location || '') : ''
        },
        education: {
          college: prof ? (prof.college || '') : '',
          degree: prof ? (prof.degree || '') : '',
          branch: prof ? (prof.branch || '') : '',
          currentYear: prof ? (prof.current_year || '') : '',
          graduationYear: prof && prof.graduation_year ? String(prof.graduation_year) : ''
        },
        skills: skills,
        interests: interests,
        careerGoal: {
          targetCareer: prof ? (prof.target_career || '') : '',
          experienceLevel: prof ? (prof.experience_level || '') : '',
          goal: prof ? (prof.career_goal || '') : ''
        },
        completed: prof ? Boolean(prof.completed) : false
      };

      return profileObj;
    }

    // In-memory fallback
    const AuthService = require('./auth.service');
    const user = await AuthService.findUserById(userId);
    if (!user) return null;

    const saved = mockProfiles.get(Number(userId));
    if (!saved) {
      return {
        personal: { fullName: user.full_name, email: user.email, location: '' },
        education: { college: '', degree: '', branch: '', currentYear: '', graduationYear: '' },
        skills: [],
        interests: [],
        careerGoal: { targetCareer: '', experienceLevel: '', goal: '' },
        completed: false
      };
    }

    return {
      personal: { fullName: user.full_name, email: user.email, location: saved.location || '' },
      education: {
        college: saved.college || '',
        degree: saved.degree || '',
        branch: saved.branch || '',
        currentYear: saved.currentYear || '',
        graduationYear: saved.graduationYear ? String(saved.graduationYear) : ''
      },
      skills: saved.skills || [],
      interests: saved.interests || [],
      careerGoal: {
        targetCareer: saved.targetCareer || '',
        experienceLevel: saved.experienceLevel || '',
        goal: saved.goal || ''
      },
      completed: Boolean(saved.completed)
    };
  },

  /**
   * Update profile within a database transaction
   */
  async updateProfile(userId, inputData) {
    if (!userId) throw new Error('User ID is required');

    const personal = inputData.personal || {};
    const education = inputData.education || {};
    const rawSkills = Array.isArray(inputData.skills) ? inputData.skills : [];
    const rawInterests = Array.isArray(inputData.interests) ? inputData.interests : [];
    const careerGoal = inputData.careerGoal || {};

    // Deduplicate & normalize skills and interests
    const skills = [...new Set(rawSkills.filter(s => typeof s === 'string' && s.trim()).map(s => s.trim()))];
    const interests = [...new Set(rawInterests.filter(i => typeof i === 'string' && i.trim()).map(i => i.trim()))];

    const profileDataToEval = {
      personal,
      education,
      skills,
      interests,
      careerGoal
    };

    const isCompleted = this.calculateCompletion(profileDataToEval);
    const gradYearNum = education.graduationYear ? parseInt(education.graduationYear, 10) || null : null;

    if (this.isDbConfigured()) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1. Upsert profiles row
        await connection.query(
          `INSERT INTO profiles (
            user_id, location, college, degree, branch, current_year,
            graduation_year, target_career, experience_level, career_goal, completed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            location = VALUES(location),
            college = VALUES(college),
            degree = VALUES(degree),
            branch = VALUES(branch),
            current_year = VALUES(current_year),
            graduation_year = VALUES(graduation_year),
            target_career = VALUES(target_career),
            experience_level = VALUES(experience_level),
            career_goal = VALUES(career_goal),
            completed = VALUES(completed)`,
          [
            userId,
            personal.location ? personal.location.trim() : null,
            education.college ? education.college.trim() : null,
            education.degree ? education.degree.trim() : null,
            education.branch ? education.branch.trim() : null,
            education.currentYear ? education.currentYear.trim() : null,
            gradYearNum,
            careerGoal.targetCareer ? careerGoal.targetCareer.trim() : null,
            careerGoal.experienceLevel ? careerGoal.experienceLevel.trim() : null,
            careerGoal.goal ? careerGoal.goal.trim() : null,
            isCompleted
          ]
        );

        // 2. Delete and replace profile_skills
        await connection.query('DELETE FROM profile_skills WHERE user_id = ?', [userId]);
        for (const skill of skills) {
          await connection.query(
            'INSERT INTO profile_skills (user_id, skill_name) VALUES (?, ?)',
            [userId, skill]
          );
        }

        // 3. Delete and replace profile_interests
        await connection.query('DELETE FROM profile_interests WHERE user_id = ?', [userId]);
        for (const interest of interests) {
          await connection.query(
            'INSERT INTO profile_interests (user_id, interest_name) VALUES (?, ?)',
            [userId, interest]
          );
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      return await this.getProfile(userId);
    }

    // In-memory fallback
    mockProfiles.set(Number(userId), {
      location: personal.location ? personal.location.trim() : '',
      college: education.college ? education.college.trim() : '',
      degree: education.degree ? education.degree.trim() : '',
      branch: education.branch ? education.branch.trim() : '',
      currentYear: education.currentYear ? education.currentYear.trim() : '',
      graduationYear: gradYearNum,
      skills,
      interests,
      targetCareer: careerGoal.targetCareer ? careerGoal.targetCareer.trim() : '',
      experienceLevel: careerGoal.experienceLevel ? careerGoal.experienceLevel.trim() : '',
      goal: careerGoal.goal ? careerGoal.goal.trim() : '',
      completed: isCompleted
    });

    return await this.getProfile(userId);
  },

  /**
   * Delete test profile (used by automated test scripts)
   */
  async deleteTestProfile(userId) {
    if (!userId) return;
    if (this.isDbConfigured()) {
      await pool.query('DELETE FROM profiles WHERE user_id = ?', [userId]).catch(() => {});
    } else {
      mockProfiles.delete(Number(userId));
    }
  }
};

module.exports = ProfileService;
