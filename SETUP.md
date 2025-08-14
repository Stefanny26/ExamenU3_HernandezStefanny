# Instrucciones de Configuración y Despliegue

## Configuración Paso a Paso

### 1. Configuración de GitHub OAuth

Antes de ejecutar la aplicación, debes configurar una aplicación OAuth en GitHub:

1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Haz clic en "New OAuth App"
3. Completa los campos:
   - **Application name**: Cola de Preguntas Charla
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
4. Haz clic en "Register application"
5. Copia el **Client ID** y **Client Secret**

### 2. Configurar Variables de Entorno

Edita el archivo `.env` y reemplaza los valores:

```env
PORT=3000
JWT_SECRET=cambia_esto_por_una_cadena_super_segura_y_aleatoria
GITHUB_CLIENT_ID=tu_client_id_de_github_aqui
GITHUB_CLIENT_SECRET=tu_client_secret_de_github_aqui
BASE_URL=http://localhost:3000
```

### 3. Ejecutar la Aplicación

```bash
# Modo desarrollo (recomendado durante desarrollo)
npm run dev

# Modo producción
npm start
```

### 4. Probar la Aplicación

1. Abre tu navegador en `http://localhost:3000`
2. Haz clic en "Iniciar sesión con GitHub"
3. Autoriza la aplicación
4. Deberías ser redirigido al dashboard
5. Prueba enviar una pregunta y ver cómo aparece en tiempo real

## Despliegue en Railway

### 1. Preparar para el Despliegue

1. Asegúrate de que todos los cambios estén commiteados
2. Sube tu repositorio a GitHub

### 2. Configurar Railway

1. Ve a [Railway](https://railway.app/)
2. Inicia sesión con GitHub
3. Haz clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Elige tu repositorio

### 3. Configurar Variables de Entorno en Railway

En el dashboard de Railway, ve a Variables y añade:

```
JWT_SECRET=cadena_super_segura_para_produccion
GITHUB_CLIENT_ID=tu_client_id
GITHUB_CLIENT_SECRET=tu_client_secret
BASE_URL=https://tu-app.railway.app
```

### 4. Actualizar OAuth Callback

1. Ve a tu aplicación OAuth en GitHub
2. Actualiza la **Authorization callback URL** a: `https://tu-app.railway.app/auth/github/callback`
3. Actualiza la **Homepage URL** a: `https://tu-app.railway.app`

### 5. Desplegar

Railway desplegará automáticamente. Tu aplicación estará disponible en la URL proporcionada.

## Troubleshooting

### Error: "Client ID/Secret inválido"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que el callback URL coincida exactamente

### Error: "Token inválido"
- Genera un nuevo JWT_SECRET
- Limpia las cookies del navegador

### Socket.io no funciona
- Verifica que no haya firewalls bloqueando WebSockets
- En producción, asegúrate de que el servidor soporte WebSockets

### La aplicación no carga
- Verifica que el PORT esté configurado correctamente
- Revisa los logs del servidor para errores específicos
