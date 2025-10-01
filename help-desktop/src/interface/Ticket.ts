import { InventoryUnit } from "./InventoryUnit";
import { TicketPriority } from "./TicketPriority";
import { TicketStatus } from "./TicketStatus";
import { Usuario } from "./Usuario";

export interface Ticket {
  id_ticket?: number;
  title: string;
  descripcion?: string;
  status: TicketStatus;
  priority?: TicketPriority;
  usuario_creador: Usuario;
  usuario_asignado?: Usuario;
  equipoAfectado?: InventoryUnit;
  fecha_creacion?: string;       // ISO string (LocalDateTime)
  fecha_actualizacion?: string;
  fecha_cierre?: string;
}

