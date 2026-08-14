import React, { useState } from "react";
import SkinSlider from "./SkinSlider";
import { TacticalButton, BackButton } from "../ui/kit";
import styles from "./WeaponDetail.module.css";

export default function WeaponDetail({ weapon, skins, onBack, onEquip, initialSkinIdx = 0 }) {
  const [selectedSkinIdx, setSelectedSkinIdx] = useState(initialSkinIdx);
  const selectedSkin = skins[selectedSkinIdx];

  if (!skins || skins.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.panel}>
          <div className={styles.emptyTitle}>{weapon.displayName}</div>
          <div className={styles.emptyText}>You do not have any skins for this weapon.</div>
          <BackButton onClick={onBack}>Back</BackButton>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <BackButton onClick={onBack}>Back</BackButton>
          <div className={styles.title}>{weapon.displayName}</div>
        </div>

        {/* Slider */}
        <SkinSlider
          skins={skins}
          onSkinChange={setSelectedSkinIdx}
          initialIndex={initialSkinIdx}
        />

        {/* Equip button */}
        <TacticalButton
          size="lg"
          fullWidth
          className={styles.equipBtn}
          onClick={() => onEquip && onEquip(selectedSkin)}
          disabled={!selectedSkin}
        >
          Equip skin
        </TacticalButton>
      </div>
    </div>
  );
}
