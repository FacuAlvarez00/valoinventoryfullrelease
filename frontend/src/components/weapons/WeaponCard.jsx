import React from "react";
import "../../index.css";

export default function WeaponCard({ weapon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="valorant-card"
      style={{
        cursor: "pointer",
        padding: 18,
        margin: 14,
        width: 170,
        height: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s",
      }}
    >
      <img
        src={weapon.displayIcon}
        alt={weapon.displayName}
        style={{ width: 100, height: 60, objectFit: "contain", marginBottom: 8 }}
      />
      <div style={{ color: "#fff", fontWeight: "bold", textAlign: "center", fontSize: 15, textShadow: "0 2px 8px #000a" }}>{weapon.displayName}</div>
    </div>
  );
} 