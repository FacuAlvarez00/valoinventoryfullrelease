import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Traducciones
const translations = {
  es: {
    // Navegación
    home: 'Inicio',
    loadout: 'Loadout',
    inventory: 'Inventario',
    
    // Autenticación
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',
    username: 'Usuario',
    password: 'Contraseña',
    email: 'Correo Electrónico',
    confirmPassword: 'Confirmar Contraseña',
    loginButton: 'Iniciar Sesión',
    registerButton: 'Registrarse',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    dontHaveAccount: '¿No tienes cuenta?',
    
    // Loadout
    currentLoadout: 'LOADOUT ACTUAL',
    allMySkins: 'TODAS MIS SKINS',
    equipSkin: 'EQUIPAR SKIN',
    back: 'Volver',
    close: 'Cerrar',
    
    // Categorías de armas
    sidearms: 'PISTOLAS',
    smgs: 'SUBMETRALLETAS',
    rifles: 'RIFLES',
    shotguns: 'ESCOPETAS',
    sniperRifles: 'RIFLES DE FRANCOTIRADOR',
    machineGuns: 'AMETRALLADORAS',
    melee: 'MELEE',
    
    // Nombres de armas
    classic: 'CLASSIC',
    shorty: 'SHORTY',
    frenzy: 'FRENZY',
    ghost: 'GHOST',
    sheriff: 'SHERIFF',
    stinger: 'STINGER',
    spectre: 'SPECTRE',
    bulldog: 'BULLDOG',
    guardian: 'GUARDIAN',
    phantom: 'PHANTOM',
    vandal: 'VANDAL',
    bucky: 'BUCKY',
    judge: 'JUDGE',
    marshal: 'MARSHAL',
    outlaw: 'OUTLAW',
    operator: 'OPERATOR',
    ares: 'ARES',
    odin: 'ODIN',
    melee: 'MELEE',
    
    // Mensajes
    loading: 'Cargando...',
    loadingAccount: 'Cargando datos de la cuenta Riot...',
    loadingSkins: 'Cargando skins...',
    loadingCatalog: 'Cargando catálogo de skins...',
    noSkinsFound: 'No se encontraron skins para esta arma',
    noSkinsAvailable: 'No se encontraron skins disponibles para esta arma',
    noSkinsAvailableDesc: 'Esto puede deberse a que no tienes skins para esta arma o hay un problema con la carga de datos.',
    skinEquipped: 'Skin equipada!',
    errorLoadingData: 'Error cargando datos',
    networkError: 'Error de red',
    invalidToken: 'Token inválido',
    
    // Inventario
    allSkins: 'TODAS MIS SKINS',
    backToDashboard: 'Volver al Dashboard',
    totalSkins: 'Total de skins',
    vpSpent: 'VP gastados',
    searchSkinPlaceholder: 'Buscar skin por nombre...',
    allTypes: 'Todos los tipos',
    
    // Estados de cuenta
    toxic: 'Tóxico',
    radiant: 'Radiante',
    immortal: 'Inmortal',
    diamond: 'Diamante',
    platinum: 'Platino',
    gold: 'Oro',
    silver: 'Plata',
    bronze: 'Bronce',
    iron: 'Hierro',
    
    // Botones
    addAccount: 'Agregar Cuenta',
    addRiotAccount: 'Agregar Cuenta de Riot',
    accountNamePlaceholder: 'Nombre identificador (ej: acc 1)',
    riotTokenPlaceholder: 'Pega tu token de Riot aquí o la URL completa',
    loginToRiotGames: 'Iniciar sesión en Riot Games',
    riotInstructions: 'Haz clic en el enlace, inicia sesión y copia la URL que aparece en la barra de direcciones',
    updateAccount: 'Actualizar Cuenta',
    deleteAccount: 'Eliminar Cuenta',
    refresh: 'Actualizar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    
    // Errores
    errorOccurred: 'Ocurrió un error',
    tryAgain: 'Intentar de nuevo',
    contactSupport: 'Contactar soporte',
    completeAllFields: 'Completa todos los campos.',
    accountAddedSuccessfully: 'Cuenta agregada correctamente.',
    errorAddingAccount: 'Error al agregar la cuenta.',
    networkErrorAddingAccount: 'Error de red al agregar la cuenta.',
    
    // Modales
    riotAccounts: 'Cuentas Riot',
    noAccounts: 'No tienes cuentas Riot agregadas.',
    lastUpdated: 'Última Actualización',
    accountName: 'Nombre de Cuenta',
    nickname: 'Apodo',
    name: 'Nombre',
    updateRiotAccount: 'Actualizar Cuenta Riot',
    deleteRiotAccount: 'Eliminar Cuenta Riot',
    confirmDelete: '¿Seguro que quieres borrar esta cuenta?',
    newTokenPlaceholder: 'Pega tu nuevo token de Riot aquí o la URL completa',
    getRiotToken: 'Obtener Token de Riot',
    tokenInstructions: 'Haz clic en el enlace, inicia sesión y copia el token que aparece en la URL',
    
    // HomePage específico
    welcome: 'Bienvenido',
    valorantCollection: 'Colección Valorant',
    updateAccount: 'Actualizar Cuenta',
    deleteAccount: 'Eliminar Cuenta',
    addAccount: 'Agregar Cuenta'
  },
  en: {
    // Navigation
    home: 'Home',
    loadout: 'Loadout',
    inventory: 'Inventory',
    
    // Authentication
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    confirmPassword: 'Confirm Password',
    loginButton: 'Login',
    registerButton: 'Register',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    
    // Loadout
    currentLoadout: 'CURRENT LOADOUT',
    allMySkins: 'ALL MY SKINS',
    equipSkin: 'EQUIP SKIN',
    back: 'Back',
    close: 'Close',
    
    // Weapon categories
    sidearms: 'SIDEARMS',
    smgs: 'SMGS',
    rifles: 'RIFLES',
    shotguns: 'SHOTGUNS',
    sniperRifles: 'SNIPER RIFLES',
    machineGuns: 'MACHINE GUNS',
    melee: 'MELEE',
    
    // Weapon names
    classic: 'CLASSIC',
    shorty: 'SHORTY',
    frenzy: 'FRENZY',
    ghost: 'GHOST',
    sheriff: 'SHERIFF',
    stinger: 'STINGER',
    spectre: 'SPECTRE',
    bulldog: 'BULLDOG',
    guardian: 'GUARDIAN',
    phantom: 'PHANTOM',
    vandal: 'VANDAL',
    bucky: 'BUCKY',
    judge: 'JUDGE',
    marshal: 'MARSHAL',
    outlaw: 'OUTLAW',
    operator: 'OPERATOR',
    ares: 'ARES',
    odin: 'ODIN',
    melee: 'MELEE',
    
    // Messages
    loading: 'Loading...',
    loadingAccount: 'Loading Riot account data...',
    loadingSkins: 'Loading skins...',
    loadingCatalog: 'Loading skins catalog...',
    noSkinsFound: 'No skins found for this weapon',
    noSkinsAvailable: 'No skins available for this weapon',
    noSkinsAvailableDesc: 'This may be because you don\'t have skins for this weapon or there\'s a data loading issue.',
    skinEquipped: 'Skin equipped!',
    errorLoadingData: 'Error loading data',
    networkError: 'Network error',
    invalidToken: 'Invalid token',
    
    // Inventory
    allSkins: 'ALL MY SKINS',
    backToDashboard: 'Back to Dashboard',
    totalSkins: 'Total skins',
    vpSpent: 'VP spent',
    searchSkinPlaceholder: 'Search skin by name...',
    allTypes: 'All types',
    
    // Account states
    toxic: 'Toxic',
    radiant: 'Radiant',
    immortal: 'Immortal',
    diamond: 'Diamond',
    platinum: 'Platinum',
    gold: 'Gold',
    silver: 'Silver',
    bronze: 'Bronze',
    iron: 'Iron',
    
    // Buttons
    addAccount: 'Add Account',
    addRiotAccount: 'Add Riot Account',
    accountNamePlaceholder: 'Account identifier (e.g: acc 1)',
    riotTokenPlaceholder: 'Paste your Riot token here or the complete URL',
    loginToRiotGames: 'Log in to Riot Games',
    riotInstructions: 'Click the link, log in and copy the URL that appears in the address bar',
    updateAccount: 'Update Account',
    deleteAccount: 'Delete Account',
    refresh: 'Refresh',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    
    // Errors
    errorOccurred: 'An error occurred',
    tryAgain: 'Try again',
    contactSupport: 'Contact support',
    completeAllFields: 'Complete all fields.',
    accountAddedSuccessfully: 'Account added successfully.',
    errorAddingAccount: 'Error adding account.',
    networkErrorAddingAccount: 'Network error adding account.',
    
    // Modals
    riotAccounts: 'Riot Accounts',
    noAccounts: 'You have no Riot accounts added.',
    lastUpdated: 'Last Updated',
    accountName: 'Account Name',
    nickname: 'Nickname',
    name: 'Name',
    updateRiotAccount: 'Update Riot Account',
    deleteRiotAccount: 'Delete Riot Account',
    confirmDelete: 'Are you sure you want to delete this account?',
    newTokenPlaceholder: 'Paste your new Riot token here or the complete URL',
    getRiotToken: 'Get Riot Token',
    tokenInstructions: 'Click the link, log in and copy the token that appears in the URL',
    
    // HomePage specific
    welcome: 'Welcome',
    valorantCollection: 'Valorant Collection',
    updateAccount: 'Update Account',
    deleteAccount: 'Delete Account',
    addAccount: 'Add Account'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Obtener idioma guardado o detectar idioma del navegador
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
      return savedLanguage;
    }
    
    // Detectar idioma del navegador
    const browserLanguage = navigator.language.split('-')[0];
    return translations[browserLanguage] ? browserLanguage : 'es';
  });

  const [t, setT] = useState(translations[language]);

  // Actualizar traducciones cuando cambie el idioma
  useEffect(() => {
    setT(translations[language]);
    localStorage.setItem('language', language);
  }, [language]);

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const getFlag = (lang) => {
    const flags = {
      'es': '🇪🇸',
      'en': '🇺🇸',
      // Futuros idiomas pueden agregarse aquí:
      // 'fr': '🇫🇷',
      // 'de': '🇩🇪',
      // 'pt': '🇵🇹',
      // 'it': '🇮🇹',
    };
    return flags[lang] || '🌐';
  };

  const getLanguageName = (lang) => {
    const names = {
      'es': 'Español',
      'en': 'English',
      // Futuros idiomas pueden agregarse aquí:
      // 'fr': 'Français',
      // 'de': 'Deutsch',
      // 'pt': 'Português',
      // 'it': 'Italiano',
    };
    return names[lang] || lang.toUpperCase();
  };

  return (
    <LanguageContext.Provider value={{
      language,
      t,
      changeLanguage,
      getFlag,
      getLanguageName,
      availableLanguages: Object.keys(translations)
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
