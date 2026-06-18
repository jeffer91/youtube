# Bloque 05 — Diagnóstico

Objetivo: centralizar el diagnóstico de todos los bloques creados hasta ahora.

Archivos:

- YTDiagnosticRegistry.js
- YTDiagnosticService.js
- YTDiagnosticReport.js
- YTDiagnosticIpc.js
- YTDiagnosticCheck.js
- YTDiagnosticManual.md

Prueba:

1. Ejecutar npm install.
2. Ejecutar npm start.
3. Presionar Diagnóstico.
4. Confirmar que aparezcan bloques 00, 01, 02, 03, 04 y 05.
5. Revisar user_data/logs.
6. Confirmar que se cree un reporte JSON y TXT.

Terminal:

npm run check:diagnostic
npm run diagnostic:all

Aprobación: el diagnóstico responde, incluye Bloque 05 y guarda reportes.
