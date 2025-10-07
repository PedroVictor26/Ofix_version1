@echo off
echo Starting OFIX Development Environment...
echo.

echo Starting Backend...
cd ofix-backend
start cmd /k "npm run dev"
cd ..

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend...
start cmd /k "npm run dev"

echo.
echo Development environment started!
echo Backend: http://localhost:1000
echo Frontend: http://localhost:5174
echo.
pause