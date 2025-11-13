# Endpoint de Autenticación - Backend Spring Boot

## Controller: AuthController.java

```java
package com.example.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.models.Usuario;
import com.example.service.IUsuarioService;
import com.example.service.IUsuarioRolService;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private IUsuarioService usuarioService;

    @Autowired
    private IUsuarioRolService usuarioRolService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Buscar usuario por cédula
            Usuario usuario = usuarioService.findByCedula(loginRequest.getCedula());

            if (usuario == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Usuario no encontrado"));
            }

            // Verificar contraseña (en producción usar BCrypt)
            if (!usuario.getClave().equals(loginRequest.getClave())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Contraseña incorrecta"));
            }

            // Verificar si está activo
            if (!usuario.getEstado()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("Usuario inactivo"));
            }

            // Obtener rol del usuario
            String rol = usuarioRolService.getRolByUsuarioId(usuario.getIdUsuario());

            // Crear respuesta
            Map<String, Object> response = new HashMap<>();
            response.put("usuario", usuario);
            response.put("rol", rol != null ? rol : "CLIENTE");
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error en el servidor: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}

// Clase auxiliar para la petición
class LoginRequest {
    private String cedula;
    private String clave;

    public String getCedula() {
        return cedula;
    }

    public void setCedula(String cedula) {
        this.cedula = cedula;
    }

    public String getClave() {
        return clave;
    }

    public void setClave(String clave) {
        this.clave = clave;
    }
}
```

## Service: IUsuarioService.java (agregar método)

```java
public interface IUsuarioService {
    // Métodos existentes...
    List<Usuario> getAll();
    Optional<Usuario> findById(Integer id);
    Usuario create(Usuario usuario);
    Usuario update(Integer id, Usuario usuario);
    void delete(Integer id);
    
    // Nuevo método para login
    Usuario findByCedula(String cedula);
}
```

## Service Implementation: UsuarioServiceImpl.java

```java
@Override
public Usuario findByCedula(String cedula) {
    return usuarioRepository.findByCedula(cedula);
}
```

## Repository: UsuarioRepository.java (agregar método)

```java
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Usuario findByCedula(String cedula);
}
```

## Service: IUsuarioRolService.java (agregar método)

```java
public interface IUsuarioRolService {
    // Métodos existentes...
    List<UsuarioRol> getAll();
    Optional<UsuarioRol> findById(Integer idUsuario, Integer idRol);
    
    // Nuevo método para obtener rol
    String getRolByUsuarioId(Integer idUsuario);
}
```

## Service Implementation: UsuarioRolServiceImpl.java

```java
@Override
public String getRolByUsuarioId(Integer idUsuario) {
    List<UsuarioRol> roles = usuarioRolRepository.findByIdIdUsuario(idUsuario);
    
    if (roles == null || roles.isEmpty()) {
        return "CLIENTE"; // Rol por defecto
    }
    
    // Buscar si tiene rol de administrador
    for (UsuarioRol ur : roles) {
        if (ur.getRol().getNombre().equalsIgnoreCase("Administrador") ||
            ur.getRol().getIdRol() == 1) {
            return "ADMIN";
        }
    }
    
    return "CLIENTE";
}
```

## Repository: UsuarioRolRepository.java (agregar método)

```java
public interface UsuarioRolRepository extends JpaRepository<UsuarioRol, UsuarioRolId> {
    List<UsuarioRol> findByIdIdUsuario(Integer idUsuario);
}
```

---

## Pasos para implementar:

1. Crear el AuthController con el endpoint `/api/auth/login`
2. Agregar el método `findByCedula` en UsuarioService
3. Agregar el método `getRolByUsuarioId` en UsuarioRolService
4. Reiniciar el backend

## Prueba con Postman:

```json
POST http://localhost:8090/api/auth/login
Content-Type: application/json

{
  "cedula": "1234567890",
  "clave": "password123"
}
```

Respuesta exitosa:
```json
{
  "usuario": {
    "idUsuario": 1,
    "nombre": "Juan Pérez",
    "cedula": "1234567890",
    "email": "juan@example.com",
    // ... otros campos
  },
  "rol": "ADMIN"
}
```
