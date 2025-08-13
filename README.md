# Cola de Preguntas para Charla

Sistema de cola de preguntas en tiempo real para charlas y presentaciones, implementado con OAuth 2.0, JWT y Socket.io.

## Características

- ✅ **Autenticación OAuth 2.0** con GitHub (Authorization Code Flow)
- ✅ **JWT (JSON Web Tokens)** para gestión de sesiones seguras
- ✅ **Socket.io** para comunicación en tiempo real
- ✅ **Cola de preguntas** que se actualiza en vivo para todos los usuarios
- ✅ **Interfaz moderna y responsiva**
- ✅ **Listo para desplegar** en Railway, Render o Vercel

## Funcionalidad

1. **Iniciar sesión** vía OAuth con GitHub
2. **Enviar preguntas** que se añaden a la cola en tiempo real
3. **Ver todas las preguntas** de otros usuarios instantáneamente
4. **Eliminar sus propias preguntas**
5. **Estadísticas en vivo** del número de preguntas y usuarios conectados

## Configuración Previa

### 1. Crear aplicación OAuth en GitHub

1. Ve a GitHub → Settings → Developer settings → OAuth Apps
2. Crea una nueva OAuth App con:
   - **Application name**: "Cola de Preguntas"
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
3. Copia el **Client ID** y **Client Secret**

### 2. Configurar variables de entorno

Edita el archivo `.env` con tus credenciales:

```env
PORT=3000
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_esto
GITHUB_CLIENT_ID=tu_github_client_id_aqui
GITHUB_CLIENT_SECRET=tu_github_client_secret_aqui
BASE_URL=http://localhost:3000
```

⚠️ **IMPORTANTE**: Cambia `JWT_SECRET` por una cadena aleatoria y segura.

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# O ejecutar en modo producción
npm start
```

La aplicación estará disponible en: `http://localhost:3000`

## Estructura del Proyecto

```
├── server.js              # Servidor Express principal
├── package.json           # Dependencias y scripts
├── .env                   # Variables de entorno (no versionado)
├── .gitignore            # Archivos ignorados por Git
├── public/               # Archivos estáticos
│   ├── index.html        # Página de login
│   └── dashboard.html    # Dashboard principal
└── README.md             # Este archivo
```

## API Endpoints

### Autenticación
- `GET /auth/github` - Iniciar flujo OAuth
- `GET /auth/github/callback` - Callback OAuth
- `POST /auth/logout` - Cerrar sesión

### API Protegida (requiere JWT)
- `GET /api/profile` - Obtener perfil del usuario
- `GET /api/preguntas` - Obtener todas las preguntas
- `POST /api/preguntas` - Crear nueva pregunta
- `DELETE /api/preguntas/:id` - Eliminar pregunta propia

### Socket.io Eventos
- `nueva-pregunta` - Nueva pregunta añadida
- `cola-actualizada` - Cola de preguntas actualizada
- `pregunta-eliminada` - Pregunta eliminada

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Autenticación**: OAuth 2.0 (GitHub), JWT
- **Tiempo Real**: Socket.io
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Styling**: CSS Grid, Flexbox, Glassmorphism

## Despliegue

### Railway
1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno en Railway
3. Actualiza `BASE_URL` con tu URL de Railway
4. Actualiza la callback URL en GitHub OAuth

### Render
1. Conecta tu repositorio
2. Configura las variables de entorno
3. Actualiza URLs correspondientes

### Vercel
1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel`
3. Configura variables de entorno
4. Actualiza URLs correspondientes

## Autor

Stefanny Hernandez - Examen Unidad 3

## Licencia

MIT License
