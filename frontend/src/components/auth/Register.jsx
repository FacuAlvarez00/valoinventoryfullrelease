import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 40%, #1a2636 60%, #0f1923 100%)',
      padding: '20px'
    }}>
      <div className="valorant-card" style={{
        padding: '40px',
        borderRadius: '18px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 8px 40px #000b'
      }}>
        <h1 style={{
          color: '#ff4655',
          fontSize: '32px',
          textAlign: 'center',
          marginBottom: '32px',
          textShadow: '0 2px 12px #000a',
          letterSpacing: '3px',
          textTransform: 'uppercase'
        }}>
          Register
        </h1>

        {error && (
          <div style={{
            background: '#ff4655',
            color: '#fff',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Username
            </label>
            <input
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
                transition: 'border 0.2s'
              }}
              placeholder="Enter your username"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
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
                transition: 'border 0.2s'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Password
            </label>
            <input
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
                transition: 'border 0.2s'
              }}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
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
                transition: 'border 0.2s'
              }}
              placeholder="Confirm your password"
            />
          </div>

          <button
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
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#ccc' }}>Already have an account? </span>
          <button
            onClick={onSwitchToLogin}
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
            Login here
          </button>
        </div>
      </div>
    </div>
  );
} 