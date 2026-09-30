# Lista de evidencias para la entrega

Marca cada punto cuando tengas la captura (o el enlace).

## Enlaces
- [ ] Repositorio GitHub: `https://github.com/OWNER/REPO`
- [ ] URL pública de la SPA (S3 Frontend)
- [ ] URL pública de FastAPI: `http://IP-PUBLICA/docs`

## Infraestructura AWS
- [ ] **EC2:** instancia en ejecución (ID, IP pública, Security Group, IAM Role asociado)
- [ ] **RDS:** instancia disponible (motor PostgreSQL, endpoint, Security Group)
- [ ] **S3 Frontend:** objetos = solo `index.html` y `assets/` (contenido de `dist/`)
- [ ] **S3 Videos:** archivos `.mp4`
- [ ] **S3 Miniaturas:** archivos `.jpg/.jpeg/.png`
- [ ] **IAM:** rol de la EC2 y rol de GitHub (OIDC)
- [ ] **GitHub Actions:** ejecución verde de `deploy.yml` (PR sin despliegue y push a `main` con despliegue)

## Funcionamiento de la aplicación
- [ ] Registro de usuario (nombre, correo, contraseña)
- [ ] Inicio de sesión
- [ ] Catálogo de videos (miniatura, título, usuario, vistas, fecha)
- [ ] Reproducción de un video
- [ ] Comentarios (listar y publicar)
- [ ] Videos recomendados
- [ ] Perfil del usuario (datos, cantidad de videos, lista)
- [ ] Publicación de un video
- [ ] Edición de un video
- [ ] Eliminación de un video
- [ ] Tema claro y oscuro

## Guion sugerido para el video explicativo (5–8 min)
1. Arquitectura: SPA en S3 → FastAPI en EC2 → RDS y buckets S3 (mostrar el diagrama del README).
2. Consola AWS: EC2, RDS, los 3 buckets, Security Groups, IAM Role.
3. `/docs` de FastAPI: los endpoints mínimos.
4. Demo: registro → login → publicar video → catálogo → reproducir → comentar → recomendados.
5. Perfil: editar y eliminar un video; comprobar el cambio en S3.
6. Código: estructura del backend (`crud/`, `database/`, `models/`, `routers/`, `schemas/`) y del frontend (Atomic Design).
7. CI/CD: mostrar `deploy.yml` y una ejecución en GitHub Actions (OIDC, sin claves).
8. Tema claro/oscuro.
