# PROGRESS · gh-ergonomia (frontend)

Estado al 2026-10-23.

- Publicado: https://infoghconsultora-prog.github.io/gh-ergonomia/ (repo público `infoghconsultora-prog/gh-ergonomia`, solo frontend; `.gitignore` en lista blanca).
- `js/backend.js`: login de Google y POST con `idToken` al `/exec`. `api()` de `js/app.js` mantiene las rutas del servidor local y las traduce a acciones. "Abrir en Finder" pasó a "Abrir en Drive".
- Guardado automático serializado (un PUT a la vez) por la latencia de Apps Script.
- Sin datos de clientes en el repo (empresas semilla en el backend; placeholders genéricos).
- No hay Service Worker.

- `BACKEND_URL` apunta al /exec de gh-ergonomia-backend (desplegado v1).

## Qué falta
- Prueba de punta a punta con login real (Felipe), sobre todo informes con muchas fotos (tamaño del POST).

## 2026-10-23 · Marca unificada
- Íconos (`icons/`, `apple-touch-icon.png`) y `manifest.webmanifest`; `.gitignore` los deja pasar. Ícono = persona + insignia GH, igual al de GH TOOLS.
- Login igual al de las demás apps; logo de la barra más grande (34 px). Solo marcado y estilos.
