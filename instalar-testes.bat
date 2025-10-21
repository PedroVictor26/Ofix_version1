@echo off
echo ========================================
echo  Instalando Dependencias de Teste
echo ========================================
echo.

echo [1/3] Instalando Vitest e dependencias...
call npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom

echo.
echo [2/3] Verificando arquivos de configuracao...
if exist "vitest.config.js" (
    echo ✓ vitest.config.js encontrado
) else (
    echo ✗ vitest.config.js NAO encontrado
)

if exist "src\test\setup.js" (
    echo ✓ src\test\setup.js encontrado
) else (
    echo ✗ src\test\setup.js NAO encontrado
)

echo.
echo [3/3] Instalacao concluida!
echo.
echo ========================================
echo  Como testar:
echo ========================================
echo.
echo  npm test              - Rodar testes (modo watch)
echo  npm run test:run      - Rodar testes uma vez
echo  npm run test:ui       - Interface visual
echo  npm run test:coverage - Cobertura de codigo
echo.
echo ========================================
pause
