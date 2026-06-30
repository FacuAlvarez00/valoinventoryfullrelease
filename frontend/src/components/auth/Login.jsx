import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import '../../index.css';

export default function Login({ onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 60% 40%, #1a2636 60%, #0f1923 100%)',
        padding: '20px'
      }}
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 20,
          duration: 0.6 
        }}
        className="valorant-card" 
        style={{
          padding: '40px',
          borderRadius: '18px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 40px #000b'
        }}
      >
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            color: '#ff4655',
            fontSize: '32px',
            textAlign: 'center',
            marginBottom: '32px',
            textShadow: '0 2px 12px #000a',
            letterSpacing: '3px',
            textTransform: 'uppercase'
          }}
        >
          {t.login}
        </motion.h1>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              background: '#ff4655',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            {error}
          </motion.div>
        )}

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          onSubmit={handleSubmit}
        >
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{ marginBottom: '20px' }}
          >
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
{t.username}
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #222b3a',
                background: '#181c24',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your username or email"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            style={{ marginBottom: '24px' }}
          >
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              {t.password}
            </label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #222b3a',
                background: '#181c24',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#444' : '#ff4655',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s, opacity 0.2s',
              marginBottom: '20px'
            }}
          >
{loading ? t.loading : t.loginButton}
          </motion.button>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <span style={{ color: '#ccc' }}>{t.dontHaveAccount} </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff4655',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              textDecoration: 'underline'
            }}
          >
            {t.register}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 