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

// Rutas de autenticación OAuth con GitHub
app.get('/auth/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.BASE_URL}/auth/github/callback&scope=user:email`;
  res.redirect(githubAuthUrl);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Código de autorización requerido');
  }

  try {
    // Intercambiar código por token de acceso
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Obtener información del usuario
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`
      }
    });

    const userData = userResponse.data;

    // Generar JWT
    const jwtToken = jwt.sign(
      { 
        id: userData.id, 
        username: userData.login, 
        name: userData.name || userData.login,
        avatar: userData.avatar_url 
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

// Rutas de páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Socket.io para tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Enviar cola actual al nuevo cliente
  socket.emit('cola-actualizada', preguntasQueue);

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});
