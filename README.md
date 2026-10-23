# Ergonomía · GH

Informes de ergonomía: Protocolo de Ergonomía de la Res. SRT 886/15 (planillas 1 a 4) con evaluación de riesgos por método REBA.

Página: https://infoghconsultora-prog.github.io/gh-ergonomia/ — se entra con la cuenta de Google del equipo.

## Cómo está armado
- **Frontend** (este repo, público): la app, el motor REBA, los generadores de Word/Excel (en el navegador) y las plantillas oficiales (`plantillas/`, formularios vacíos).
- **Backend** (Apps Script en la cuenta info.ghconsultora, carpeta local `gh-ergonomia-backend`, privado): valida el token de Google contra la lista del equipo, guarda cada informe como JSON en Drive (carpeta `GH Ergonomía (datos web)`, con historial de versiones de Drive) y escribe los Word/Excel en `3 GH MEDICIONES/1. INFORMES`.
- Este repo **no tiene datos de clientes**: empresas, informes y fotos viven en Drive.

## Flujo
1. **Nuevo informe**: empresa (autocompleta las ya usadas), fecha, profesional y cantidad de puestos con su área.
2. **Por puesto**: Identificación (Planilla 1), Evaluación inicial (Planilla 2, A a I), método REBA (opciones, ángulos o medición sobre foto), Medidas (Planillas 3 y 4).
3. **Resumen de riesgos** y **Exportar** (descarga o directo a una carpeta de `1. INFORMES`): informe en Word, planillas 886/15 en Excel, REBA en Excel.

## Cómo se pasa de la Planilla 2 al nivel de riesgo
- Paso 1 todo NO, o paso 2 todo NO → nivel 1 (tolerable).
- Pregunta crítica del paso 1 en SI (cargas > 25 kg, empuje > 34 kgf) o Borg > 7 → nivel 3.
- Algún SI en el paso 2 → se usa el REBA de esa tarea (nivel de acción 0–1 → 1, 2 → 2, 3–4 → 3).
- Cualquier nivel se puede fijar a mano tocándolo en la Planilla 1.

## Corrección respecto de la planilla REBA original
En `reba.xls`, las celdas K116 y K120 miraban celdas vacías, así que "movimientos repetitivos" y "cambios posturales" nunca sumaban +1. La app suma las tres, como indica el método, y el Excel que exporta lleva esas dos fórmulas corregidas.

## Correr en la compu
`python3 -m http.server 8797` y abrir http://localhost:8797 (el origen debe estar autorizado en el cliente OAuth para que entre el login).
