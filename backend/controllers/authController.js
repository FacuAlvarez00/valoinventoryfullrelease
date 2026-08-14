const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, COOKIE_OPTIONS } = require('../config/constants');

class AuthController {
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Required fields are missing'
        });
      }

      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'The username or email is already registered'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        email,
        password: hashedPassword
      });

      const token = jwt.sign(
        { id: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '10d' }
      );

      res.cookie('token', token, COOKIE_OPTIONS);
      res.json({
        success: true,
        user: { username: user.username, email: user.email },
        token
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Required fields are missing'
        });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect password'
        });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '10d' }
      );

      res.cookie('token', token, COOKIE_OPTIONS);
      res.json({
        success: true,
        user: { username: user.username, email: user.email },
        token
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Sign-in failed'
      });
    }
  }

  static async logout(req, res) {
    res.clearCookie('token');
    res.json({ success: true, message: 'Signed out successfully' });
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id).select('-password');
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to load the profile'
      });
    }
  }
}

module.exports = AuthController;
