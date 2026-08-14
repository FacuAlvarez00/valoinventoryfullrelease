import React from "react";

export default function SkinCard({ skin }) {
  if (!skin.displayIcon) return null; // Hide skins without an image

  return (
    <div style={{
      border: "1px solid #222",
      borderRadius: 8,
      padding: 10,
      margin: 8,
      width: 180,
      background: "#181c24"
    }}>
      <img
        src={skin.displayIcon}
        alt={skin.displayName}
        style={{ width: "100%", borderRadius: 4, background: "#222" }}
      />
      <div style={{ marginTop: 8, color: "#fff", fontWeight: "bold" }}>
        {skin.displayName}
      </div>
    </div>
  );
}
