# ✅ Comando Correto para Instalar

## 🚀 Use este comando:

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

## ❌ O que estava errado:

O pacote `@testing-library/react-hooks` não é compatível com React 18.
No React 18, os hooks são testados diretamente com `@testing-library/react`.

## ✅ Solução:

Removemos `@testing-library/react-hooks` da instalação.
Os testes já estão atualizados para usar a API correta do React 18.

## 📝 Próximos passos:

1. **Instalar as dependências:**
   ```bash
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
   ```

2. **Rodar os testes:**
   ```bash
   npm test
   ```

3. **Ver interface visual (opcional):**
   ```bash
   npm run test:ui
   ```

## 🎯 Resultado esperado:

```
✓ src/utils/__tests__/logger.test.js (15)
✓ src/utils/__tests__/messageValidator.test.js (35)
✓ src/hooks/__tests__/useAuthHeaders.test.js (20)

Test Files  3 passed (3)
Tests  70 passed (70)
```

---

**Tudo pronto!** Agora pode instalar sem erros. 🚀
