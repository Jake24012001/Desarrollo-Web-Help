export interface Peticion {
  id: number;
  fechaEntrega: Date;
  descripcion: string;
  recibidoPor: string;
  departamento: string;
  elaboradoPor: string;
  tipo: string;
  estado: 'Pendiente' | 'Resuelto' | 'Disponible' | 'En proceso' | 'Terminado' | 'No disponible';
  tiempoFinalizado?: string;
}