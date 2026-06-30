import React, { useRef, useState, useEffect } from "react";
import { useInventory } from "../../context/InventoryContext";

export default function SkinSlider({ skins, onSkinChange, initialIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const { catalog } = useInventory();
  const thumbnailsRef = useRef(null);

  const validSkins = skins?.filter(s => s && s.displayName) || [];
  const selectedSkin = validSkins[activeIndex];

  // Sync if initialIndex changes (new modal open)
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  // Scroll the active thumbnail into view
  useEffect(() => {
    if (!thumbnailsRef.current) return;
    const container = thumbnailsRef.current;
    const active = container.querySelector(`[data-idx="${activeIndex}"]`);
    if (active) {
      active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }, [activeIndex]);

  const getBestImage = (skin) => {
    if (!skin) return '';
    const skinBaseObj = catalog?.skins?.find(s => s.displayName === skin.displayName);
    if (skinBaseObj) {
      if (skinBaseObj.chromas?.[0]?.fullRender) return skinBaseObj.chromas[0].fullRender;
      if (skinBaseObj.levels?.[0]?.displayIcon) return skinBaseObj.levels[0].displayIcon;
      if (skinBaseObj.displayIcon) return skinBaseObj.displayIcon;
    }
    return skin.displayIcon || '';
  };

  const selectSkin = (idx) => {
    setActiveIndex(idx);
    if (onSkinChange) onSkinChange(idx);
  };

  if (!validSkins.length) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>
        No hay skins disponibles
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Large preview */}
      <div style={{
        background: '#111',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 24px 20px',
        marginBottom: 12,
      }}>
        {selectedSkin && (
          <>
            <img
              key={selectedSkin.displayName}
              src={getBestImage(selectedSkin)}
              alt={selectedSkin.displayName}
              style={{
                width: '100%',
                maxWidth: 480,
                height: 160,
                objectFit: 'contain',
              }}
              onError={e => { e.target.style.opacity = 0.3; }}
            />
            <div style={{
              color: '#ff4655',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginTop: 18,
              textAlign: 'center',
            }}>
              {selectedSkin.displayName}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail row */}
      <div
        ref={thumbnailsRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          overflowX: 'auto',
          padding: '12px 8px',
          background: '#111',
          borderRadius: 8,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.15) transparent',
        }}
      >
        {validSkins.map((skin, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={skin.uuid || idx}
              data-idx={idx}
              onClick={() => selectSkin(idx)}
              style={{
                flex: '0 0 auto',
                width: 90,
                height: 58,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'rgba(255,70,85,0.12)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '2px solid #ff4655' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                overflow: 'hidden',
                padding: 4,
              }}
            >
              <img
                src={getBestImage(skin)}
                alt={skin.displayName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: isActive ? 1 : 0.55,
                  transition: 'opacity 0.15s ease',
                }}
                onError={e => { e.target.style.opacity = 0.2; }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
