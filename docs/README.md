# Docs Index

Esta carpeta contiene referencias visuales y snippets de inspiracion para la UI de ValoInventory. No es codigo productivo de la app: sirve como material de consulta antes de tocar componentes del frontend.

## Planes activos

- [`SCALABLE_PAGINATION_AND_SHARING_PLAN.md`](./SCALABLE_PAGINATION_AND_SHARING_PLAN.md): plan operativo, tracker por ramas y estrategia obligatoria de testing para paginación, performance y publicaciones escalables.
- [`MVP_AUTH_CLERK_PLAN.md`](./MVP_AUTH_CLERK_PLAN.md): plan conectado para delegar login, Google OAuth y JWT a Clerk con migración segura y testing obligatorio.
- [`MVP_SECURITY_HARDENING_PLAN.md`](./MVP_SECURITY_HARDENING_PLAN.md): plan prioritario para cerrar endpoints, endurecer Express y migrar shares a tokens públicos aleatorios, hasheados, rotables y revocables.

## Estructura

```text
docs/
  inspiration/
    agent-unlock/
    buttons/
    character-banner/
    inventory-layout/
    login-agent-card/
  references/
```

## Inspiration

### `inspiration/agent-unlock/`

Referencia visual para una pantalla o seccion de agentes desbloqueados/bloqueados.

- `agent-unlock.html`: markup base de la composicion de agentes.
- `agent-unlock.scss`: estilos de la referencia, con tipografias Valorant/Anton y layout visual.
- `agents-data.js`: datos mock/referencia de agentes, nombres, imagenes y estado locked/unlocked.

Usar cuando se trabaje en:

- `frontend/src/components/inventory/InventoryAgents.jsx`
- `frontend/src/hooks/useStaticAgents.js`

### `inspiration/buttons/`

Referencia de boton estilo Valorant.

- `valorant-button.scss`: snippet SCSS con variables de color y animaciones/hover.

Usar cuando se quiera mejorar botones del frontend manteniendo estetica Valorant. Antes de copiarlo, adaptarlo a CSS real del proyecto o modularizarlo segun el componente afectado.

### `inspiration/character-banner/`

Referencia grande de banner/personajes Valorant.

- `character-banner.html`: demo HTML completa con estructura y estilos embebidos o asociados. Es grande; abrir solo si se necesita inspiracion de hero/banner/personajes.

Usar cuando se trabaje en:

- `frontend/src/components/ui/LandingPage.jsx`
- `frontend/src/components/ui/HomePage.jsx`
- Vistas visuales con agentes/personajes.

### `inspiration/inventory-layout/`

Referencia para layout de inventario de armas/skins.

- `inventory-layout.html`: markup de una seccion de inventario/weapons.
- `inventory-layout.scss`: estilos de la referencia para tarjetas/listado visual.

Usar cuando se trabaje en:

- `frontend/src/components/inventory/Inventory.jsx`
- `frontend/src/components/inventory/InventorySkins.jsx`
- `frontend/src/components/inventory/MySkins.jsx`
- `frontend/src/components/weapons/WeaponsGallery.jsx`

### `inspiration/login-agent-card/`

Referencia visual para auth/CTA tipo "Become Valorant Agent".

- `login-agent-card.html`: markup de tarjeta/seccion de login o landing.
- `login-agent-card.scss`: estilos SCSS con paleta Valorant, fuentes Rajdhani/Teko y layout.

Usar cuando se trabaje en:

- `frontend/src/components/auth/AuthPage.jsx`
- `frontend/src/components/auth/Login.jsx`
- `frontend/src/components/auth/Register.jsx`
- `frontend/src/components/ui/LandingPage.jsx`

## References

### `references/valorant-api-codepen-link.txt`

Link a CodePen marcado como referencia de API/Valorant. Revisar manualmente solo si se necesita la inspiracion original.

### `references/valorant-ui-kit-community.pdf`

PDF grande con UI kit/concepto de entrenamiento Valorant de la comunidad. Es material visual de referencia, no fuente de verdad tecnica.

Abrirlo solo cuando se necesiten decisiones visuales de alto nivel: estilo de pantallas, elementos de HUD, composicion, colores o patrones UI.

## Reglas de uso

- No importar estos archivos directamente al frontend sin revisarlos y adaptarlos.
- Muchos snippets son SCSS o demos HTML externos; el frontend actual usa React/CSS, asi que convertir con cuidado.
- Si una referencia se convierte en codigo real, mover la implementacion a `frontend/src/...` y dejar aca solo la referencia o una nota.
- Mantener nombres descriptivos y extensiones reales para ahorrar exploracion futura.
