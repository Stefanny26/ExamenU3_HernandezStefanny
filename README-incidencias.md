# 🚨 Sistema de Alertas de Incidencia

## Funcionalidad Implementada

Esta rama (`feature/alerta-incidencia`) implementa el **Sistema de Alertas de Incidencia Simple** como se especifica en el punto 3 del examen.

### 📋 Descripción

- **Estudiantes** pueden reportar problemas en equipos del laboratorio
- **Jefes de Laboratorio** reciben alertas en tiempo real cuando se reporta una incidencia
- Sistema de **mensajería dirigida** a roles específicos usando Socket.io

### ✨ Características

#### Para Estudiantes:
- Botón "Reportar Problema" 
- Selección de equipo (PC-01 a PC-12, Proyectores, Impresora)
- Descripción opcional del problema
- Confirmación inmediata del reporte

#### Para Jefes de Laboratorio:
- Recepción de alertas en tiempo real
- Mensaje: "Se ha reportado una incidencia en el equipo PC-XX"
- Lista de todas las incidencias reportadas
- Información del reportante (nombre, avatar, timestamp)

### 🔧 Concepto Técnico Implementado

**Mensajería dirigida a roles específicos:**
```javascript
// Enviar solo a jefes de laboratorio conectados
connectedUsers.forEach((userData, socketId) => {
  if (userData.role === ROLES.JEFE_LABORATORIO) {
    io.to(socketId).emit('nueva-incidencia', data);
  }
});
```

### 🎯 Cómo Usar

1. **Autenticarse** con GitHub (cualquier cuenta)
2. **Acceder** a `/dashboard-incidencias.html`
3. **Seleccionar rol**:
   - **Estudiante**: Para reportar incidencias
   - **Jefe de Laboratorio**: Para recibir alertas

4. **Como Estudiante**:
   - Seleccionar equipo con problema
   - Escribir descripción (opcional)
   - Hacer clic en "🚨 Reportar Problema"

5. **Como Jefe de Laboratorio**:
   - Ver alertas en tiempo real
   - Recibir notificaciones del navegador
   - Monitorear todas las incidencias

### 🧪 Testing

Para probar la funcionalidad:

1. **Abrir dos ventanas** del navegador
2. **Ventana 1**: Autenticarse y seleccionar rol "Estudiante"
3. **Ventana 2**: Autenticarse y seleccionar rol "Jefe de Laboratorio"
4. **En Ventana 1**: Reportar una incidencia
5. **En Ventana 2**: Verificar que aparece la alerta inmediatamente

### 📁 Archivos Modificados/Añadidos

```
├── server.js                           # ✏️ Modificado - Añadidas rutas y lógica Socket.io
├── public/dashboard-incidencias.html   # ➕ Nuevo - Interfaz completa del sistema
├── public/index.html                   # ✏️ Modificado - Enlace al sistema de incidencias
└── README-incidencias.md               # ➕ Nuevo - Esta documentación
```

### 🚀 Endpoints Añadidos

| Método | Endpoint | Descripción | Rol Requerido |
|--------|----------|-------------|---------------|
| POST | `/api/reportar-incidencia` | Reportar nueva incidencia | Cualquiera |
| GET | `/api/incidencias` | Obtener todas las incidencias | Cualquiera |
| POST | `/api/cambiar-rol` | Cambiar rol del usuario | Cualquiera |
| GET | `/dashboard-incidencias.html` | Página del sistema | Autenticado |

### 🔄 Eventos Socket.io

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `asignar-rol` | Cliente → Servidor | Usuario selecciona su rol |
| `nueva-incidencia` | Servidor → Jefe Lab | Nueva incidencia reportada |
| `incidencias-existentes` | Servidor → Jefe Lab | Incidencias al conectarse |

### 🎨 Interfaz

- **Diseño responsivo** y moderno
- **Selección de rol** al inicio
- **Formulario intuitivo** para reportes
- **Alertas visuales** en tiempo real
- **Notificaciones del navegador** para jefes de laboratorio
- **Animaciones** para nuevas alertas

### 🔒 Seguridad

- Autenticación JWT requerida
- Validación de datos de entrada
- Roles manejados en el servidor
- Mensajes dirigidos solo a roles autorizados

### 🌟 Funcionalidades Extra

- **Notificaciones push** del navegador
- **Persistencia** de incidencias en memoria
- **Timestamps** de todas las incidencias
- **Información del reportante** incluida
- **Interfaz dual** (estudiante/supervisor) en una sola página

---

**Nota**: Esta implementación es completamente local y no afecta la rama principal que ya está lista para el despliegue del examen original.
