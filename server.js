const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Cola de preguntas (en memoria para simplificar)
let preguntasQueue = [];
let nextQuestionId = 1;

// Sistema de alertas de incidencia
let incidentAlerts = [];
let incidentIdCounter = 1;

// Usuarios conectados con roles
let connectedUsers = new Map(); // socketId -> {user, role}
const ROLES = {
  ESTUDIANTE: 'estudiante',
  JEFE_LABORATORIO: 'jefe_laboratorio'
};

// Middleware de autenticación JWT
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Rutas de autenticación OAuth con Google
app.get('/auth/google', (req, res) => {
  const scopes = ['profile', 'email'];
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&` +
    `scope=${scopes.join(' ')}&` +
    `response_type=code&` +
    `access_type=offline`;
  
  res.redirect(googleAuthUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Código de autorización requerido');
  }

  try {
    // Intercambiar código por token de acceso
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_CALLBACK_URL
    });

    const { access_token } = tokenResponse.data;

    // Obtener información del usuario
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const userData = userResponse.data;

    // Generar JWT
    const jwtToken = jwt.sign(
      { 
        id: userData.id, 
        username: userData.email.split('@')[0], 
        name: userData.name,
        email: userData.email,
        avatar: userData.picture 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Establecer cookie con el JWT
    res.cookie('token', jwtToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error en OAuth:', error.response?.data || error.message);
    res.status(500).send('Error en la autenticación');
  }
});

// Ruta para cerrar sesión
app.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada exitosamente' });
});

// Rutas protegidas
app.get('/api/profile', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/preguntas', authenticateJWT, (req, res) => {
  res.json({ preguntas: preguntasQueue });
});

app.post('/api/preguntas', authenticateJWT, (req, res) => {
  const { pregunta } = req.body;
  
  if (!pregunta || pregunta.trim() === '') {
    return res.status(400).json({ error: 'La pregunta no puede estar vacía' });
  }

  const nuevaPregunta = {
    id: nextQuestionId++,
    pregunta: pregunta.trim(),
    autor: req.user.username,
    nombre: req.user.name,
    avatar: req.user.avatar,
    timestamp: new Date().toISOString()
  };

  preguntasQueue.push(nuevaPregunta);

  // Emitir a todos los clientes conectados
  io.emit('nueva-pregunta', nuevaPregunta);
  io.emit('cola-actualizada', preguntasQueue);

  res.json({ message: 'Pregunta añadida exitosamente', pregunta: nuevaPregunta });
});

app.delete('/api/preguntas/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const index = preguntasQueue.findIndex(p => p.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Pregunta no encontrada' });
  }

  const preguntaEliminada = preguntasQueue.splice(index, 1)[0];
  
  // Emitir actualización a todos los clientes
  io.emit('pregunta-eliminada', { id: parseInt(id) });
  io.emit('cola-actualizada', preguntasQueue);

  res.json({ message: 'Pregunta eliminada', pregunta: preguntaEliminada });
});

// Rutas para sistema de alertas de incidencia
app.post('/api/reportar-incidencia', authenticateJWT, (req, res) => {
  const { equipoId, descripcion } = req.body;
  
  if (!equipoId) {
    return res.status(400).json({ error: 'ID del equipo es requerido' });
  }

  const nuevaIncidencia = {
    id: incidentIdCounter++,
    equipoId: equipoId,
    descripcion: descripcion || `Incidencia reportada en ${equipoId}`,
    reportadoPor: req.user.username,
    nombreReportante: req.user.name,
    avatarReportante: req.user.avatar,
    timestamp: new Date().toISOString(),
    estado: 'pendiente'
  };

  incidentAlerts.push(nuevaIncidencia);

  // Enviar alerta solo a los jefes de laboratorio conectados
  connectedUsers.forEach((userData, socketId) => {
    if (userData.role === ROLES.JEFE_LABORATORIO) {
      io.to(socketId).emit('nueva-incidencia', {
        mensaje: `Se ha reportado una incidencia en el equipo ${equipoId}`,
        incidencia: nuevaIncidencia
      });
    }
  });

  res.json({ 
    message: 'Incidencia reportada exitosamente', 
    incidencia: nuevaIncidencia 
  });
});

app.get('/api/incidencias', authenticateJWT, (req, res) => {
  res.json({ incidencias: incidentAlerts });
});

app.post('/api/cambiar-rol', authenticateJWT, (req, res) => {
  const { rol } = req.body;
  
  if (!Object.values(ROLES).includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  // Actualizar rol en usuarios conectados si el usuario está conectado
  connectedUsers.forEach((userData, socketId) => {
    if (userData.user.username === req.user.username) {
      userData.role = rol;
    }
  });

  res.json({ message: `Rol cambiado a ${rol}`, rol });
});

// Rutas de páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard-incidencias.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard-incidencias.html'));
});

// Socket.io para tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Enviar cola actual al nuevo cliente
  socket.emit('cola-actualizada', preguntasQueue);

  // Manejar asignación de rol
  socket.on('asignar-rol', (data) => {
    const { user, role, forceUpdate } = data;
    
    // Validar que user existe
    if (!user) {
      console.log(`Error: Usuario no válido para socket ${socket.id}`);
      return;
    }
    
    const userName = user.username || user.name || 'Desconocido';
    const previousRole = connectedUsers.get(socket.id)?.role;
    
    connectedUsers.set(socket.id, { user, role });
    
    if (previousRole && previousRole !== role) {
      console.log(`Usuario ${userName} cambió de rol: ${previousRole} → ${role}`);
    } else {
      console.log(`Usuario ${userName} conectado como ${role}`);
    }
    
    // Enviar incidencias existentes si es jefe de laboratorio
    if (role === ROLES.JEFE_LABORATORIO) {
      socket.emit('incidencias-existentes', incidentAlerts);
      console.log(`Enviando ${incidentAlerts.length} incidencias a ${userName}`);
    }
  });

  // Manejar solicitud de incidencias existentes
  socket.on('solicitar-incidencias', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData && userData.role === ROLES.JEFE_LABORATORIO) {
      socket.emit('incidencias-existentes', incidentAlerts);
      console.log(`Enviando ${incidentAlerts.length} incidencias existentes a ${userData.user.username}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});
