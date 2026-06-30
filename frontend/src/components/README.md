# Frontend Components - ValoInventory

## Estructura de Componentes

```
frontend/src/components/
├── auth/                    # Componentes de autenticación
│   ├── index.js            # Exportaciones de auth
│   ├── Login.jsx           # Formulario de login
│   ├── Register.jsx        # Formulario de registro
│   └── AuthPage.jsx        # Página de autenticación
├── inventory/              # Componentes de inventario
│   ├── index.js            # Exportaciones de inventory
│   ├── Inventory.jsx       # Componente principal de inventario
│   ├── InventoryDashboard.jsx # Dashboard del inventario
│   ├── InventorySkins.jsx  # Gestión de skins
│   ├── InventoryAgents.jsx # Gestión de agentes
│   ├── InventoryBuddies.jsx # Gestión de buddies
│   ├── InventoryCards.jsx  # Gestión de cards
│   ├── InventoryBattlepass.jsx # Gestión de battle passes
│   ├── InventorySprays.jsx # Gestión de sprays
│   ├── InventoryTitles.jsx # Gestión de títulos
│   ├── InventoryNavbar.jsx # Navegación del inventario
│   ├── MySkins.jsx         # Mis skins
│   ├── AllSkins.jsx        # Todas las skins
│   └── MySkins.module.css  # Estilos CSS modules
├── weapons/                # Componentes de armas y skins
│   ├── index.js            # Exportaciones de weapons
│   ├── WeaponCard.jsx      # Tarjeta de arma
│   ├── WeaponDetail.jsx    # Detalle de arma
│   ├── WeaponGroup.jsx     # Grupo de armas
│   ├── WeaponsGallery.jsx  # Galería de armas
│   ├── SkinCard.jsx        # Tarjeta de skin
│   └── SkinSlider.jsx      # Slider de skins
├── ui/                     # Componentes de interfaz compartidos
│   ├── index.js            # Exportaciones de ui
│   ├── HomePage.jsx        # Página principal
│   └── PlayerCard.jsx      # Tarjeta de jugador
├── shared/                 # Componentes reutilizables (futuro)
│   └── (vacío por ahora)
├── index.js                # Exportaciones principales
└── README.md              # Este archivo
```

## Descripción de Categorías

### **Auth Components**
Componentes relacionados con la autenticación de usuarios:
- Formularios de login y registro
- Páginas de autenticación
- Manejo de sesiones

### **Inventory Components**
Componentes para la gestión del inventario del jugador:
- Dashboard principal
- Gestión de diferentes tipos de items (skins, agents, buddies, etc.)
- Navegación y organización del inventario

### **Weapons Components**
Componentes específicos para armas y skins:
- Visualización de armas
- Gestión de skins
- Galerías y sliders

### **UI Components**
Componentes de interfaz de usuario compartidos:
- Páginas principales
- Componentes de presentación reutilizables

### **Shared Components** (Futuro)
Componentes altamente reutilizables como:
- Botones
- Modales
- Loaders
- Formularios genéricos

## Cómo Usar

### Importaciones desde categorías específicas:
```javascript
import { Login, Register } from './components/auth';
import { Inventory, InventorySkins } from './components/inventory';
import { WeaponCard, SkinCard } from './components/weapons';
import { HomePage, PlayerCard } from './components/ui';
```

### Importaciones desde el índice principal:
```javascript
import { Login, Inventory, WeaponCard, HomePage } from './components';
```

## Beneficios de la Nueva Estructura

1. **Organización Clara**: Cada componente tiene su lugar lógico
2. **Fácil Navegación**: Estructura intuitiva y predecible
3. **Escalabilidad**: Fácil agregar nuevos componentes
4. **Mantenibilidad**: Código más fácil de mantener
5. **Reutilización**: Importaciones organizadas y claras
6. **Colaboración**: Estructura que facilita el trabajo en equipo

## Convenciones

- **Nombres de archivos**: PascalCase para componentes React
- **Nombres de carpetas**: camelCase para categorías
- **Archivos de índice**: Siempre presentes para facilitar importaciones
- **CSS Modules**: Usar cuando sea necesario para estilos específicos 