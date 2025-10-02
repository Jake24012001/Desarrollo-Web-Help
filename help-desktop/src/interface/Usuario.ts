import { UnidadAdministrativa } from "./UnidadAdministrativa";

export interface Usuario {
  idUsuario?: number;
  apellidos?: string;
  cedula?: string;
  celular?: string;
  direccion?: string;
  email?: string;
  estado: boolean;
  fechaNacimiento?: string; 
  nombres?: string;
  clave: string;
  telefono?: string;
  nombre: string;
  unidadAdministrativa: UnidadAdministrativa;
  equipos?: string[]; 
}