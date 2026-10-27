@echo off
title AgendaTribu Sync Server
cd /d "%~dp0"
echo Arrancando AgendaTribu Sync en localhost:8780 ...
echo Deja esta ventana abierta mientras el servidor trabaja.
node.exe server.js
pause
