import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, useReducedMotion } from 'framer-motion';
import { TacticalButton, TextField } from '../ui/kit';
import styles from './Auth.module.css';

export default function Login({ onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const reduced = useReducedMotion();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await login(formData.username, formData.password);

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.backdropGrid} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={styles.panel}
      >
        <div className={styles.header}>
          <div className={styles.eyebrow}>Access</div>
          <h1 className={styles.heading}>{t.login}</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <TextField
            label={t.username}
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username or email"
          />
          <TextField
            label={t.password}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />

          <TacticalButton type="submit" size="lg" fullWidth disabled={loading} className={styles.submit}>
            {loading ? t.loading : t.loginButton}
          </TacticalButton>
        </form>

        <div className={styles.switchRow}>
          <span>{t.dontHaveAccount} </span>
          <button type="button" className={styles.switchBtn} onClick={onSwitchToRegister}>
            {t.register}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
