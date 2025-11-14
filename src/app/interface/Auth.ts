export interface LoginRequest {
  email: string;
  clave: string;
}

export interface LoginResponse {
  idUsuario?: number;
  email: string;
  nombres: string;
  apellidos: string;
  estado: boolean;
  token?: string;
  roles?: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  usuario?: LoginResponse;
}
