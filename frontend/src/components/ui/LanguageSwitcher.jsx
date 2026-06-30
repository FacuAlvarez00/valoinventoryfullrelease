import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, changeLanguage, getFlag, getLanguageName, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(35, 43, 58, 0.9)',
          border: '2px solid #ff4655',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 70, 85, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(35, 43, 58, 0.9)';
        }}
      >
        <span style={{ fontSize: '16px' }}>{getFlag(language)}</span>
        <span>{getLanguageName(language)}</span>
        <span style={{ fontSize: '12px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'rgba(35, 43, 58, 0.95)',
            border: '2px solid #ff4655',
            borderRadius: '8px',
            padding: '8px 0',
            minWidth: '120px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
          }}
        >
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              style={{
                width: '100%',
                background: language === lang ? 'rgba(255, 70, 85, 0.2)' : 'transparent',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: language === lang ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (language !== lang) {
                  e.target.style.background = 'rgba(255, 70, 85, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (language !== lang) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{getFlag(lang)}</span>
              <span>{getLanguageName(lang)}</span>
              {language === lang && (
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay para cerrar el dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

