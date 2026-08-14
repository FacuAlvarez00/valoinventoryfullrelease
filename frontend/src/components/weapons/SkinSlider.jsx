import React, { useRef, useState, useEffect } from "react";
import { useInventory } from "../../context/InventoryContext";
import styles from "./SkinSlider.module.css";

export default function SkinSlider({ skins, onSkinChange, initialIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [brokenPreview, setBrokenPreview] = useState(false);
  const [brokenThumbs, setBrokenThumbs] = useState({});
  const { catalog } = useInventory();
  const thumbnailsRef = useRef(null);

  const validSkins = skins?.filter(s => s && s.displayName) || [];
  const selectedSkin = validSkins[activeIndex];

  // Sync if initialIndex changes (new modal open)
  useEffect(() => {
    setActiveIndex(initialIndex);
    setBrokenPreview(false);
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
    setBrokenPreview(false);
    if (onSkinChange) onSkinChange(idx);
  };

  if (!validSkins.length) {
    return <div className={styles.empty}>No skins are available.</div>;
  }

  return (
    <div className={styles.wrap}>
      {/* Large preview */}
      <div className={styles.preview}>
        {selectedSkin && (
          <>
            <img
              key={selectedSkin.displayName}
              src={getBestImage(selectedSkin)}
              alt={selectedSkin.displayName}
              className={styles.previewImg}
              style={{ opacity: brokenPreview ? 0.3 : 1 }}
              onError={() => setBrokenPreview(true)}
            />
            <div className={styles.previewName}>{selectedSkin.displayName}</div>
          </>
        )}
      </div>

      {/* Thumbnail row */}
      <div ref={thumbnailsRef} className={styles.thumbs}>
        {validSkins.map((skin, idx) => {
          const isActive = idx === activeIndex;
          const isBroken = !!brokenThumbs[idx];
          return (
            <div
              key={skin.uuid || idx}
              data-idx={idx}
              onClick={() => selectSkin(idx)}
              className={`${styles.thumb} ${isActive ? styles.thumbActive : ''}`}
            >
              <img
                src={getBestImage(skin)}
                alt={skin.displayName}
                className={styles.thumbImg}
                style={{ opacity: isBroken ? 0.2 : (isActive ? 1 : 0.55) }}
                onError={() => setBrokenThumbs(prev => ({ ...prev, [idx]: true }))}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
