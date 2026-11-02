@echo off
title DREADBOUND
cd /d "%~dp0"
where node >nul 2>nul || (echo No se encuentra Node.js. Instalalo desde https://nodejs.org & pause & exit /b 1)
if not exist dist\index.html (
  echo Compilando el juego por primera vez...
  if not exist node_modules call npm install
  call npm run build
)
start "" http://localhost:4173
node scripts\serve.mjs
pause
