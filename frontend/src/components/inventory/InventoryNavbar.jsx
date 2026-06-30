import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function InventoryNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const navs = [
    { label: 'Home', path: '/' },
    { label: 'Loadout', path: '/mis-skins' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Details', path: '/details' },
  ];
  return (
    <div style={{
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      background: '#181e27',
      boxShadow: '0 2px 12px #0007',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '18px 0',
      gap: 32
    }}>
      {navs.map(nav => (
        <button
          key={nav.path}
          onClick={() => navigate(nav.path)}
          style={{
            background: location.pathname.startsWith(nav.path) && nav.path !== '/' ? '#ff4655' : 'none',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            fontSize: 20,
            letterSpacing: 2,
            cursor: 'pointer',
            padding: '8px 24px',
            borderRadius: 8,
            transition: 'background 0.2s',
            ...(nav.path === '/' && location.pathname === '/' ? { background: '#ff4655' } : {})
          }}
        >
          {nav.label}
        </button>
      ))}
    </div>
  );
} 