import React from "react";
import SkinCard from "./SkinCard";

export default function WeaponGroup({ weaponName, skins }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ color: "#ff4655", borderBottom: "2px solid #ff4655" }}>{weaponName}</h2>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {skins.map((skin) => (
          <SkinCard key={skin.uuid} skin={skin} />
        ))}
      </div>
    </div>
  );
} 