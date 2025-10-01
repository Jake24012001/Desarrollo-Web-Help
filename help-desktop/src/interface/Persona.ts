import { UnidadAdministrativa } from "./UnidadAdministrativa";

export interface Persona {
  idPersona?: number;
  adjetivo?: string;
  apellidos?: string;
  cedula?: string;
  ciudad?: string;
  correo?: string;
  direccion?: string;
  nombres?: string;
  profesion?: string;
  puesto?: string;
  telefono?: string;
  unidadAdministrativa?: UnidadAdministrativa;
}

