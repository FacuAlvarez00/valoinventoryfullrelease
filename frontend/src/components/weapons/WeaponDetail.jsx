import React, { useState } from "react";
import SkinSlider from "./SkinSlider";
import { useLanguage } from "../../context/LanguageContext";

export default function WeaponDetail({ weapon, skins, onBack, onEquip, initialSkinIdx = 0 }) {
  const [selectedSkinIdx, setSelectedSkinIdx] = useState(initialSkinIdx);
  const selectedSkin = skins[selectedSkinIdx];
  const { t } = useLanguage();

  if (!skins || skins.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={innerStyle}>
          <div style={{ color: '#ff4655', fontWeight: 700, fontSize: 26, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>
            {weapon.displayName}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
            No tenés skins para esta arma.
          </div>
          <button onClick={onBack} style={backBtnStyle}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, width: '100%' }}>
          <button onClick={onBack} style={backBtnStyle}>
            ← Volver
          </button>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 3, textTransform: 'uppercase' }}>
            {weapon.displayName}
          </div>
        </div>

        {/* Slider */}
        <SkinSlider
          skins={skins}
          onSkinChange={setSelectedSkinIdx}
          initialIndex={initialSkinIdx}
        />

        {/* Equip button */}
        <button
          onClick={() => onEquip && onEquip(selectedSkin)}
          disabled={!selectedSkin}
          style={{
            marginTop: 20,
            width: '100%',
            background: selectedSkin ? '#ff4655' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '14px 0',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: selectedSkin ? 'pointer' : 'not-allowed',
            opacity: selectedSkin ? 1 : 0.5,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { if (selectedSkin) e.currentTarget.style.background = '#e03040'; }}
          onMouseLeave={e => { if (selectedSkin) e.currentTarget.style.background = '#ff4655'; }}
        >
          {t.equipSkin || 'Equipar Skin'}
        </button>
      </div>
    </div>
  );
}

const containerStyle = {
  width: '100%',
  maxWidth: 580,
  margin: '0 auto',
};

const innerStyle = {
  background: '#0d0d0d',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '20px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
};

const backBtnStyle = {
  background: 'rgba(255,255,255,0.07)',
  color: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  padding: '7px 16px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};
