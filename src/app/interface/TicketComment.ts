import { Ticket } from "./Ticket";
import { Usuario } from "./Usuario";

export interface TicketComment {
  id?: number;
  ticket: Ticket;
  author?: Usuario;
  message?: string;
  createdAt?: string; // LocalDateTime en formato ISO
}

