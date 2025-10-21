# 🚀 Como Testar - Guia Rápido

## ⚡ Instalação Rápida (Windows)

### Opção 1: Script Automático
```bash
# Clique duas vezes no arquivo:
instalar-testes.bat
```

### Opção 2: Manual
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

## 🧪 Executar Testes

### Opção 1: Script Interativo (Windows)
```bash
# Clique duas vezes no arquivo:
rodar-testes.bat
```

### Opção 2: Comandos Diretos

```bash
# Rodar todos os testes (modo watch - recomendado)
npm test

# Rodar testes uma vez
npm run test:run

# Interface visual (muito legal! 🎨)
npm run test:ui

# Ver cobertura de código
npm run test:coverage
```

## 📊 O Que Foi Testado

### ✅ 70+ Testes Implementados

1. **Logger** (15 testes)
   - Logging estruturado
   - Rate limiting
   - Fila de logs
   - Envio para servidor

2. **MessageValidator** (35+ testes)
   - Validação de mensagens
   - Sanitização XSS
   - CPF, CNPJ, telefone, email, placa
   - Detecção de SQL injection

3. **useAuthHeaders** (20+ testes)
   - Autenticação
   - Verificação de token
   - Expiração
   - Headers

## 🎯 Resultado Esperado

Quando rodar `npm test`, você deve ver:

```
✓ src/utils/__tests__/logger.test.js (15)
✓ src/utils/__tests__/messageValidator.test.js (35)
✓ src/hooks/__tests__/useAuthHeaders.test.js (20)

Test Files  3 passed (3)
Tests  70 passed (70)
```

## 🐛 Problemas?

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "vitest: command not found"
```bash
npm install -D vitest
```

### Testes não rodam
1. Verifique se `vitest.config.js` existe
2. Verifique se `src/test/setup.js` existe
3. Rode: `npm install`

## 📖 Documentação Completa

Para mais detalhes, veja: **GUIA_TESTES.md**

## 🎉 Próximos Passos

Após confirmar que os testes passam:

1. ✅ Infraestrutura de testes configurada
2. ✅ Logger, Validator e AuthHeaders testados
3. 🔄 Continuar com Task 4 (useChatAPI)
4. 🔄 Continuar com Task 5 (useChatHistory)
5. 🔄 Implementar novas funcionalidades

---

**Dica:** Use `npm run test:ui` para uma experiência visual incrível! 🚀
