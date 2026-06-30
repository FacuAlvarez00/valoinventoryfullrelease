import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageFlagButton() {
  const { language, changeLanguage, getFlag, getLanguageName, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLanguage) => {
    changeLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}
    >
      {/* Dropdown de idiomas */}
      {isOpen && (
        <div
          style={{
            background: 'rgba(20, 25, 35, 0.95)',
            border: '2px solid #ff4655',
            borderRadius: '12px',
            padding: '8px 0',
            minWidth: '140px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(15px)',
            marginTop: '10px',
            animation: 'slideDown 0.3s ease-out',
            zIndex: 1001
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
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: language === lang ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                borderRadius: '0',
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
              <span style={{ fontSize: '18px' }}>{getFlag(lang)}</span>
              <span>{getLanguageName(lang)}</span>
              {language === lang && (
                <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#ff4655' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Botón principal redondo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff4655, #ff6b7a)',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(255, 70, 85, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 25px rgba(255, 70, 85, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 20px rgba(255, 70, 85, 0.4)';
        }}
      >
        <span style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: '1',
          letterSpacing: '0.5px'
        }}>
          {language.toUpperCase()}
        </span>
      </button>

      {/* Overlay para cerrar el dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
            background: 'transparent'
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
