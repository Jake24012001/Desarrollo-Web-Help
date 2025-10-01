import { UnidadAdministrativa } from "./UnidadAdministrativa";

export interface Usuario {
  idUsuario?: number; // opcional si es generado automáticamente
  apellidos?: string;
  cedula?: string;
  celular?: string;
  direccion?: string;
  email?: string;
  estado: boolean;
  fechaNacimiento?: string; // se usa string para fechas ISO en JSON
  nombres?: string;
  clave: string;
  telefono?: string;
  nombre: string;
  unidadAdministrativa: UnidadAdministrativa;
}