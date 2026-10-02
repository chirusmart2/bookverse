@echo off
setlocal
cd /d "%~dp0"

echo Starting BookVerse services...

if not exist "%~dp0.venv\Scripts\python.exe" (
  echo ERROR: Python virtual environment not found at:
  echo %~dp0.venv\Scripts\python.exe
  echo Create it with: py -m venv .venv
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":5000 .*LISTENING" >nul
if errorlevel 1 start "BookVerse API" /D "%~dp0" cmd /k ""%~dp0.venv\Scripts\python.exe" run.py"

netstat -ano | findstr /R /C:":5172 .*LISTENING" >nul
if errorlevel 1 start "BookVerse Landing" /D "%~dp0frontend\landing" cmd /k "npm run dev -- --host 127.0.0.1 --port 5172"

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul
if errorlevel 1 start "BookVerse Seller" /D "%~dp0frontend\seller-portal" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"

netstat -ano | findstr /R /C:":5174 .*LISTENING" >nul
if errorlevel 1 start "BookVerse Buyer" /D "%~dp0frontend\buyer-portal" cmd /k "npm run dev -- --host 127.0.0.1 --port 5174"

timeout /t 8 /nobreak >nul
start "" http://localhost:5172

echo.
echo BookVerse services are starting. Keep the four service windows open while developing.
endlocal
exit /b 0

REM To stop all local BookVerse services, close their four command windows.
