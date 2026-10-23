# Seguridad · gh-ergonomia (web)

Checklist de la skill: `~/.claude/skills/nueva-webapp/references/10-seguridad.md`.

- Login de Google (GIS); el backend valida `iss`, `aud`, `email_verified`, `exp` y la lista blanca `EQUIPO`. Sin tokens en la URL.
- El repo público no contiene datos de clientes (`.gitignore` en modo lista blanca: solo frontend y plantillas vacías).
- Escritura en Drive solo en la carpeta de datos propia y en `1. INFORMES` (rutas por nombre, sin `..`; solo .xlsx/.docx/.pdf con firma verificada); escrituras idempotentes por `requestId`; borrar mueve a `papelera`.
- CSP básica en el HTML (`object-src 'none'; base-uri 'self'; form-action 'self'`). GitHub Pages no permite cabeceras (sin `frame-ancestors`).
- Datos de usuario por `esc()` antes de `innerHTML`.
