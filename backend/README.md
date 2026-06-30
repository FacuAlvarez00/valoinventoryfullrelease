# Backend - ValoInventory

## Estructura del Proyecto

```
backend/
├── config/
│   └── constants.js          # Configuraciones y constantes centralizadas
├── controllers/
│   ├── authController.js     # Controlador para autenticación
│   └── riotController.js     # Controlador para operaciones Riot API
├── middleware/
│   └── auth.js              # Middleware de autenticación
├── models/
│   └── User.js              # Modelo de Usuario
├── routes/
│   └── auth.js              # Rutas de autenticación y Riot API
├── services/
│   └── riotService.js       # Servicio para llamadas a Riot API
├── server.js                # Archivo principal del servidor
└── README.md               # Este archivo
```

## Descripción de Módulos

### **Config**
- `constants.js`: Centraliza todas las configuraciones, constantes y endpoints de la API de Riot

### **Controllers**
- `authController.js`: Maneja la lógica de autenticación (registro, login, logout, perfil)
- `riotController.js`: Maneja todas las operaciones relacionadas con la API de Riot

### **Middleware**
- `auth.js`: Middleware para verificar tokens JWT y autenticar usuarios

### **Models**
- `User.js`: Modelo de Mongoose para usuarios con cuentas Riot asociadas

### **Routes**
- `auth.js`: Define todas las rutas de autenticación y Riot API

### **Services**
- `riotService.js`: Clase que encapsula todas las llamadas a la API de Riot

## Endpoints Disponibles

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login de usuario
- `POST /auth/logout` - Logout de usuario
- `GET /auth/profile` - Obtener perfil del usuario (requiere autenticación)

### Riot API
- `POST /auth/riot/skins` - Obtener skins de un usuario Riot
- `POST /auth/riot/skins/details` - Obtener detalles de skins específicas
- `POST /auth/riot/loadout` - Obtener loadout actual
- `POST /auth/riot/sprays/details` - Obtener detalles de sprays específicos
- `POST /auth/riot/titles/details` - Obtener detalles de títulos específicos
- `POST /auth/riot/test-sprays` - Endpoint de prueba para verificar sprays
- `POST /auth/riot/account` - Agregar cuenta Riot (requiere autenticación)
- `POST /auth/riot/account/refresh` - Actualizar datos de cuenta Riot (requiere autenticación)
- `DELETE /auth/riot/account/:puuid` - Eliminar cuenta Riot (requiere autenticación)

## Beneficios de la Nueva Estructura

1. **Separación de Responsabilidades**: Cada módulo tiene una responsabilidad específica
2. **Mantenibilidad**: Código más fácil de mantener y debuggear
3. **Escalabilidad**: Fácil agregar nuevas funcionalidades
4. **Reutilización**: Servicios y controladores reutilizables
5. **Testing**: Estructura más fácil de testear
6. **Legibilidad**: Código más limpio y organizado

## Cómo Usar

1. Instalar dependencias: `npm install`
2. Configurar variables de entorno
3. Ejecutar servidor: `npm run dev` 