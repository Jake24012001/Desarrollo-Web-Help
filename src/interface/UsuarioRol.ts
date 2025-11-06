import { Rol } from "./Rol";
import { Usuario } from "./Usuario";
import { UsuarioRolId } from "./UsuarioRolId";

export interface UsuarioRol {
  id: UsuarioRolId;
  usuario: Usuario;
  rol: Rol;
}

