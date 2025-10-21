# 🔧 MODIFICAÇÕES NA AIPage.jsx

## 📋 LISTA DE MUDANÇAS

Este documento detalha **exatamente** o que modificar na AIPage.jsx

---

## 1️⃣ IMPORTS (Adicionar no topo)

### ANTES:
```javascript
import { useState, useRef, useEffect } from 'react';
import { User, Bot, CheckCircle, Loader2, AlertCircle, Volume2, VolumeX, Trash2, Settings, MessageSquare, Wrench, MicOff, Mic, Send, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext.jsx';
import ClienteModal from '../components/clientes/ClienteModal';
```

### DEPOIS:
```javascript
import { useState, useRef, useEffect } from 'react';
import { User, Bot, CheckCircle, Loader2, AlertCircle, Volume2, VolumeX, Trash2, Settings, MessageSquare, Wrench, MicOff, Mic, Send, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext.jsx';
import ClienteModal from '../components/clientes/ClienteModal';

// ✅ NOVOS IMPORTS
import logger from '../utils/logger';
import { validarMensagem } from '../utils/messageValidator';
import { useToast } from '../components/ui/toast';
import { useAuthHeaders } from '../hooks/useAuthHeaders';
import { AI_CONFIG } from '../constants/aiPageConfig';
```

---

## 2️⃣ DENTRO DO COMPONENTE (Adicionar após useAuth)

### ADICIONAR:
```javascript
const AIPage = () => {
  const { user } = useAuth();
  
  // ✅ NOVOS HOOKS
  const { showToast } = useToast();
  const { getAuthHeaders } = useAuthHeaders();
  
  // ... resto do código
```

---

## 3️⃣ SUBSTITUIR: carregarHistorico (Linha ~73)

### ANTES:
```javascript
} catch {
  // console.error('❌ Erro ao carregar histórico:', error);
}
```

### DEPOIS:
```javascript
} catch (error) {
  logger.error('Erro ao carregar histórico', {
    error: error.message,
    userId: user?.id,
    context: 'carregarHistorico'
  });
  showToast('Erro ao carregar histórico', 'error');
}
```

---

## 4️⃣ SUBSTITUIR: verificarConexao (Linha ~136)

### ANTES:
```javascript
try {
  const tokenData = JSON.parse(tokenDataString);
  if (tokenData && tokenData.token) {
    authHeaders['Authorization'] = `Bearer ${tokenData.token}`;
  }
} catch {
  // console.error('Erro ao processar token:', e);
}
```

### DEPOIS:
```javascript
// ✅ USAR HOOK
const authHeaders = getAuthHeaders();
```

E no catch principal:

### ANTES:
```javascript
} catch {
  // console.error('Erro ao verificar conexão:', error);
  setStatusConexao('erro');
  return false;
}
```

### DEPOIS:
```javascript
} catch (error) {
  logger.error('Erro ao verificar conexão', {
    error: error.message,
    apiBase: API_BASE,
    context: 'verificarConexao'
  });
  setStatusConexao('erro');
  showToast('Erro ao conectar com o agente', 'error');
  return false;
}
```

---

## 5️⃣ SUBSTITUIR: iniciarGravacao (Linha ~225)

### ANTES:
```javascript
recognition.onerror = (event) => {
  // console.error('Erro reconhecimento:', event.error);
  setGravando(false);
  
  if (event.error !== 'aborted' && event.error !== 'no-speech') {
    alert(`Erro no reconhecimento de voz: ${event.error}`);
  }
};
```

### DEPOIS:
```javascript
recognition.onerror = (event) => {
  logger.error('Erro no reconhecimento de voz', {
    error: event.error,
    message: event.message,
    context: 'iniciarGravacao'
  });
  setGravando(false);
  
  if (event.error !== 'aborted' && event.error !== 'no-speech') {
    showToast(`Erro no reconhecimento de voz: ${event.error}`, 'error');
  }
};
```

E no catch:

### ANTES:
```javascript
} catch {
  // console.error('Erro ao iniciar reconhecimento:', error);
  setGravando(false);
}
```

### DEPOIS:
```javascript
} catch (error) {
  logger.error('Erro ao iniciar reconhecimento', {
    error: error.message,
    context: 'iniciarGravacao'
  });
  setGravando(false);
  showToast('Erro ao iniciar gravação', 'error');
}
```

---

## 6️⃣ SUBSTITUIR: falarTexto (Linha ~338)

### ANTES:
```javascript
utterance.onerror = () => {
  // console.error('Erro na síntese de voz:', event);
  setFalando(false);
  // ...
};
```

### DEPOIS:
```javascript
utterance.onerror = (event) => {
  logger.error('Erro na síntese de voz', {
    error: event.error,
    message: event.message,
    context: 'falarTexto'
  });
  setFalando(false);
  showToast('Erro ao falar texto', 'error');
  // ...
};
```

---

## 7️⃣ SUBSTITUIR: enviarMensagem (Linha ~410) - CRÍTICO

### ANTES:
```javascript
const enviarMensagem = async () => {
  if (!mensagem.trim() || carregando) return;

  const novaMensagem = {
    id: Date.now(),
    tipo: 'usuario',
    conteudo: mensagem,
    timestamp: new Date().toISOString()
  };
```

### DEPOIS:
```javascript
const enviarMensagem = async () => {
  if (!mensagem.trim() || carregando) return;

  // ✅ VALIDAR MENSAGEM
  const validacao = validarMensagem(mensagem);
  
  if (!validacao.valid) {
    showToast(validacao.errors[0], 'error');
    logger.warn('Mensagem inválida', {
      errors: validacao.errors,
      messageLength: mensagem.length
    });
    return;
  }

  const novaMensagem = {
    id: Date.now(),
    tipo: 'usuario',
    conteudo: validacao.sanitized, // ✅ USAR MENSAGEM SANITIZADA
    timestamp: new Date().toISOString()
  };
```

E substituir a autenticação:

### ANTES:
```javascript
const tokenDataString = localStorage.getItem('authToken');
const authHeaders = {
  'Content-Type': 'application/json'
};

if (tokenDataString) {
  try {
    const tokenData = JSON.parse(tokenDataString);
    if (tokenData && tokenData.token) {
      authHeaders['Authorization'] = `Bearer ${tokenData.token}`;
    }
  } catch {
    // console.error('Erro ao processar token:', e);
  }
}
```

### DEPOIS:
```javascript
// ✅ USAR HOOK
const authHeaders = getAuthHeaders();
```

E no catch:

### ANTES:
```javascript
} catch {
  // console.error('Erro ao enviar mensagem:', error);
  
  const mensagemErro = {
    id: Date.now() + 1,
    tipo: 'erro',
    conteudo: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em instantes.',
    timestamp: new Date().toISOString()
  };

  setConversas(prev => [...prev, mensagemErro]);
}
```

### DEPOIS:
```javascript
} catch (error) {
  logger.error('Erro ao enviar mensagem', {
    error: error.message,
    stack: error.stack,
    userId: user?.id,
    messageLength: mensagem.length,
    context: 'enviarMensagem'
  });
  
  showToast('Erro ao enviar mensagem. Tente novamente.', 'error');
  
  const mensagemErro = {
    id: Date.now() + 1,
    tipo: 'erro',
    conteudo: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em instantes.',
    timestamp: new Date().toISOString()
  };

  setConversas(prev => [...prev, mensagemErro]);
}
```

---

## 8️⃣ SUBSTITUIR: Usar Constantes

### ANTES:
```javascript
if (confidence < 0.5) return;
if (textoLimpo.length > 0 && textoLimpo.length < 500) {
  falarTexto(textoLimpo);
}
```

### DEPOIS:
```javascript
if (confidence < AI_CONFIG.VOICE.MIN_CONFIDENCE) return;
if (textoLimpo.length > 0 && textoLimpo.length < AI_CONFIG.VOICE.MAX_TEXT_LENGTH_FOR_SPEECH) {
  falarTexto(textoLimpo);
}
```

---

## 9️⃣ ADICIONAR: Limite de Mensagens

### MODIFICAR a função que adiciona mensagens:

```javascript
const adicionarMensagem = (novaMensagem) => {
  setConversas(prev => {
    const novasConversas = [...prev, novaMensagem];
    
    // ✅ LIMITAR HISTÓRICO
    const conversasLimitadas = novasConversas.slice(-AI_CONFIG.CHAT.MAX_HISTORY_MESSAGES);
    
    salvarConversasLocal(conversasLimitadas);
    return conversasLimitadas;
  });
};
```

---

## 🔟 ADICIONAR: Feedback Visual

### No início do componente, adicionar indicador de validação:

```javascript
// Mostrar contador de caracteres
<div className="text-xs text-slate-500 mt-1">
  {mensagem.length}/{AI_CONFIG.CHAT.MAX_MESSAGE_LENGTH} caracteres
</div>
```

---

## ✅ CHECKLIST DE MODIFICAÇÕES

- [ ] 1. Imports adicionados
- [ ] 2. Hooks adicionados (useToast, useAuthHeaders)
- [ ] 3. carregarHistorico corrigido
- [ ] 4. verificarConexao corrigido
- [ ] 5. iniciarGravacao corrigido
- [ ] 6. falarTexto corrigido
- [ ] 7. enviarMensagem corrigido (CRÍTICO)
- [ ] 8. Constantes substituídas
- [ ] 9. Limite de mensagens adicionado
- [ ] 10. Feedback visual adicionado

---

## 🧪 TESTAR APÓS MODIFICAÇÕES

1. **Teste de validação:**
   - Enviar mensagem vazia → Deve mostrar toast de erro
   - Enviar mensagem muito longa → Deve mostrar toast de erro
   - Enviar mensagem com HTML → Deve sanitizar

2. **Teste de logging:**
   - Forçar erro → Deve aparecer no console (dev)
   - Verificar logs estruturados

3. **Teste de autenticação:**
   - Remover token → Deve funcionar sem quebrar
   - Token inválido → Deve logar aviso

4. **Teste de voz:**
   - Erro de gravação → Deve mostrar toast
   - Erro de síntese → Deve mostrar toast

---

## 📊 RESULTADO ESPERADO

Após as modificações:
- ✅ Sem console.log/error comentados
- ✅ Todos os erros tratados e logados
- ✅ Feedback visual para o usuário
- ✅ Validação de entrada funcionando
- ✅ Código mais limpo e organizado

---

**Tempo estimado:** 2-3 horas para todas as modificações

**Próximo passo:** Testar tudo e fazer commit!
