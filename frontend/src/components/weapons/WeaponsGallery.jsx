import React, { useEffect, useState } from "react";
import WeaponGroup from "./WeaponGroup";

function groupSkinsByWeapon(skins) {
  const groups = {};
  skins.forEach((skin) => {
    // El nombre del arma es la primera palabra del displayName de la skin
    const weaponName = skin.displayName.split(" ")[1] === "Knife" ? "Melee" : skin.displayName.split(" ")[1];
    if (!groups[weaponName]) groups[weaponName] = [];
    groups[weaponName].push(skin);
  });
  return groups;
}

export default function WeaponsGallery() {
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://valorant-api.com/v1/weapons/skins")
      .then((res) => res.json())
      .then((data) => {
        setSkins(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: "#fff" }}>Cargando skins...</div>;

  const grouped = groupSkinsByWeapon(skins);

  return (
    <div>
      {Object.entries(grouped).map(([weaponName, skins]) => (
        <WeaponGroup key={weaponName} weaponName={weaponName} skins={skins} />
      ))}
    </div>
  );
} 