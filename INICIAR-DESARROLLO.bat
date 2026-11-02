@echo off
title DREADBOUND - desarrollo
cd /d "%~dp0"
where node >nul 2>nul || (echo No se encuentra Node.js. Instalalo desde https://nodejs.org & pause & exit /b 1)
if not exist node_modules (
  echo Instalando dependencias, solo la primera vez...
  call npm install
)
start "" http://localhost:5173
call npm run dev
pause
