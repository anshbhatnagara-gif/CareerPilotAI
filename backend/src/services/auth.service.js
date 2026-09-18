const bcrypt = require('bcrypt');
const pool = require('../config/db');
const config = require('../config/env');

const BCRYPT_SALT_ROUNDS = 12;

// In-memory fallback user store for local development/testing when TIDB_HOST is unconfigured
const mockUsers = new Map();
let mockIdCounter = 1;

const AuthService = {
  /**
   * Convert raw database record to safe user object (strips sensitive fields)
   */
  toSafeUser(user) {
    if (!user) return null;
    return {
      id: Number(user.id),
      fullName: user.full_name || user.fullName || '',
      email: (user.email || '').toLowerCase(),
      status: user.status || 'ACTIVE'
    };
  },

  /**
   * Check if live database configuration is enabled
   */
  isDbConfigured() {
    return Boolean(config.TIDB_HOST && config.TIDB_HOST.trim() !== '');
  },

  /**
   * Find user by email using parameterized query or fallback memory store
   */
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    if (this.isDbConfigured()) {
      const [rows] = await pool.query(
        'SELECT id, full_name, email, password_hash, status, created_at, updated_at, last_login_at FROM users WHERE email = ? LIMIT 1',
        [cleanEmail]
      );
      return rows.length > 0 ? rows[0] : null;
    }

    return mockUsers.get(cleanEmail) || null;
  },

  /**
   * Find user by ID using parameterized query or fallback memory store
   */
  async findUserById(id) {
    if (!id) return null;
    const numericId = Number(id);

    if (this.isDbConfigured()) {
      const [rows] = await pool.query(
        'SELECT id, full_name, email, password_hash, status, created_at, updated_at, last_login_at FROM users WHERE id = ? LIMIT 1',
        [numericId]
      );
      return rows.length > 0 ? rows[0] : null;
    }

    for (const user of mockUsers.values()) {
      if (Number(user.id) === numericId) {
        return user;
      }
    }
    return null;
  },

  /**
   * Create a new user with hashed password (bcrypt 12 rounds)
   */
  async createUser({ fullName, email, password }) {
    const cleanName = fullName ? fullName.trim() : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    if (this.isDbConfigured()) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [result] = await connection.query(
          'INSERT INTO users (full_name, email, password_hash, status) VALUES (?, ?, ?, "ACTIVE")',
          [cleanName, cleanEmail, passwordHash]
        );

        const userId = result.insertId;

        // Create initial profile record for user
        await connection.query(
          'INSERT INTO profiles (user_id, completed) VALUES (?, FALSE)',
          [userId]
        );

        await connection.commit();

        return {
          id: userId,
          full_name: cleanName,
          email: cleanEmail,
          password_hash: passwordHash,
          status: 'ACTIVE'
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    // In-memory fallback
    const newUser = {
      id: mockIdCounter++,
      full_name: cleanName,
      email: cleanEmail,
      password_hash: passwordHash,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date()
    };
    mockUsers.set(cleanEmail, newUser);
    return newUser;
  },

  /**
   * Verify candidate password against hashed password
   */
  async verifyPassword(candidatePassword, passwordHash) {
    if (!candidatePassword || !passwordHash) return false;
    return await bcrypt.compare(candidatePassword, passwordHash);
  },

  /**
   * Update last login timestamp for user
   */
  async updateLastLogin(userId) {
    if (!userId) return;
    if (this.isDbConfigured()) {
      await pool.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      ).catch(() => {});
    } else {
      const user = await this.findUserById(userId);
      if (user) {
        user.last_login_at = new Date();
      }
    }
  },

  /**
   * Delete test user (used by automated test script)
   */
  async deleteTestUserByEmail(email) {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    if (this.isDbConfigured()) {
      await pool.query('DELETE FROM users WHERE email = ?', [cleanEmail]).catch(() => {});
    } else {
      mockUsers.delete(cleanEmail);
    }
  }
};

module.exports = AuthService;
