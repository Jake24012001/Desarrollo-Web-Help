export interface Ticket {
  id_ticket?: number;
  title: string;
  descripcion: string;
  status?: {
    id_status?: number;
    nombre?: string;
  };
  priority?: {
    id_priority?: number;
    name?: string;
    resolutionTimeHours?: number;
  };
  // Backend devuelve camelCase (idUsuario) pero también soportamos snake_case
  usuario_creador?: {
    idUsuario?: number;
    id_usuario?: number;
    nombres?: string;
    apellidos?: string;
    nombre?: string;
    email?: string;
  };
  usuario_asignado?: {
    idUsuario?: number;
    id_usuario?: number;
    nombres?: string;
    apellidos?: string;
    nombre?: string;
    email?: string;
  };
  usuario_asigno?: {
    idUsuario?: number;
    id_usuario?: number;
    nombres?: string;
    apellidos?: string;
    nombre?: string;
    email?: string;
  };
  equipoAfectado?: {
    id?: number;
    serial?: string;
    product?: {
      id?: number;
      name?: string;
      brand?: string;
      model?: string;
    };
  };
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_cierre?: string;
  tiempoRestante?: string;
  rating?: number;
}