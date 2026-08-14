import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { InventoryProvider, useInventory } from "./context/InventoryContext";
import { AuthPage } from "./components/auth";
import { HomePage, LandingPage, PageWrapper, LoadingScreen, AppHeader } from "./components/ui";
import appStyles from "./App.module.css";
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
import { InventoryDetails, InventoryNavbar } from './components/inventory';
import { SharedView } from './components/inventory';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

function groupWeaponsByCategory(weapons) {
  const categories = {};
  weapons.forEach((weapon) => {
    const category = weapon.category?.split("::").pop() || "Other";
    if (!categories[category]) categories[category] = [];
    categories[category].push(weapon);
  });
  return categories;
}

// Extract a weapon codename from its asset path
function getWeaponCodename(weapon) {
  console.log('🔧 [DEBUG] getWeaponCodename for:', weapon.displayName, 'assetPath:', weapon.assetPath);
  
  // Gun example: ShooterGame/Content/Equippables/Guns/Rifles/AK/AK_PrimaryAsset
  // Melee example: ShooterGame/Content/Equippables/Melee/Melee_PrimaryAsset
  const match = weapon.assetPath && weapon.assetPath.match(/Guns\/[^\/]+\/([^\/]+)/);
  if (match) {
    console.log('🔧 [DEBUG] Found gun codename:', match[1]);
    return match[1];
  }
  
  // If it is not a firearm, try the melee path
  const meleeMatch = weapon.assetPath && weapon.assetPath.match(/Melee\/([^\/]+)/);
  if (meleeMatch) {
    console.log("🔧 [DEBUG] CODENAME MELEE:", meleeMatch[1], weapon.displayName, weapon.assetPath);
    return meleeMatch[1];
  }
  
  console.log('🔧 [DEBUG] No codename found, using displayName:', weapon.displayName);
  return weapon.displayName;
}

// Fallback for catalog entries that cannot be resolved by item ID
function getSkinsForWeaponFallback(skins, weapon) {
  console.log('🔄 [DEBUG] Using fallback method for weapon:', weapon.displayName);
  
  const codename = getWeaponCodename(weapon).toLowerCase();
  let all = [];
  
  if (weapon.assetPath && weapon.assetPath.includes("/Melee/")) {
    // Melee weapons
    all = skins.filter(
      (skin) =>
        skin.assetPath &&
        /\/Melee\//i.test(skin.assetPath) &&
        skin.displayIcon
    );
  } else {
    // Firearms
    all = skins.filter((skin) => {
      if (!skin.assetPath || !skin.displayIcon) return false;
      
      // Match the codename in the asset path
      if (codename && skin.assetPath.toLowerCase().includes('/' + codename + '/')) {
        return true;
      }
      
      // Match the weapon name in the asset path
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
  
  // Log a small sample of the user's skins
  if (userSkins && userSkins.length > 0) {
    console.log('🔍 [DEBUG] Sample user skins:', userSkins.slice(0, 3).map(s => ({
      ItemID: s.ItemID,
      TypeID: s.TypeID
    })));
  }
  
  // Fall back when inventory or catalog data is unavailable
  if (!userSkins || userSkins.length === 0 || !catalog) {
    console.log('❌ [DEBUG] No user skins or catalog available, using fallback');
    return getSkinsForWeaponFallback(fallbackSkins, weapon);
  }
  
  // Use the same catalog matching strategy as InventorySkins
  const skinlevels = catalog.skinlevels || [];
  const catalogSkins = catalog.skins || [];
  
  // Group the user's skins by base name using the skin-level catalog
  const skinsByBaseName = {};
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
    if (!skinsByBaseName[baseName]) skinsByBaseName[baseName] = [];
    skinsByBaseName[baseName].push(skinLevelObj);
  });
  
  console.log('🔍 [DEBUG] Skins processing:', {
    totalUserSkins: userSkins.length,
    matchedSkins,
    unmatchedSkins,
    basesFound: Object.keys(skinsByBaseName).length,
    baseNames: Object.keys(skinsByBaseName).slice(0, 5)
  });
  
  // Find skins that belong to this weapon
  const weaponSkins = [];
  
  Object.entries(skinsByBaseName).forEach(([baseName, skinLevels]) => {
    // Find the base skin in the catalog
    let skinBaseObj = catalogSkins.find(s => s.displayName === baseName);
    if (!skinBaseObj) {
      skinBaseObj = catalogSkins.find(s => s.displayName.toLowerCase().includes(baseName.toLowerCase()));
    }
    
    if (skinBaseObj) {
      // Check whether the skin belongs to the selected weapon
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
        // Include every owned level for this skin
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
  const [equippedSkins, setEquippedSkins] = useState({}); // { weaponUuid: skinObject }
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('landing'); // 'landing' | 'auth'
  const [authInitialLogin, setAuthInitialLogin] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { riotAccount, catalog } = useInventory();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [weaponsRes, skinsRes] = await Promise.all([
        fetch("https://valorant-api.com/v1/weapons").then((r) => r.json()),
        fetch("https://valorant-api.com/v1/weapons/skins").then((r) => r.json()),
      ]);
      setWeapons(weaponsRes.data);
      setSkins(skinsRes.data);
      // Development sample for catalog diagnostics
      console.log("PRIMERA SKIN", skinsRes.data[0]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleEquipSkin = (skin, weapon) => {
    if (!skin) return;
    const codename = getWeaponCodename(weapon).toLowerCase();
    setEquippedSkins((prev) => ({ ...prev, [codename]: skin }));
    setSelectedWeapon(null); // Return to the gallery
  };

  if (authLoading) return <LoadingScreen fullscreen text="Signing in..." />;

  // Show the landing or authentication flow when signed out
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

  if (loading) return <LoadingScreen fullscreen text="Loading data..." />;

  // Show details for the selected weapon
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

  // Show the equipped skin in the gallery or use the default weapon image
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
    <div className={appStyles.shell}>
      <AppHeader />

      <HomePage
        weaponsByCategory={weaponsByCategory}
        onWeaponSelect={setSelectedWeapon}
      />

    </div>
  );
}

function AccountLayout() {
  return (
    <PageWrapper>
      <InventoryNavbar />
      <Outlet />
    </PageWrapper>
  );
}

function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route element={<AccountLayout />}>
              <Route path="details" element={<InventoryDetails />} />
              <Route path="loadout" element={<MySkins />} />
              <Route path="inventory" element={<InventoryDashboard />} />
              <Route path="inventory/skins" element={<InventorySkins />} />
              <Route path="inventory/battlepass" element={<InventoryBattlepass />} />
              <Route path="inventory/buddies" element={<InventoryBuddies />} />
              <Route path="inventory/cards" element={<InventoryCards />} />
              <Route path="inventory/sprays" element={<InventorySprays />} />
              <Route path="inventory/flex" element={<InventoryFlex />} />
              <Route path="inventory/titles" element={<InventoryTitles />} />
              <Route path="inventory/agents" element={<InventoryAgents />} />
            </Route>
            <Route path="/share/:token" element={<SharedView />} />
          </Routes>
        </Router>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default App; 
