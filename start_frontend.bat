@echo off
title KNOWLEDGE BRIDGE AI - Frontend Web App
echo ========================================================
echo  KNOWLEDGE BRIDGE AI - Starting React + Vite Frontend
echo  Port: 5173 | URL: http://localhost:5173
echo ========================================================
cd /d "%~dp0frontend"
set "PATH=C:\Windows\System32;C:\Windows;%PATH%"
npm.cmd run dev
pause

