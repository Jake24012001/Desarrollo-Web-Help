import { Ticket } from "./Ticket";

export interface TicketImage {
  id?: number;
  ticket: Ticket;
  urlImagen: string;
  descripcion?: string;
  createdAt?: string;
}
