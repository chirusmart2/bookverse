@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM BookVerse one-click launcher.
REM This file can be placed either in the project root or on the Desktop.

set "ROOT=%~dp0"

REM If the launcher is on the Desktop, locate the user's BookVerse project.
if not exist "%ROOT%run.py" (
  if exist "%ROOT%chiru\2026-25\book-store-master\run.py" set "ROOT=%ROOT%chiru\2026-25\book-store-master\"
)
if not exist "%ROOT%run.py" (
  if exist "%USERPROFILE%\OneDrive\Desktop\chiru\2026-25\book-store-master\run.py" set "ROOT=%USERPROFILE%\OneDrive\Desktop\chiru\2026-25\book-store-master\"
)
if not exist "%ROOT%run.py" (
  if exist "%USERPROFILE%\Desktop\chiru\2026-25\book-store-master\run.py" set "ROOT=%USERPROFILE%\Desktop\chiru\2026-25\book-store-master\"
)

if not exist "%ROOT%run.py" (
  echo ERROR: BookVerse project was not found.
  echo.
  echo Expected project folder:
  echo %USERPROFILE%\OneDrive\Desktop\chiru\2026-25\book-store-master
  echo.
  echo Put this launcher on the Desktop or inside the BookVerse project folder.
  pause
  exit /b 1
)

cd /d "%ROOT%"
set "PYTHON=%ROOT%.venv\Scripts\python.exe"

echo Starting BookVerse from:
echo %ROOT%
echo.

if not exist "%PYTHON%" (
  echo Creating Python virtual environment...
  py -m venv "%ROOT%.venv"
  if errorlevel 1 (
    echo ERROR: Python could not create the .venv folder.
    pause
    exit /b 1
  )
)

if not exist "%ROOT%requirements.txt" (
  echo ERROR: requirements.txt was not found in the project root.
  pause
  exit /b 1
)

if not exist "%ROOT%.venv\Scripts\flask.exe" (
  echo Installing backend packages for the first run...
  "%PYTHON%" -m pip install -r "%ROOT%requirements.txt"
  if errorlevel 1 (
    echo Backend package installation failed.
    pause
    exit /b 1
  )
)

if not exist "%ROOT%frontend\landing\node_modules" (
  echo Installing landing-page packages for the first run...
  pushd "%ROOT%frontend\landing"
  call npm install
  popd
)
if not exist "%ROOT%frontend\seller-portal\node_modules" (
  echo Installing seller-portal packages for the first run...
  pushd "%ROOT%frontend\seller-portal"
  call npm install
  popd
)
if not exist "%ROOT%frontend\buyer-portal\node_modules" (
  echo Installing buyer-portal packages for the first run...
  pushd "%ROOT%frontend\buyer-portal"
  call npm install
  popd
)

echo Starting BookVerse services...

netstat -ano | findstr /R /C:":5000 .*LISTENING" >nul
if errorlevel 1 start "BookVerse API" /D "%ROOT%" cmd /k ""%PYTHON%" run.py"

netstat -ano | findstr /R /C:":5172 .*LISTENING" >nul
if errorlevel 1 start "BookVerse Landing" /D "%ROOT%frontend\landing" cmd /k "npm run dev -- --host 127.0.0.1 --port 5172"

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul
if errorlevel 1 start "BookVerse Seller" /D "%ROOT%frontend\seller-portal" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"

netstat -ano | findstr /R /C:":5174 .*LISTENING" >nul
if errorlevel 1 start "BookVerse Buyer" /D "%ROOT%frontend\buyer-portal" cmd /k "npm run dev -- --host 127.0.0.1 --port 5174"

timeout /t 8 /nobreak >nul
start "" "http://localhost:5172"

echo.
echo BookVerse is opening at http://localhost:5172
echo Keep the service windows open while using the project.
endlocal
exit /b 0
