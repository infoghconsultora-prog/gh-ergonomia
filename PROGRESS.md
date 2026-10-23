# PROGRESS · gh-ergonomia (frontend)

Estado al 2026-10-23.

- Publicado: https://infoghconsultora-prog.github.io/gh-ergonomia/ (repo público `infoghconsultora-prog/gh-ergonomia`, solo frontend; `.gitignore` en lista blanca).
- `js/backend.js`: login de Google y POST con `idToken` al `/exec`. `api()` de `js/app.js` mantiene las rutas del servidor local y las traduce a acciones. "Abrir en Finder" pasó a "Abrir en Drive".
- Guardado automático serializado (un PUT a la vez) por la latencia de Apps Script.
- Sin datos de clientes en el repo (empresas semilla en el backend; placeholders genéricos).
- No hay Service Worker.

## Qué falta
- Poner `BACKEND_URL` real en `js/backend.js` cuando se despliegue `gh-ergonomia-backend`, y subir.
- Prueba de punta a punta con login real (Felipe), sobre todo informes con muchas fotos (tamaño del POST).
