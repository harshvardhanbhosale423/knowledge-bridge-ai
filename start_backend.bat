@echo off
title KNOWLEDGE BRIDGE AI - Backend API
echo ========================================================
echo  KNOWLEDGE BRIDGE AI - Starting FastAPI Backend Server
echo  Port: 8000 | URL: http://127.0.0.1:8000
echo ========================================================
cd /d "%~dp0"
set "PATH=C:\Windows\System32;C:\Windows;%PATH%"
".\backend\python_env\python.exe" run_backend.py
pause

