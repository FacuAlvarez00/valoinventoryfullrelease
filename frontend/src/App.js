import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { InventoryProvider, useInventory } from "./context/InventoryContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthPage } from "./components/auth";
import { HomePage, LandingPage, PageWrapper, LoadingScreen } from "./components/ui";
import { WeaponDetail } from "./components/weapons";
import { MySkins } from './components/inventory';
import { Inventory } from './components/inventory';
import { InventoryDashboard } from './components/inventory';
import { InventorySkins } from './components/inventory';
import { InventoryBattlepass } from './components/inventory';
import { InventoryBuddies } from './components/inventory';
import { InventoryCards } from './components/inventory';
import { InventorySprays } from './components/inventory';
import { InventoryTitles } from './components/inventory';
import { InventoryAgents } from './components/inventory';
import { InventoryFlex } from './components/inventory';
import { InventoryDetails } from './components/inventory';
import { SharedView } from './components/inventory';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function groupWeaponsByCategory(weapons) {
  const categories = {};
  weapons.forEach((weapon) => {
    const category = weapon.category?.split("::").pop() || "Other";
    if (!categories[category]) categories[category] = [];
    categories[category].push(weapon);
  });
  return categories;
}

// Extrae el codename de un arma desde su assetPath
function getWeaponCodename(weapon) {
  console.log('🔧 [DEBUG] getWeaponCodename for:', weapon.displayName, 'assetPath:', weapon.assetPath);
  
  // Ejemplo assetPath: ShooterGame/Content/Equippables/Guns/Rifles/AK/AK_PrimaryAsset
  // Para melee: ShooterGame/Content/Equippables/Melee/Melee_PrimaryAsset
  const match = weapon.assetPath && weapon.assetPath.match(/Guns\/[^\/]+\/([^\/]+)/);
  if (match) {
    console.log('🔧 [DEBUG] Found gun codename:', match[1]);
    return match[1];
  }
  
  // Si no es un arma de fuego, prueba con melee
  const meleeMatch = weapon.assetPath && weapon.assetPath.match(/Melee\/([^\/]+)/);
  if (meleeMatch) {
    console.log("🔧 [DEBUG] CODENAME MELEE:", meleeMatch[1], weapon.displayName, weapon.assetPath);
    return meleeMatch[1];
  }
  
  console.log('🔧 [DEBUG] No codename found, using displayName:', weapon.displayName);
  return weapon.displayName;
}

// Función de fallback que usa la lógica original
function getSkinsForWeaponFallback(skins, weapon) {
  console.log('🔄 [DEBUG] Using fallback method for weapon:', weapon.displayName);
  
  const codename = getWeaponCodename(weapon).toLowerCase();
  let all = [];
  
  if (weapon.assetPath && weapon.assetPath.includes("/Melee/")) {
    // Para cuchillos
    all = skins.filter(
      (skin) =>
        skin.assetPath &&
        /\/Melee\//i.test(skin.assetPath) &&
        skin.displayIcon
    );
  } else {
    // Para armas regulares
    all = skins.filter((skin) => {
      if (!skin.assetPath || !skin.displayIcon) return false;
      
      // Buscar por codename en assetPath
      if (codename && skin.assetPath.toLowerCase().includes('/' + codename + '/')) {
        return true;
      }
      
      // Buscar por nombre del arma
      const weaponNameInPath = weapon.displayName.toLowerCase().replace(/\s+/g, '');
      if (skin.assetPath.toLowerCase().includes(weaponNameInPath)) {
        return true;
      }
      
      return false;
    });
  }
  
  const [defaultSkin, ...rest] = all;
  const filtered = rest.filter(
    (skin) => !/standard|default/i.test(skin.displayName)
  );
  const result = defaultSkin ? [defaultSkin, ...filtered] : filtered;
  
  console.log('🔄 [DEBUG] Fallback result:', {
    weaponName: weapon.displayName,
    totalFound: result.length,
    skinNames: result.map(s => s.displayName)
  });
  
  return result;
}

function getSkinsForWeapon(userSkins, weapon, catalog, fallbackSkins = []) {
  console.log('🔍 [DEBUG] getSkinsForWeapon called with:', {
    weaponName: weapon.displayName,
    weaponUuid: weapon.uuid,
    userSkinsCount: userSkins?.length || 0,
    catalogAvailable: !!catalog,
    skinlevelsCount: catalog?.skinlevels?.length || 0,
    skinsCount: catalog?.skins?.length || 0,
    fallbackSkinsCount: fallbackSkins?.length || 0
  });
  
  // Log de las primeras skins del usuario
  if (userSkins && userSkins.length > 0) {
    console.log('🔍 [DEBUG] Sample user skins:', userSkins.slice(0, 3).map(s => ({
      ItemID: s.ItemID,
      TypeID: s.TypeID
    })));
  }
  
  // Si no hay datos del inventario, usar fallback con la lógica original
  if (!userSkins || userSkins.length === 0 || !catalog) {
    console.log('❌ [DEBUG] No user skins or catalog available, using fallback');
    return getSkinsForWeaponFallback(fallbackSkins, weapon);
  }
  
  // Usar la misma lógica que InventorySkins.jsx
  const skinlevels = catalog.skinlevels || [];
  const catalogSkins = catalog.skins || [];
  
  // Agrupar userSkins por nombre base usando el catálogo de skinlevels
  const skinsPorBase = {};
  let matchedSkins = 0;
  let unmatchedSkins = 0;
  
  userSkins.forEach(skin => {
    const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
    if (!skinLevelObj) {
      unmatchedSkins++;
      return;
    }
    matchedSkins++;
    const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
    if (!skinsPorBase[baseName]) skinsPorBase[baseName] = [];
    skinsPorBase[baseName].push(skinLevelObj);
  });
  
  console.log('🔍 [DEBUG] Skins processing:', {
    totalUserSkins: userSkins.length,
    matchedSkins,
    unmatchedSkins,
    basesFound: Object.keys(skinsPorBase).length,
    baseNames: Object.keys(skinsPorBase).slice(0, 5)
  });
  
  // Buscar skins que pertenecen a esta arma
  const weaponSkins = [];
  
  Object.entries(skinsPorBase).forEach(([baseName, skinLevels]) => {
    // Buscar el objeto base de la skin en el catálogo
    let skinBaseObj = catalogSkins.find(s => s.displayName === baseName);
    if (!skinBaseObj) {
      skinBaseObj = catalogSkins.find(s => s.displayName.toLowerCase().includes(baseName.toLowerCase()));
    }
    
    if (skinBaseObj) {
      // Verificar si esta skin pertenece al arma seleccionada
      const uuidMatch = skinBaseObj.weaponUuid === weapon.uuid;
      const nameMatch1 = skinBaseObj.displayName.toLowerCase().includes(weapon.displayName.toLowerCase());
      const nameMatch2 = weapon.displayName.toLowerCase().includes(skinBaseObj.displayName.toLowerCase());
      const belongsToWeapon = uuidMatch || nameMatch1 || nameMatch2;
      
      console.log('🔍 [DEBUG] Checking skin:', {
        baseName,
        skinBaseObj: {
          displayName: skinBaseObj.displayName,
          weaponUuid: skinBaseObj.weaponUuid
        },
        weapon: {
          displayName: weapon.displayName,
          uuid: weapon.uuid
        },
        matches: {
          uuidMatch,
          nameMatch1,
          nameMatch2,
          belongsToWeapon
        }
      });
      
      if (belongsToWeapon) {
        // Agregar todos los niveles de esta skin
        skinLevels.forEach(level => {
          if (level.displayIcon) {
            weaponSkins.push(level);
          }
        });
        console.log('✅ [DEBUG] Added skin levels:', skinLevels.length, 'for', baseName);
      }
    } else {
      console.log('❌ [DEBUG] No skinBaseObj found for:', baseName);
    }
  });
  
  console.log('✅ [DEBUG] Found skins for weapon:', {
    weaponName: weapon.displayName,
    totalSkins: weaponSkins.length,
    skinNames: weaponSkins.map(s => s.displayName)
  });
  
  return weaponSkins;
}

function AppContent() {
  const [weapons, setWeapons] = useState([]);
  const [skins, setSkins] = useState([]);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [equippedSkins, setEquippedSkins] = useState({}); // { weaponUuid: skinObj }
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('landing'); // 'landing' | 'auth'
  const [authInitialLogin, setAuthInitialLogin] = useState(true);
  const { user, loading: authLoading, logout } = useAuth();
  const { riotAccount, catalog } = useInventory();
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [weaponsRes, skinsRes] = await Promise.all([
        fetch("https://valorant-api.com/v1/weapons").then((r) => r.json()),
        fetch("https://valorant-api.com/v1/weapons/skins").then((r) => r.json()),
      ]);
      setWeapons(weaponsRes.data);
      setSkins(skinsRes.data);
      // LOG para depuración
      console.log("PRIMERA SKIN", skinsRes.data[0]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleEquipSkin = (skin, weapon) => {
    if (!skin) return;
    const codename = getWeaponCodename(weapon).toLowerCase();
    setEquippedSkins((prev) => ({ ...prev, [codename]: skin }));
    setSelectedWeapon(null); // volver a la galería
  };

  if (authLoading) return <LoadingScreen fullscreen text="Iniciando sesión..." />;

  // Si no está autenticado, mostrar landing o login/register
  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onLogin={() => { setAuthInitialLogin(true); setAuthView('auth'); }}
          onRegister={() => { setAuthInitialLogin(false); setAuthView('auth'); }}
        />
      );
    }
    return (
      <AuthPage
        initialIsLogin={authInitialLogin}
        onBack={() => setAuthView('landing')}
      />
    );
  }

  if (loading) return <LoadingScreen fullscreen text="Cargando datos..." />;

  // Si hay un arma seleccionada, mostrar su detalle
  if (selectedWeapon) {
    console.log('🎯 [DEBUG] WeaponDetail render:', {
      selectedWeapon: selectedWeapon.displayName,
      riotAccountAvailable: !!riotAccount,
      riotAccountSkins: riotAccount?.skins?.length || 0,
      catalogAvailable: !!catalog,
      catalogSkins: catalog?.skins?.length || 0,
      catalogSkinlevels: catalog?.skinlevels?.length || 0
    });
    
    const weaponSkins = getSkinsForWeapon(riotAccount?.skins || [], selectedWeapon, catalog, skins);
    
    console.log('🎯 [DEBUG] WeaponDetail final result:', {
      weaponName: selectedWeapon.displayName,
      skinsFound: weaponSkins.length,
      skins: weaponSkins.map(s => s.displayName)
    });
    
    return (
      <WeaponDetail
        weapon={selectedWeapon}
        skins={weaponSkins}
        onBack={() => setSelectedWeapon(null)}
        onEquip={(skin) => handleEquipSkin(skin, selectedWeapon)}
      />
    );
  }

  // Mostrar la skin equipada en la galería, si existe, si no la default
  const weaponsByCategory = groupWeaponsByCategory(
    weapons.map((weapon) => {
      const codename = getWeaponCodename(weapon).toLowerCase();
      const equippedSkin = equippedSkins[codename];
      return equippedSkin
        ? { ...weapon, displayIcon: equippedSkin.displayIcon }
        : weapon;
    })
  );

  return (
    <div style={{ background: "#0f1923", minHeight: "100vh" }}>
      {/* Header con información del usuario y botón de logout */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 60px',
        borderBottom: '2px solid #222b3a'
      }}>
        <h1 style={{ color: "#ff4655", margin: 0 }}>{t.valorantCollection}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#fff' }}>{t.welcome}, {user.username}!</span>
          <button
            onClick={logout}
            style={{
              background: '#222b3a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {t.logout}
          </button>
        </div>
      </div>
      
      <HomePage
        weaponsByCategory={weaponsByCategory}
        onWeaponSelect={setSelectedWeapon}
      />
      
      {/* Botón de bandera flotante */}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <InventoryProvider>
          <Router>
            <Routes>
              <Route path="/" element={<AppContent />} />
            <Route path="/mis-skins" element={<PageWrapper><MySkins /></PageWrapper>} />
            {/* NUEVA ESTRUCTURA DE INVENTORY */}
            <Route path="/inventory" element={<PageWrapper><InventoryDashboard /></PageWrapper>} />
            <Route path="/inventory/skins" element={<PageWrapper><InventorySkins /></PageWrapper>} />
            <Route path="/inventory/battlepass" element={<PageWrapper><InventoryBattlepass /></PageWrapper>} />
            <Route path="/inventory/buddies" element={<PageWrapper><InventoryBuddies /></PageWrapper>} />
            <Route path="/inventory/cards" element={<PageWrapper><InventoryCards /></PageWrapper>} />
            <Route path="/inventory/sprays" element={<PageWrapper><InventorySprays /></PageWrapper>} />
            <Route path="/inventory/flex" element={<PageWrapper><InventoryFlex /></PageWrapper>} />
            <Route path="/inventory/titles" element={<PageWrapper><InventoryTitles /></PageWrapper>} />
            <Route path="/inventory/agents" element={<PageWrapper><InventoryAgents /></PageWrapper>} />
            <Route path="/details" element={<PageWrapper><InventoryDetails /></PageWrapper>} />
            <Route path="/share/:token" element={<SharedView />} />
            </Routes>
          </Router>
        </InventoryProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App; 