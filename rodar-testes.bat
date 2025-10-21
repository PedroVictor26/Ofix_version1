@echo off
echo ========================================
echo  Executando Testes
echo ========================================
echo.

:menu
echo Escolha uma opcao:
echo.
echo 1. Rodar todos os testes (modo watch)
echo 2. Rodar testes uma vez
echo 3. Rodar testes com interface visual
echo 4. Rodar testes com cobertura
echo 5. Rodar apenas testes do logger
echo 6. Rodar apenas testes do messageValidator
echo 7. Rodar apenas testes do useAuthHeaders
echo 8. Sair
echo.

set /p opcao="Digite o numero da opcao: "

if "%opcao%"=="1" (
    echo.
    echo Rodando testes em modo watch...
    call npm test
    goto fim
)

if "%opcao%"=="2" (
    echo.
    echo Rodando testes uma vez...
    call npm run test:run
    goto fim
)

if "%opcao%"=="3" (
    echo.
    echo Abrindo interface visual...
    echo Acesse: http://localhost:51204/__vitest__/
    call npm run test:ui
    goto fim
)

if "%opcao%"=="4" (
    echo.
    echo Rodando testes com cobertura...
    call npm run test:coverage
    goto fim
)

if "%opcao%"=="5" (
    echo.
    echo Rodando testes do logger...
    call npm test logger
    goto fim
)

if "%opcao%"=="6" (
    echo.
    echo Rodando testes do messageValidator...
    call npm test messageValidator
    goto fim
)

if "%opcao%"=="7" (
    echo.
    echo Rodando testes do useAuthHeaders...
    call npm test useAuthHeaders
    goto fim
)

if "%opcao%"=="8" (
    goto fim
)

echo Opcao invalida!
echo.
goto menu

:fim
echo.
echo ========================================
pause
