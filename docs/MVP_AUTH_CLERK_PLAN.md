# Plan MVP de autenticación delegada y seguridad

> Plan operativo para reemplazar progresivamente la autenticación propia por Clerk, Google OAuth y JWT de sesión administrados.

## Estado del documento

| Campo | Valor |
|---|---|
| Estado general | `PLANIFICADO — implementación no iniciada` |
| Rama donde se creó el plan | `feat/optimization` |
| Fecha de creación | `2026-08-14` |
| Alcance | Autenticación MVP, Google OAuth, sesiones, JWT, migración y seguridad |
| Relación | Prerrequisito de APIs privadas en `SCALABLE_PAGINATION_AND_SHARING_PLAN.md` |
| Proveedor recomendado | Clerk |
| Regla principal | No almacenar contraseñas nuevas ni emitir nuevos JWT propios |

## Prioridad activa del MVP

Este plan forma el bloque pre-despliegue prioritario junto con [`MVP_SECURITY_HARDENING_PLAN.md`](./MVP_SECURITY_HARDENING_PLAN.md).

Orden acordado:

1. Clerk y Google OAuth con JWT delegado.
2. Cierre y hardening de endpoints.
3. Tokens públicos seguros.
4. Infraestructura final de despliegue, observabilidad y operación en una etapa posterior.

Las tareas de testing de cada fase no se difieren: deben entregarse con la implementación correspondiente.

## Alcance del MVP

Clerk se encargará de:

- Registro e inicio de sesión.
- Google OAuth.
- Email y contraseña o código por email, según configuración final.
- Recuperación de acceso.
- Emisión, renovación, expiración y revocación de JWT de sesión.
- Gestión básica de usuarios y dispositivos.
- Protección básica contra abuso disponible en el plan elegido.

ValoInventory seguirá encargado de:

- Usuarios internos y su relación con Clerk.
- Ownership de cuentas Riot.
- Inventarios y publicaciones.
- Autorización de cada recurso.
- Plan `free` y futura relación con suscripciones.
- Auditoría de acciones propias del producto.

Fuera del MVP:

- API keys.
- Organizaciones y equipos.
- Roles complejos.
- Tokens M2M.
- Stripe y cobros.
- MFA como requisito general.
- Panel administrativo avanzado.
- Persistencia de credenciales Riot para automatizaciones.

## Objetivos

- Lanzar con login simple y confiable.
- Permitir login con Google.
- Dejar de mantener hashing, recuperación de contraseñas y ciclo de vida de JWT propios.
- Mantener MongoDB como fuente de verdad de los datos de negocio.
- Evitar una migración destructiva o un corte total de sesiones.
- Preparar el modelo para planes pagos sin implementar pagos todavía.
- Mantener endpoints privados protegidos durante toda la transición.

## Restricciones y decisiones

### 1. Clerk autentica; ValoInventory autoriza

Un JWT válido demuestra quién es el usuario, pero no autoriza automáticamente el acceso a una cuenta Riot.

Cada endpoint debe seguir verificando:

```text
usuario autenticado
        +
propiedad del recurso
        +
estado del recurso
        =
acceso permitido
```

### 2. MongoDB conserva un usuario local

Modelo objetivo mínimo:

```js
{
  clerkUserId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true },
  username: { type: String },
  plan: {
    type: String,
    enum: ['free', 'seller', 'pro'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'past_due', 'canceled'],
    default: 'none'
  },
  authMigratedAt: { type: Date, default: null },
  createdAt: Date,
  updatedAt: Date
}
```

`plan` y `subscriptionStatus` se agregan ahora como datos, pero no activan cobros ni funciones premium durante el MVP.

### 3. No crear dos cuentas por el mismo email automáticamente

La vinculación por email tiene riesgo si no se valida correctamente.

Regla:

- Usar solamente emails verificados por Clerk.
- Normalizar email antes de comparar.
- Si existe exactamente un usuario local con ese email verificado, vincular `clerkUserId` mediante una operación atómica.
- Si el email ya está asociado a otro `clerkUserId`, rechazar y registrar el evento.
- Si hay duplicados históricos, detener la vinculación y requerir resolución manual.

### 4. El backend nunca confía en claims enviados por el frontend

- Verificar firma, issuer, audiencia, expiración y authorized parties.
- Obtener identidad desde el JWT validado.
- No aceptar `userId`, `email`, `plan` u ownership desde el body.
- No usar `decode()` sin verificación criptográfica.

### 5. El token no se guarda en localStorage

La implementación debe seguir el mecanismo de sesión recomendado por Clerk.

- No copiar JWT de Clerk a claves propias de localStorage.
- No registrar tokens en consola.
- No incluir tokens en query strings.
- No enviar tokens a herramientas de analytics.
- No devolver tokens desde endpoints propios.

## Arquitectura objetivo

```text
Usuario
  │
  ├── Google OAuth / Email
  ▼
Clerk
  │
  ├── Sesión administrada
  └── JWT corto y renovable
        │
        ▼
React ── Authorization: Bearer <JWT> ──▶ Express
                                              │
                                              ├── Verifica JWT Clerk
                                              ├── Obtiene clerkUserId
                                              ├── Resuelve User Mongo
                                              ├── Verifica ownership
                                              └── Ejecuta operación
```

## Variables de entorno

Frontend:

```text
REACT_APP_CLERK_PUBLISHABLE_KEY=
```

Backend:

```text
CLERK_SECRET_KEY=
CLERK_JWT_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
CLERK_AUTHORIZED_PARTIES=http://localhost:3000,https://dominio-produccion
```

Reglas:

- [ ] Agregar nombres sin valores a `.env.example`.
- [ ] Mantener secretos fuera de Git.
- [ ] Usar claves separadas para desarrollo y producción.
- [ ] Rotar cualquier clave expuesta accidentalmente.
- [ ] No imprimir variables de Clerk en startup o logs.

## Tracker

| ID | Fase | Estado | Rama propuesta | Rama final | Commit/PR | Evidencia |
|---|---|---|---|---|---|---|
| A00 | Documento operativo | ✅ Terminado | `feat/optimization` | `feat/optimization` | Pendiente de commit | Este archivo |
| A01 | Preparación, threat model y testing | ⬜ Pendiente | `codex/auth-01-foundation` | — | — | — |
| A02 | Clerk en frontend | ⬜ Pendiente | `codex/auth-02-clerk-frontend` | — | — | — |
| A03 | JWT Clerk en Express | ⬜ Pendiente | `codex/auth-03-clerk-backend` | — | — | — |
| A04 | Vinculación y migración de usuarios | ⬜ Pendiente | `codex/auth-04-user-migration` | — | — | — |
| A05 | Google OAuth y UX final | ⬜ Pendiente | `codex/auth-05-google-oauth` | — | — | — |
| A06 | Cutover y retiro del auth propio | ⬜ Pendiente | `codex/auth-06-cutover` | — | — | — |

## Condición obligatoria para cerrar una fase

- [ ] Implementación terminada.
- [ ] Tests unitarios pasando.
- [ ] Tests de integración pasando.
- [ ] Tests de seguridad aplicables pasando.
- [ ] Tests E2E aplicables pasando.
- [ ] Build de producción pasando.
- [ ] QA manual documentado.
- [ ] Sin secretos o tokens en logs, bundles o Git.
- [ ] Rollback probado o documentado.
- [ ] Rama, commit y PR registrados.
- [ ] Revisión de seguridad completada.

---

# Fases paso por paso

## A01 — Preparación, threat model y testing

**Rama propuesta:** `codex/auth-01-foundation`

### Objetivo

Crear la red de seguridad antes de cambiar el sistema de login existente.

### Trabajo

- [ ] Documentar activos sensibles: sesión, datos personales, cuentas Riot y shares.
- [ ] Documentar actores: usuario legítimo, atacante externo, usuario autenticado malicioso y token robado.
- [ ] Documentar superficies: frontend, cookies, Authorization header, Express, Mongo y webhooks.
- [ ] Registrar flujos actuales de login, registro, verificación y logout.
- [ ] Identificar todos los endpoints que usan `authMiddleware`.
- [ ] Crear fixtures de usuario legacy y usuario Clerk.
- [ ] Preparar mocks/JWKS de testing sin llamar a Clerk real en unitarios.
- [ ] Definir códigos de error consistentes para 401 y 403.
- [ ] Agregar sanitización de logs para headers sensibles.
- [ ] Confirmar que `.gitignore` cubre archivos `.env`.

### Amenazas mínimas a cubrir

- [ ] JWT expirado.
- [ ] JWT con firma inválida.
- [ ] JWT emitido para otra aplicación.
- [ ] Replay de token revocado.
- [ ] Acceso horizontal a cuentas de otro usuario.
- [ ] Account linking incorrecto por email.
- [ ] CSRF si se usan cookies en endpoints mutables.
- [ ] XSS y extracción de tokens.
- [ ] Open redirects en callbacks OAuth.
- [ ] Webhook falsificado.
- [ ] Filtración de secretos en bundle frontend.

### Tests requeridos

- [ ] Suite de auth actual congelada como regresión.
- [ ] Test que falla si aparece un secreto en build frontend.
- [ ] Test que comprueba que logs no incluyen Authorization completo.
- [ ] Matriz de endpoints públicos y privados.

## A02 — Clerk en frontend

**Rama propuesta:** `codex/auth-02-clerk-frontend`

### Objetivo

Integrar Clerk sin retirar todavía el sistema anterior.

### Trabajo

- [ ] Instalar `@clerk/clerk-react`.
- [ ] Agregar `ClerkProvider` en la raíz.
- [ ] Configurar rutas de sign-in y sign-up.
- [ ] Crear adaptación para que el resto del frontend consuma una interfaz estable de auth.
- [ ] Exponer `user`, `isLoaded`, `isSignedIn`, `getToken` y `signOut` mediante el adapter.
- [ ] Evitar que los componentes dependan directamente de detalles del proveedor.
- [ ] Implementar estados de carga sin flashes de contenido privado.
- [ ] Configurar redirects permitidos explícitos.
- [ ] Mantener auth legacy detrás de feature flag temporal.

### Tests requeridos

- [ ] Render sin publishable key produce error controlado.
- [ ] Usuario no autenticado ve login.
- [ ] Usuario autenticado accede a home.
- [ ] Loading no muestra contenido privado.
- [ ] Logout limpia la UI y vuelve a ruta pública.
- [ ] Callback inválido no genera redirect abierto.
- [ ] Test de accesibilidad del formulario/flujo usado.

## A03 — JWT Clerk en Express

**Rama propuesta:** `codex/auth-03-clerk-backend`

### Objetivo

Delegar la validación de identidad y conservar autorización propia.

### Trabajo

- [ ] Instalar `@clerk/express`.
- [ ] Agregar middleware global recomendado por Clerk.
- [ ] Crear `requireClerkAuth` para rutas privadas.
- [ ] Configurar `authorizedParties` para localhost y producción.
- [ ] Verificar issuer y audiencia/azp según configuración.
- [ ] Resolver `clerkUserId` a User Mongo.
- [ ] Adjuntar solamente el User Mongo ya validado a `req`.
- [ ] Conservar ownership actual después de resolver usuario.
- [ ] No consultar Clerk en cada request si la verificación JWKS puede ser local/cacheada.
- [ ] Agregar timeouts y error controlado para fallos de proveedor.
- [ ] Mantener middleware legacy temporal bajo feature flag.

### Respuestas

```text
401: no existe sesión válida o JWT es inválido/expiró
403: identidad válida, pero no puede acceder al recurso
404: recurso no visible para ese usuario cuando convenga evitar enumeración
```

### Tests requeridos

- [ ] Sin Authorization.
- [ ] Bearer malformado.
- [ ] Firma inválida.
- [ ] Token expirado.
- [ ] Issuer incorrecto.
- [ ] Authorized party incorrecta.
- [ ] Usuario Clerk sin User Mongo.
- [ ] Usuario accede a su cuenta Riot.
- [ ] Usuario no accede a cuenta Riot ajena.
- [ ] Endpoint público continúa accesible.
- [ ] Logout/revocación se refleja según garantías de Clerk.

## A04 — Vinculación y migración de usuarios

**Rama propuesta:** `codex/auth-04-user-migration`

### Objetivo

Vincular usuarios actuales sin perder cuentas Riot ni crear duplicados.

### Estrategia

1. Usuario entra mediante Clerk.
2. Backend recibe `clerkUserId` y email verificado.
3. Busca primero por `clerkUserId`.
4. Si no existe, busca email normalizado.
5. Si encuentra exactamente un usuario legacy, vincula atómicamente.
6. Si no encuentra, crea User Mongo.
7. Si encuentra conflicto, rechaza y envía a resolución manual.

### Trabajo

- [ ] Agregar `clerkUserId`, `authMigratedAt`, `plan` y `subscriptionStatus`.
- [ ] Crear índice unique sparse para `clerkUserId`.
- [ ] Normalizar emails de usuarios existentes.
- [ ] Crear reporte de duplicados antes de migrar.
- [ ] Implementar vinculación atómica.
- [ ] Preservar `_id` del usuario para mantener ownership.
- [ ] Registrar auditoría de link, conflicto y creación.
- [ ] Crear comando dry-run de migración.
- [ ] Documentar rollback.

### Tests requeridos

- [ ] Usuario nuevo.
- [ ] Usuario legacy con mismo email verificado.
- [ ] Email no verificado no vincula.
- [ ] Email duplicado no vincula automáticamente.
- [ ] `clerkUserId` ya asociado a otro usuario.
- [ ] Dos requests simultáneos no crean duplicados.
- [ ] Se preservan todas las cuentas Riot.
- [ ] Reejecutar migración es idempotente.

## A05 — Google OAuth y UX final

**Rama propuesta:** `codex/auth-05-google-oauth`

### Objetivo

Ofrecer un flujo MVP claro y seguro con Google.

### Trabajo

- [ ] Configurar Google en Clerk para desarrollo.
- [ ] Configurar credenciales y callbacks de producción por separado.
- [ ] Allowlist exacta de callback/logout URLs.
- [ ] Agregar botón “Continuar con Google”.
- [ ] Mantener alternativa por email definida para recuperación.
- [ ] Adaptar textos, errores y estados al lenguaje visual del proyecto.
- [ ] Confirmar email verificado antes de vincular legacy.
- [ ] Evitar revelar si un email existe en mensajes sensibles.
- [ ] Configurar consentimiento y datos mínimos solicitados.

### Tests requeridos

- [ ] E2E Google OAuth con estrategia segura de test o entorno de Clerk.
- [ ] Callback exitoso.
- [ ] Callback cancelado.
- [ ] State/nonce inválido.
- [ ] Redirect no permitido.
- [ ] Usuario Google nuevo.
- [ ] Usuario Google vinculado a legacy.
- [ ] Logout y login posterior.
- [ ] Desktop y móvil.

## A06 — Cutover y retiro del auth propio

**Rama propuesta:** `codex/auth-06-cutover`

### Objetivo

Dejar Clerk como única fuente de identidad sin una eliminación irreversible prematura.

### Trabajo

- [ ] Activar Clerk mediante feature flag para usuarios internos primero.
- [ ] Medir tasa de éxito/error de login.
- [ ] Migrar usuarios en grupos pequeños.
- [ ] Confirmar que todos los endpoints privados usan nuevo middleware.
- [ ] Deshabilitar nuevos registros legacy.
- [ ] Deshabilitar emisión de nuevos JWT propios.
- [ ] Mantener validación legacy sólo durante ventana definida.
- [ ] Revocar o expirar sesiones legacy restantes.
- [ ] Eliminar password del DTO y de toda respuesta.
- [ ] Planificar borrado de hashes después del período de rollback.
- [ ] Rotar `JWT_SECRET` legacy al retirar el sistema.
- [ ] Eliminar código legacy y dependencias no usadas.
- [ ] Actualizar README, AGENTS y diagramas.

### Tests finales

- [ ] Suite unitaria completa.
- [ ] Suite integración completa.
- [ ] E2E login Google y email.
- [ ] Regresión de cuentas Riot.
- [ ] Regresión de inventario y shares.
- [ ] Verificación de bundle sin secretos.
- [ ] Verificación de logs sin tokens.
- [ ] Test de carga de endpoints autenticados.
- [ ] Docker Compose arranca con configuración documentada.
- [ ] Rollback documentado y ensayado.

---

# Seguridad fundamental del MVP

## Headers y transporte

- [ ] HTTPS obligatorio en producción.
- [ ] HSTS cuando el dominio esté estabilizado.
- [ ] CSP compatible con Clerk y lo más restrictiva posible.
- [ ] `X-Content-Type-Options: nosniff`.
- [ ] Política de referrer adecuada.
- [ ] CORS con dominios explícitos; nunca `*` con credenciales.
- [ ] Limitar tamaño de bodies.
- [ ] Rate limit para endpoints de auth y mutaciones.

## Sesiones

- [ ] Verificar JWT en backend, no solamente en React.
- [ ] No almacenar JWT manualmente en localStorage.
- [ ] No enviar JWT por URL.
- [ ] No registrar Authorization.
- [ ] Expiración y revocación probadas.
- [ ] Cerrar todas las sesiones desde configuración si Clerk lo permite en el plan.

## Datos

- [ ] Minimizar PII duplicada en Mongo.
- [ ] Email normalizado y acceso restringido.
- [ ] DTOs públicos mediante allowlist.
- [ ] Queries siempre limitadas por owner.
- [ ] No mezclar credenciales Riot con identidad Clerk.
- [ ] Backups y acceso a Mongo documentados.

## Webhooks

Si se usan webhooks para sincronizar perfil:

- [ ] Verificar firma con secreto dedicado.
- [ ] Rechazar timestamps antiguos.
- [ ] Hacer handlers idempotentes.
- [ ] Registrar ID del evento procesado.
- [ ] No confiar en webhooks sin firma aunque provengan de IP conocida.
- [ ] Manejar eventos desordenados.

## Logs y auditoría

Eventos mínimos:

- `auth.user_linked`
- `auth.user_link_conflict`
- `auth.login_failed`
- `auth.forbidden_resource`
- `auth.migration_completed`
- `auth.legacy_session_rejected`

Nunca registrar:

- JWT completo.
- Cookies de sesión.
- Secret keys.
- Passwords.
- URLs que contengan códigos OAuth.
- Tokens Riot.

# CI requerido

```text
auth-unit
auth-integration
auth-contract-security
frontend-auth-unit
frontend-build
auth-e2e-smoke
secret-scan
```

Antes del cutover:

```text
auth-e2e-full
authenticated-api-regression
auth-performance-smoke
```

# Evidencia obligatoria por PR

```text
Rama:
Commit:
PR:

Tests unitarios:
Tests integración:
Tests seguridad:
Tests E2E:
Build:
Coverage:

Threats cubiertas:
Datos sensibles revisados:
QA manual:
Riesgos conocidos:
Rollback:
```

# Definición final de terminado

- [ ] Google OAuth funciona en desarrollo y producción.
- [ ] Existe alternativa de acceso/recuperación por email.
- [ ] Clerk emite y renueva las sesiones.
- [ ] Express verifica cada JWT privado.
- [ ] Ownership continúa validándose en Mongo.
- [ ] Usuarios legacy se vinculan sin perder datos.
- [ ] No se crean duplicados por carrera o email ambiguo.
- [ ] No se emiten JWT propios nuevos.
- [ ] No se almacenan contraseñas nuevas en Mongo.
- [ ] No existen tokens o secretos en bundle, logs o Git.
- [ ] Todos los tests obligatorios pasan.
- [ ] La cobertura mínima se cumple.
- [ ] El rollback está documentado.
- [ ] Ramas, commits, PRs y evidencia están registrados.

# Referencias oficiales

- Clerk pricing: <https://clerk.com/pricing>
- Clerk token verification: <https://clerk.com/docs/reference/backend/verify-token>
