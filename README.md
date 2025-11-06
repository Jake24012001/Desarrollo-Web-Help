# Help Desk - Frontend

Sistema web de gestión de tickets de soporte técnico desarrollado con Angular.

## Descripción

Aplicación frontend para la gestión integral de solicitudes de asistencia técnica. Permite a los usuarios crear, visualizar y gestionar tickets de soporte, facilitando la comunicación entre usuarios finales y el equipo de soporte técnico.

## Tecnologías

- Angular 20.2.0
- TypeScript 5.9.2
- RxJS 7.8.0
- SweetAlert2 11.23.0
- Bootstrap (para estilos)

## Componentes Principales

### Vista Principal
Pantalla principal del sistema que muestra el listado completo de tickets con funcionalidades de:
- Visualización de todos los tickets registrados
- Filtrado y búsqueda de tickets
- Navegación hacia la creación y actualización de tickets
- Actualización automática de datos

### Ventana de Petición
Formulario para la creación de nuevos tickets que incluye:
- Selección de usuario solicitante
- Asignación de prioridad
- Selección de equipo/inventario relacionado
- Descripción detallada del problema

### Actualizar Petición
Interfaz para la gestión y actualización de tickets existentes que permite:
- Modificación de estado del ticket
- Reasignación de técnicos
- Actualización de prioridad
- Registro de soluciones y comentarios

## Servicios

- **TicketService**: Gestión de tickets (CRUD completo)
- **UsuarioService**: Administración de usuarios
- **EquipoService**: Gestión de inventario de equipos
- **UsuarioRolService**: Manejo de roles y permisos
- **TicketPriorityService**: Gestión de prioridades de tickets

## Rutas de Navegación

- `/help-menu`: Vista principal con listado de tickets
- `/peticion`: Formulario de creación de tickets
- `/actualizar/:id`: Actualización de ticket específico

## Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn
- Angular CLI 20.2.1

## Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/Jake24012001/Desarrollo-Web-Help.git
cd Desarrollo-Web-Help
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
Editar el archivo de configuración en `src/app/environments/environment.ts` con la URL del backend.

## Ejecución

### Servidor de Desarrollo
```bash
ng serve
```
Navegar a `http://localhost:4200/`

### Compilación para Producción
```bash
ng build
```
Los archivos compilados se almacenarán en el directorio `dist/`

## Pruebas

### Pruebas Unitarias
```bash
ng test
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── vista-principal/
│   │   ├── ventana-peticion/
│   │   └── actualizar-peticion/
│   ├── services/
│   ├── interface/
│   ├── environments/
│   └── app.routes.ts
└── ...
```

## Funcionalidades

- Autenticación de usuarios
- Creación de tickets de soporte
- Asignación de tickets a técnicos
- Seguimiento de estado de tickets
- Gestión de prioridades
- Historial de tickets
- Notificaciones mediante alertas (SweetAlert2)
- Interfaz responsive

## Configuración del Backend

Esta aplicación requiere conexión con el backend desarrollado en Spring Boot. Configurar la URL base del API en el archivo de entorno correspondiente.

## Licencia

Este proyecto pertenece para uso acádemico para el GAD Municipal de Machala