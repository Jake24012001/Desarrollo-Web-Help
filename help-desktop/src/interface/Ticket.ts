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
  };
  usuario_creador?: {
    id_usuario?: number;
    nombre?: string;
  };
  usuario_asignado?: {
    id_usuario?: number;
    nombre?: string;
  };
  equipoAfectado?: {
    id?: number;
    serial?: string;
    product?: {
      id?: number;
      name?: string;
    };
  };
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_cierre?: string;

  tiempoRestante?: string;

}