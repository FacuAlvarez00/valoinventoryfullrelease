import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, useReducedMotion } from 'framer-motion';
import { TacticalButton, TextField } from '../ui/kit';
import styles from './Auth.module.css';

export default function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const reduced = useReducedMotion();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const result = await register(formData.username, formData.email, formData.password);

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={styles.split}
      >
        <div className={styles.heroSide}>
          <div>
            <p className={styles.heroEyebrow}>New Operative</p>
            <h1 className={styles.heroHeading}>
              Join the roster.<br />
              <span className={styles.heroHeadingDark}>Track everything.</span>
            </h1>
            <p className={styles.heroCopy}>
              Create your account and start building a shareable inventory showcase in seconds.
            </p>
          </div>
          <div className={styles.wordmark}>ValoInventory</div>
        </div>

        <div className={styles.formSide}>
          <div className={styles.header}>
            <h2 className={styles.heading}>Register</h2>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <TextField
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
            />
            <TextField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            <TextField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />

            <TacticalButton type="submit" size="lg" fullWidth disabled={loading} className={styles.submit}>
              {loading ? 'Creating account...' : 'Register'}
            </TacticalButton>
          </form>

          <div className={styles.switchRow}>
            <span>Already have an account? </span>
            <button type="button" className={styles.switchBtn} onClick={onSwitchToLogin}>
              Login here
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
