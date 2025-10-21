# 🧪 Guia de Testes - Melhorias do Assistente IA

## 📦 Instalação das Dependências de Teste

### 1. Instalar Vitest e dependências

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

### 2. Configurar Vitest

Crie o arquivo `vitest.config.js` na raiz do projeto:

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.js',
        '**/*.test.jsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 3. Criar arquivo de setup

Crie `src/test/setup.js`:

```javascript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;
```

### 4. Adicionar scripts no package.json

Adicione estes scripts no seu `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 🚀 Executando os Testes

### Rodar todos os testes (modo watch)
```bash
npm test
```

### Rodar testes uma vez (CI)
```bash
npm run test:run
```

### Rodar testes com interface visual
```bash
npm run test:ui
```
Depois abra: http://localhost:51204/__vitest__/

### Rodar testes com cobertura
```bash
npm run test:coverage
```

### Rodar testes específicos
```bash
# Apenas testes do logger
npm test logger

# Apenas testes do messageValidator
npm test messageValidator

# Apenas testes do useAuthHeaders
npm test useAuthHeaders
```

## 📊 Estrutura dos Testes Criados

```
src/
├── utils/
│   ├── __tests__/
│   │   ├── logger.test.js           ✅ 15 testes
│   │   └── messageValidator.test.js ✅ 35+ testes
│   ├── logger.js
│   └── messageValidator.js
└── hooks/
    ├── __tests__/
    │   └── useAuthHeaders.test.js   ✅ 20+ testes
    └── useAuthHeaders.js
```

## 🧪 Testes Implementados

### 1. Logger (15 testes)
- ✅ Formatação de dados do log
- ✅ Inclusão de userId quando disponível
- ✅ Criação de sessionId
- ✅ Log de erro no console (dev)
- ✅ Adição de erro à fila (prod)
- ✅ Rate limiting
- ✅ Warnings e info
- ✅ Debug apenas em dev
- ✅ Adição à fila
- ✅ Flush quando fila cheia
- ✅ Envio em lote para servidor
- ✅ Fila vazia não faz nada
- ✅ Recolocar logs na fila se falhar
- ✅ Captura de erros globais
- ✅ Captura de promises rejeitadas

### 2. MessageValidator (35+ testes)
- ✅ Validação de mensagem válida
- ✅ Rejeição de mensagem vazia
- ✅ Rejeição de mensagem muito longa
- ✅ Aviso de mensagem próxima do limite
- ✅ Sanitização de HTML/XSS
- ✅ Detecção de SQL injection
- ✅ Detecção de URLs suspeitas
- ✅ Validação de CPF (válido, inválido, formatação)
- ✅ Validação de CNPJ (válido, inválido, formatação)
- ✅ Validação de telefone (celular, fixo, DDD)
- ✅ Validação de email (válido, inválido, temporário)
- ✅ Validação de placa (antiga, Mercosul, formatação)
- ✅ Validação de arquivo (tamanho, ausência)
- ✅ Escape de caracteres especiais

### 3. useAuthHeaders (20+ testes)
- ✅ Headers básicos sem token
- ✅ Inclusão de Authorization header
- ✅ Warning para token inválido
- ✅ Tratamento de erro ao parsear JSON
- ✅ Verificação de autenticação
- ✅ Detecção de token expirado
- ✅ Obtenção de dados do token
- ✅ Obtenção de userId
- ✅ Verificação de expiração próxima
- ✅ Limpeza de autenticação
- ✅ Salvamento de novo token
- ✅ Cálculo de data de expiração
- ✅ Tratamento de erros

## 📈 Cobertura Esperada

Após rodar `npm run test:coverage`, você deve ver algo como:

```
File                        | % Stmts | % Branch | % Funcs | % Lines
----------------------------|---------|----------|---------|--------
src/utils/logger.js         |   95%   |   90%    |   100%  |   95%
src/utils/messageValidator.js|  98%   |   95%    |   100%  |   98%
src/hooks/useAuthHeaders.js |   97%   |   92%    |   100%  |   97%
```

## 🐛 Testando Manualmente no Navegador

### 1. Testar Logger

Abra o console do navegador e execute:

```javascript
import logger from './src/utils/logger';

// Testar diferentes níveis
logger.error('Teste de erro', { detail: 'teste' });
logger.warn('Teste de warning');
logger.info('Teste de info');
logger.debug('Teste de debug');

// Verificar fila
console.log('Fila de logs:', logger.logQueue);

// Forçar flush
logger.flushLogs();
```

### 2. Testar MessageValidator

```javascript
import { validarMensagem, validarCPF, validarEmail } from './src/utils/messageValidator';

// Testar validação de mensagem
console.log(validarMensagem('Olá, tudo bem?'));
console.log(validarMensagem('<script>alert("xss")</script>'));
console.log(validarMensagem('SELECT * FROM users'));

// Testar CPF
console.log(validarCPF('123.456.789-09'));
console.log(validarCPF('111.111.111-11'));

// Testar email
console.log(validarEmail('teste@example.com'));
console.log(validarEmail('teste@tempmail.com'));
```

### 3. Testar useAuthHeaders

No componente React:

```javascript
import { useAuthHeaders } from './hooks/useAuthHeaders';

function TestComponent() {
  const { 
    getAuthHeaders, 
    isAuthenticated, 
    setAuthToken,
    getUserId 
  } = useAuthHeaders();

  const handleTest = () => {
    // Salvar token
    setAuthToken('test-token-123', 3600);
    
    // Verificar autenticação
    console.log('Autenticado?', isAuthenticated());
    
    // Obter headers
    console.log('Headers:', getAuthHeaders());
    
    // Obter userId
    console.log('User ID:', getUserId());
  };

  return <button onClick={handleTest}>Testar Auth</button>;
}
```

## 🔍 Verificando se Tudo Funciona

### Checklist Rápido:

1. **Instalar dependências**
   ```bash
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/react-hooks @testing-library/jest-dom jsdom
   ```

2. **Criar arquivos de configuração**
   - ✅ `vitest.config.js`
   - ✅ `src/test/setup.js`

3. **Adicionar scripts no package.json**
   - ✅ `"test": "vitest"`
   - ✅ `"test:ui": "vitest --ui"`
   - ✅ `"test:run": "vitest run"`
   - ✅ `"test:coverage": "vitest run --coverage"`

4. **Rodar testes**
   ```bash
   npm test
   ```

5. **Verificar resultados**
   - Todos os testes devem passar ✅
   - Cobertura deve estar acima de 90%

## 🎯 Próximos Passos

Após confirmar que os testes estão funcionando:

1. ✅ **Task 1-3 completas** (logger, validator, authHeaders)
2. 🔄 **Task 4**: Refatorar useChatAPI com retry
3. 🔄 **Task 5**: Otimizar useChatHistory
4. 🔄 **Tasks 6-7**: Extrair hooks de voz e componentes
5. 🔄 **Tasks 8+**: Implementar novas funcionalidades

## 💡 Dicas

- Use `npm test -- --watch` para rodar testes em modo watch
- Use `npm test -- --reporter=verbose` para ver mais detalhes
- Use `npm run test:ui` para interface visual interativa
- Adicione `.only` para rodar apenas um teste: `it.only('teste', () => {})`
- Adicione `.skip` para pular um teste: `it.skip('teste', () => {})`

## 🆘 Problemas Comuns

### Erro: "Cannot find module '@testing-library/react'"
```bash
npm install -D @testing-library/react @testing-library/jest-dom
```

### Erro: "ReferenceError: global is not defined"
Adicione no `vitest.config.js`:
```javascript
test: {
  globals: true,
  environment: 'jsdom'
}
```

### Erro: "localStorage is not defined"
Verifique se o arquivo `src/test/setup.js` está configurado corretamente.

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
