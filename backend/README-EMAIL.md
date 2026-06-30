# 📧 Configuración del Sistema de Email

## 🎯 Funcionalidad
Cuando un usuario se registra en la aplicación, automáticamente se envía un email de bienvenida con:
- Confirmación de registro exitoso
- Información sobre las funcionalidades disponibles
- Enlace directo a la aplicación
- Diseño temático de Valorant

## ⚙️ Configuración de Gmail

### Paso 1: Activar Verificación en Dos Pasos
1. Ve a tu cuenta de Google
2. Navega a **Seguridad**
3. Activa **Verificación en dos pasos**

### Paso 2: Generar Contraseña de Aplicación
1. En **Seguridad**, busca **Contraseñas de aplicación**
2. Selecciona **Otra** y dale un nombre (ej: "Valorant Inventory")
3. Copia la contraseña generada (16 caracteres)

### Paso 3: Crear Archivo .env
1. En la carpeta `backend`, crea un archivo llamado `.env`
2. Agrega el siguiente contenido:

```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
PORT=5000
JWT_SECRET=tu-jwt-secret-super-seguro
```

### Paso 4: Reiniciar Servidor
```bash
npm start
```

## 📧 Ejemplo de Email Enviado

El email incluye:
- **Asunto**: "🎮 ¡Bienvenido a Valorant Inventory!"
- **Diseño**: Tema oscuro similar a Valorant
- **Contenido**:
  - Saludo personalizado
  - Lista de funcionalidades disponibles
  - Botón para ir a la aplicación
  - Información de contacto

## 🔧 Solución de Problemas

### Error: "Invalid login"
- Verifica que la verificación en dos pasos esté activada
- Asegúrate de usar la contraseña de aplicación, no tu contraseña normal

### Error: "Less secure app access"
- Las contraseñas de aplicación son más seguras que "acceso de apps menos seguras"
- Usa siempre contraseñas de aplicación

### Email no se envía
- Verifica las credenciales en el archivo `.env`
- Revisa los logs del servidor para errores específicos
- El registro del usuario funciona aunque el email falle

## 🚀 Prueba del Sistema

1. Registra un nuevo usuario en la aplicación
2. Verifica que recibas el email de bienvenida
3. El email incluye un enlace directo a la aplicación

## 📝 Notas Importantes

- El sistema funciona aunque el email no se envíe (registro exitoso)
- Los emails usan HTML con diseño responsivo
- El sistema es compatible con Gmail y otros proveedores SMTP
- Las credenciales se almacenan de forma segura en variables de entorno 


.