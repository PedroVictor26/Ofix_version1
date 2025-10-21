@echo off
echo ========================================
echo TESTE DE ENDPOINTS DO AGNO AI
echo ========================================
echo.

set AGNO_URL=https://matias-agno-assistant.onrender.com

echo 1. Testando raiz (GET)...
curl -X GET %AGNO_URL%/
echo.
echo.

echo 2. Testando /agents/oficinaia/runs (POST)...
curl -X POST %AGNO_URL%/agents/oficinaia/runs -H "Content-Type: application/json" -d "{\"message\":\"teste\",\"user_id\":\"test\"}"
echo.
echo.

echo 3. Testando /chat (POST)...
curl -X POST %AGNO_URL%/chat -H "Content-Type: application/json" -d "{\"message\":\"teste\"}"
echo.
echo.

echo 4. Testando /api/chat (POST)...
curl -X POST %AGNO_URL%/api/chat -H "Content-Type: application/json" -d "{\"message\":\"teste\"}"
echo.
echo.

echo 5. Testando /run (POST)...
curl -X POST %AGNO_URL%/run -H "Content-Type: application/json" -d "{\"message\":\"teste\"}"
echo.
echo.

echo ========================================
echo TESTES CONCLUIDOS
echo ========================================
pause
