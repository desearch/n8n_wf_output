@echo off
setlocal EnableDelayedExpansion
set N8N_BASE_URL=http://localhost:5678
set API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjYxMzEzMS04MDkzLTQzNTItODU3Yy1iNmFiNWUyYjA4YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ1Nzg1MDA1LCJleHAiOjE3NDgzMTg0MDB9.HD0cBJS9iEU4XZD3iVqJn_AkFJTRbXC98vK_DD0bDmI

echo Creating workflow...
for /f "tokens=*" %%i in ('curl -s -X POST "%N8N_BASE_URL%/api/v1/workflows" ^
  -H "X-N8N-API-KEY: %API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d @workflow.json') do set RESPONSE=%%i

echo !RESPONSE! | findstr /C:"\"id\":" > nul
if !errorlevel! equ 0 (
    for /f "tokens=2 delims=:" %%a in ('echo !RESPONSE! ^| findstr /C:"\"id\":"') do (
        for /f "tokens=1 delims=," %%b in ("%%a") do (
            set WORKFLOW_ID=%%~b
            set WORKFLOW_ID=!WORKFLOW_ID:"=!
            echo Workflow created with ID: !WORKFLOW_ID!
        )
    )
) else (
    echo Failed to create workflow
    echo !RESPONSE!
    exit /b 1
)

echo.
echo Activating workflow...
curl -X POST "%N8N_BASE_URL%/api/v1/workflows/!WORKFLOW_ID!/activate" ^
  -H "X-N8N-API-KEY: %API_KEY%"

timeout /t 2

echo.
echo Testing webhook...
curl -X POST "%N8N_BASE_URL%/webhook/echo-test" ^
  -H "Content-Type: application/json" ^
  -d "{\"testMessage\":\"Hello from batch script!\"}" 