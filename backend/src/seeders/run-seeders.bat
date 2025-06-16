@echo off
echo Ejecutando seeders para el sistema de agenda...

cd ..\..
node src/seeders/index.js

echo.
echo Proceso completado. Presiona cualquier tecla para cerrar...
pause > nul
