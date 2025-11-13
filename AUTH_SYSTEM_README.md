# Sistema de Autenticación - Help Desk

## 📋 Descripción

Sistema completo de autenticación con roles para diferenciar entre **Administradores** y **Clientes**.

### Características:

✅ **Login con cédula y contraseña**  
✅ **Dos tipos de usuarios:**
   - **Administrador**: Acceso completo al sistema (crear, editar, eliminar tickets, gestionar usuarios, etc.)
   - **Cliente**: Solo puede crear tickets y calificar el servicio recibido

✅ **Guards de seguridad** para proteger rutas según el rol  
✅ **Sesión persistente** con localStorage  
✅ **Vista específica para clientes** con funcionalidades limitadas

---

## 🚀 Rutas del Sistema

| Ruta | Componente | Acceso | Descripción |
|------|-----------|--------|-------------|
| `/login` | LoginComponent | Público | Pantalla de inicio de sesión |
| `/cliente` | ClientTicketComponent | Solo Clientes | Portal del cliente (crear tickets y calificar) |
| `/help-menu` | VistaPrincipal | Solo Admin | Dashboard principal del admin |
| `/peticion` | VentanaPeticion | Solo Admin | Crear nuevo ticket (admin) |
| `/actualizar/:id` | ActualizarPeticion | Solo Admin | Actualizar ticket existente |

---

## 👤 Tipos de Usuario

### Administrador
- Ve todos los tickets del sistema
- Puede crear, editar y eliminar tickets
- Puede asignar tickets a otros usuarios
- Gestiona equipos e inventario
- Acceso completo a todas las funcionalidades

### Cliente
- Solo ve sus propios tickets
- Puede crear nuevos tickets
- Selecciona equipos de los cuales es custodio
- Puede calificar tickets cerrados
- No puede editar o eliminar tickets

---

## 🔐 Flujo de Autenticación

1. Usuario ingresa cédula y contraseña en `/login`
2. El sistema consulta el backend (`POST /api/auth/login`)
3. Backend verifica credenciales y devuelve usuario + rol
4. Frontend guarda la sesión en localStorage
5. Redirección automática según el rol:
   - **Admin** → `/help-menu`
   - **Cliente** → `/cliente`
6. Los guards protegen las rutas según el rol

---

## 📁 Archivos Creados

### Frontend (Angular)

```
src/app/
├── services/
│   └── auth.service.ts              # Servicio de autenticación
├── guards/
│   └── auth.guard.ts                # Guards de seguridad (authGuard, adminGuard, clientGuard)
├── components/
│   ├── login/
│   │   ├── login.ts                 # Componente de login
│   │   ├── login.html               # Template del login
│   │   └── login.css                # Estilos del login
│   └── client-ticket/
│       ├── client-ticket.ts         # Componente para clientes
│       ├── client-ticket.html       # Template del portal cliente
│       └── client-ticket.css        # Estilos del portal cliente
└── app.routes.ts                    # Rutas actualizadas con guards
```

### Backend (Spring Boot)

Ver archivo: `BACKEND_AUTH_SETUP.md` para implementar en el backend.

---

## 🛠️ Uso del Sistema

### Para Clientes:

1. Ingresar con cédula y contraseña
2. Crear nuevos tickets desde el botón "Nuevo Ticket"
3. Seleccionar el equipo afectado (solo equipos donde es custodio)
4. Describir el problema
5. Ver el estado de sus tickets en tiempo real
6. Calificar el servicio cuando un ticket sea cerrado

### Para Administradores:

1. Ingresar con cédula y contraseña de admin
2. Acceso completo al sistema help-desk
3. Ver todos los tickets pendientes y resueltos
4. Asignar tickets a técnicos
5. Actualizar el estado de tickets
6. Gestionar equipos e inventario

---

## 🔧 Configuración

### 1. Backend

Implementa los endpoints según `BACKEND_AUTH_SETUP.md`:
- `POST /api/auth/login` - Autenticación

### 2. Frontend

El sistema ya está configurado y listo para usar.

### 3. Usuarios de Prueba

Asegúrate de tener usuarios en la base de datos con:
- Cédula
- Clave (contraseña)
- Estado activo (`estado: true`)
- Rol asignado en la tabla `usuario_rol`

---

## 🎯 Funcionalidades del Cliente

### ✅ Crear Tickets
- Formulario simplificado
- Solo equipos del usuario
- Prioridad configurable
- Descripción detallada

### ⭐ Calificar Servicio
- Solo tickets cerrados
- Sistema de estrellas (1-5)
- Comentario obligatorio
- Feedback al equipo de soporte

### 📊 Ver Mis Tickets
- Lista de todos sus tickets
- Filtro de búsqueda
- Estados en tiempo real
- Información del técnico asignado

---

## 🔒 Seguridad

- ✅ Guards protegen todas las rutas según rol
- ✅ Sesión persistente en localStorage
- ✅ Verificación de autenticación en cada ruta
- ✅ Logout seguro con confirmación
- ✅ Redirección automática si no está autenticado

---

## 📝 Próximas Mejoras

- [ ] Implementar JWT tokens para mayor seguridad
- [ ] Recuperación de contraseña
- [ ] Notificaciones push cuando cambien los tickets
- [ ] Chat en tiempo real con soporte
- [ ] Historial de calificaciones

---

## 🐛 Resolución de Problemas

### Error: "Cannot find module '@angular/router'"
Ejecuta: `npm install`

### Error: "Cannot find module 'sweetalert2'"
Ejecuta: `npm install sweetalert2`

### No se puede hacer login
Verifica que:
1. El backend esté corriendo en `http://localhost:8090`
2. El endpoint `/api/auth/login` esté implementado
3. El usuario exista en la base de datos

### El guard no funciona
Asegúrate de que:
1. El `AuthService` esté importado correctamente
2. La sesión se guarde en localStorage
3. Los guards estén aplicados en las rutas

---

## 📞 Soporte

Para más información, revisa:
- `BACKEND_AUTH_SETUP.md` - Configuración del backend
- Código fuente de los componentes
- Consola del navegador para errores

---

**¡Sistema listo para usar!** 🎉
