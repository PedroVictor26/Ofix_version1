# 📦 INSTRUÇÕES DE INSTALAÇÃO - Melhorias AIPage.jsx

## 🚀 Passo a Passo

### 1. Instalar Dependências

```bash
# Instalar DOMPurify para sanitização
npm install dompurify

# Instalar Lodash para debounce
npm install lodash

# Instalar tipos (se usar TypeScript)
npm install --save-dev @types/dompurify @types/lodash
```

### 2. Verificar Arquivos Criados

Os seguintes arquivos já foram criados:

```
✅ src/utils/logger.js
✅ src/utils/messageValidator.js
✅ src/hooks/useAuthHeaders.js
✅ src/hooks/useChatHistory.js
✅ src/hooks/useChatAPI.js
✅ src/constants/aiPageConfig.js
✅ src/components/ui/toast.jsx
```

### 3. Adicionar ToastProvider no App

Edite `src/main.jsx` ou `src/App.jsx`:

```jsx
import { ToastProvider } from './components/ui/toast';

function App() {
  return (
    <ToastProvider>
      {/* Seu app aqui */}
    </ToastProvider>
  );
}
```

### 4. Testar Logger

Crie um arquivo de teste `test-logger.js`:

```javascript
import logger from './src/utils/logger.js';

// Testar logs
logger.info('Sistema iniciado');
logger.warn('Aviso de teste');
logger.error('Erro de teste', { userId: 123 });
logger.debug('Debug info');

console.log('✅ Logger testado com sucesso!');
```

Execute:
```bash
node test-logger.js
```

### 5. Testar Validação

Crie `test-validator.js`:

```javascript
import { validarMensagem } from './src/utils/messageValidator.js';

// Testes
console.log('Teste 1 - Mensagem vazia:');
console.log(validarMensagem(''));

console.log('\nTeste 2 - Mensagem válida:');
console.log(validarMensagem('Olá, como vai?'));

console.log('\nTeste 3 - Mensagem muito longa:');
console.log(validarMensagem('a'.repeat(1001)));

console.log('\nTeste 4 - XSS:');
console.log(validarMensagem('<script>alert("xss")</script>'));

console.log('\n✅ Validador testado com sucesso!');
```

Execute:
```bash
node test-validator.js
```

### 6. Verificar Estrutura de Pastas

Sua estrutura deve estar assim:

```
src/
├── components/
│   └── ui/
│       └── toast.jsx ✅
├── constants/
│   └── aiPageConfig.js ✅
├── hooks/
│   ├── useAuthHeaders.js ✅
│   ├── useChatAPI.js ✅
│   └── useChatHistory.js ✅
├── pages/
│   └── AIPage.jsx (será modificado)
└── utils/
    ├── logger.js ✅
    └── messageValidator.js ✅
```

### 7. Próximos Passos

Agora você pode:

1. ✅ Modificar AIPage.jsx para usar os novos hooks
2. ✅ Substituir console.log por logger
3. ✅ Adicionar validação nas mensagens
4. ✅ Usar toast para feedback

---

## 🧪 TESTES RÁPIDOS

### Testar no Browser

Abra o console do navegador e execute:

```javascript
// Testar logger
import logger from './utils/logger';
logger.info('Teste do logger');

// Testar toast
import { useToast } from './components/ui/toast';
const { showToast } = useToast();
showToast('Teste de toast!', 'success');
```

### Verificar Instalação

```bash
# Verificar se DOMPurify foi instalado
npm list dompurify

# Verificar se Lodash foi instalado
npm list lodash

# Rodar o projeto
npm run dev
```

---

## ⚠️ TROUBLESHOOTING

### Erro: "Cannot find module 'dompurify'"
**Solução:** Execute `npm install dompurify`

### Erro: "useToast must be used within ToastProvider"
**Solução:** Adicione `<ToastProvider>` no componente raiz

### Erro: "import.meta.env is undefined"
**Solução:** Certifique-se de estar usando Vite

### Logger não envia para servidor
**Solução:** Verifique se `VITE_API_BASE_URL` está configurado no `.env`

---

## 📝 CONFIGURAÇÃO DO .env

Adicione ao seu `.env`:

```bash
# URL da API
VITE_API_BASE_URL=http://localhost:1000

# Modo de desenvolvimento
VITE_DEV=true
```

---

## ✅ CHECKLIST DE INSTALAÇÃO

- [ ] Dependências instaladas (dompurify, lodash)
- [ ] Arquivos criados verificados
- [ ] ToastProvider adicionado ao App
- [ ] Logger testado
- [ ] Validador testado
- [ ] Estrutura de pastas correta
- [ ] .env configurado
- [ ] Projeto rodando sem erros

---

## 🎯 PRÓXIMO PASSO

Após completar a instalação, siga para:
**PLANO_IMPLEMENTACAO_AIPAGE.md - Semana 1, Dia 1**

Comece modificando a AIPage.jsx para usar os novos utilitários!

---

**Instalação completa!** 🎉
