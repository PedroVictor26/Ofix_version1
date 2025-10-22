# 💻 Código para Correção do Fluxo de Busca

## 🎯 Objetivo

Implementar as correções críticas identificadas na análise do vídeo para melhorar drasticamente a UX do fluxo de busca de clientes.

---

## 📝 Mudanças Necessárias

### 1. Adicionar Estado de Contexto

```javascript
// No início do componente AIPage, adicionar:
const [contextoAtivo, setContextoAtivo] = useState(null);
const [inputWarning, setInputWarning] = useState('');
const [inputHint, setInputHint] = useState('');
```

---

### 2. Atualizar Botões de Sugestão

**Localização:** `src/pages/AIPage.jsx` (linhas ~1188-1250)

**Substituir o onClick atual por:**

```javascript
{[
  { 
    icon: '🔍',  // Mudou de 👤 para 🔍 (mais intuitivo)
    text: 'Buscar cliente', 
    command: 'buscar_cliente',  // Comando interno, não enviado
    placeholder: 'Digite nome, CPF ou telefone...',
    mensagemGuia: '👤 Claro! Me diga o nome, CPF ou telefone do cliente que você procura.\n\nExemplos:\n• João Silva\n• 123.456.789-00\n• (11) 98765-4321',
    color: 'blue' 
  },
  { 
    icon: '📅', 
    text: 'Agendar serviço', 
    command: 'agendar_servico',
    placeholder: 'Ex: Troca de óleo para amanhã às 14h',
    mensagemGuia: '📅 Vou te ajudar a agendar! Me diga:\n• Qual serviço?\n• Para quando?\n• Qual cliente?',
    color: 'green' 
  },
  { 
    icon: '🔧', 
    text: 'Status da OS', 
    command: 'status_os',
    placeholder: 'Ex: OS 1234 ou cliente João Silva',
    mensagemGuia: '🔧 Vou consultar o status! Me informe:\n• Número da OS, ou\n• Nome do cliente',
    color: 'purple' 
  },
  { 
    icon: '📦', 
    text: 'Consultar peças', 
    command: 'consultar_pecas',
    placeholder: 'Ex: filtro de óleo ou código ABC123',
    mensagemGuia: '📦 Vou buscar as peças! Me diga:\n• Nome da peça, ou\n• Código da peça',
    color: 'orange' 
  },
  { 
    icon: '💰', 
    text: 'Calcular orçamento', 
    command: 'calcular_orcamento',
    placeholder: 'Ex: troca de óleo + filtro',
    mensagemGuia: '💰 Vou calcular o orçamento! Me diga:\n• Quais serviços?\n• Quais peças?',
    color: 'cyan' 
  }
].map((sugestao) => (
  <button
    key={sugestao.text}
    onClick={() => {
      // NÃO envia mensagem automaticamente
      // Apenas prepara o contexto
      
      // Limpa o campo
      setMensagem("");
      
      // Atualiza placeholder
      if (inputRef.current) {
        inputRef.current.placeholder = sugestao.placeholder;
        inputRef.current.focus();
      }
      
      // Define contexto ativo
      setContextoAtivo(sugestao.command);
      
      // Envia mensagem guia do assistente
      const mensagemGuia = {
        id: Date.now(),
        tipo: 'sistema',
        conteudo: sugestao.mensagemGuia,
        timestamp: new Date().toISOString()
      };
      
      setConversas(prev => {
        const novasConversas = [...prev, mensagemGuia];
        salvarConversasLocal(novasConversas);
        return novasConversas;
      });
      
      logger.info('Contexto ativado', {
        contexto: sugestao.command,
        placeholder: sugestao.placeholder
      });
    }}
    disabled={carregando}
    className={`px-3 py-1.5 text-sm bg-${sugestao.color}-50 text-${sugestao.color}-700 rounded-full hover:bg-${sugestao.color}-100 transition-all duration-200 border border-${sugestao.color}-200 hover:shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
  >
    <span>{sugestao.icon}</span>
    <span>{sugestao.text}</span>
  </button>
))}
```

---

### 3. Adicionar Validação em Tempo Real

**Adicionar função antes do return:**

```javascript
// Função de validação em tempo real
const validarInputBusca = (valor) => {
  if (!valor || contextoAtivo !== 'buscar_cliente') {
    setInputWarning('');
    setInputHint('');
    return true;
  }
  
  // Muito curto
  if (valor.length < 3) {
    setInputWarning('Digite pelo menos 3 caracteres');
    setInputHint('');
    return false;
  }
  
  // Detectar e formatar CPF
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros.length === 11 && !valor.includes('.')) {
    const cpfFormatado = apenasNumeros.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4'
    );
    setMensagem(cpfFormatado);
    setInputHint('✅ CPF detectado e formatado');
    setInputWarning('');
    return true;
  }
  
  // Detectar telefone
  if (apenasNumeros.length === 10 || apenasNumeros.length === 11) {
    setInputHint('✅ Telefone detectado');
    setInputWarning('');
    return true;
  }
  
  // Nome válido
  if (valor.length >= 3) {
    setInputHint('✅ Pronto para buscar');
    setInputWarning('');
    return true;
  }
  
  setInputWarning('');
  setInputHint('');
  return true;
};
```

---

### 4. Atualizar Input com Validação

**Localizar o componente Input e atualizar:**

```javascript
<Input
  ref={inputRef}
  placeholder="Digite sua mensagem..."
  value={mensagem}
  onChange={(e) => {
    setMensagem(e.target.value);
    validarInputBusca(e.target.value);
  }}
  onKeyPress={handleKeyPress}
  disabled={carregando}
  className="flex-1"
/>

{/* Adicionar feedback visual abaixo do input */}
{inputWarning && (
  <div className="px-4 py-1 text-xs text-red-600 bg-red-50 rounded">
    ⚠️ {inputWarning}
  </div>
)}
{inputHint && (
  <div className="px-4 py-1 text-xs text-green-600 bg-green-50 rounded">
    {inputHint}
  </div>
)}
```

---

### 5. Melhorar Função enviarMensagem

**Atualizar a função enviarMensagem para considerar contexto:**

```javascript
const enviarMensagem = async () => {
  if (!mensagem.trim() || carregando) return;

  // ✅ VALIDAR MENSAGEM
  const validacao = validarMensagem(mensagem);

  if (!validacao.valid) {
    showToast(validacao.errors[0], 'error');
    logger.warn('Mensagem inválida', {
      errors: validacao.errors,
      messageLength: mensagem.length,
      context: 'enviarMensagem'
    });
    return;
  }

  const novaMensagem = {
    id: Date.now(),
    tipo: 'usuario',
    conteudo: validacao.sanitized,
    timestamp: new Date().toISOString(),
    metadata: {
      contexto: contextoAtivo  // ✅ Adiciona contexto
    }
  };

  setConversas(prev => {
    const novasConversas = [...prev, novaMensagem];
    salvarConversasLocal(novasConversas);
    return novasConversas;
  });
  
  setMensagem('');
  setCarregando(true);
  
  // Limpa hints
  setInputWarning('');
  setInputHint('');

  try {
    const authHeaders = getAuthHeaders();

    // 🧠 ENRIQUECER MENSAGEM COM NLP
    let mensagemEnriquecida = null;
    try {
      mensagemEnriquecida = enrichMessage(novaMensagem.conteudo);
      
      logger.info('Mensagem enriquecida com NLP', {
        intencao: mensagemEnriquecida.nlp.intencao,
        confianca: mensagemEnriquecida.nlp.confianca,
        entidades: Object.keys(mensagemEnriquecida.nlp.entidades),
        context: 'enviarMensagem'
      });
    } catch (nlpError) {
      logger.warn('Erro ao enriquecer mensagem com NLP', {
        error: nlpError.message,
        context: 'enviarMensagem'
      });
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
    const API_BASE = API_BASE_URL.replace('/api', '');
    
    // Preparar body da requisição
    const requestBody = {
      message: novaMensagem.conteudo,
      usuario_id: user?.id,
      contexto_conversa: conversas.slice(-5).map(c => ({
        tipo: c.tipo,
        conteudo: c.conteudo
      })),
      contexto_ativo: contextoAtivo  // ✅ Envia contexto ativo
    };
    
    // Adicionar NLP se disponível
    if (mensagemEnriquecida) {
      requestBody.nlp = mensagemEnriquecida.nlp;
      requestBody.contextoNLP = mensagemEnriquecida.contexto;
    }
    
    logger.info('🚀 Enviando requisição ao backend', {
      endpoint: `${API_BASE}/agno/chat-inteligente`,
      hasNLP: !!mensagemEnriquecida,
      contextoAtivo: contextoAtivo,
      message: novaMensagem.conteudo.substring(0, 50),
      context: 'enviarMensagem'
    });

    const response = await fetch(`${API_BASE}/agno/chat-inteligente`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(requestBody)
    });

    logger.info('📥 Resposta recebida do backend', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      context: 'enviarMensagem'
    });

    if (response.ok) {
      const data = await response.json();
      
      logger.info('📦 Dados da resposta', {
        hasResponse: !!data.response,
        tipo: data.tipo,
        success: data.success,
        context: 'enviarMensagem'
      });

      let responseContent = '';
      let tipoResposta = 'agente';

      if (data.response) {
        if (typeof data.response === 'string') {
          responseContent = data.response;
        } else if (typeof data.response === 'object') {
          responseContent = data.response.content ||
            data.response.message ||
            data.response.output ||
            JSON.stringify(data.response, null, 2);
        } else {
          responseContent = String(data.response);
        }

        if (data.tipo) {
          tipoResposta = data.tipo;
        }
      } else if (data.message) {
        responseContent = data.message;
        tipoResposta = data.success ? 'agente' : 'erro';
      } else {
        responseContent = 'Resposta recebida do agente.';
        tipoResposta = 'agente';
      }

      // ✅ TRATAMENTO ESPECIAL PARA ERRO DE BUSCA
      if (contextoAtivo === 'buscar_cliente' && !data.success && data.tipo === 'erro') {
        // Cliente não encontrado - oferecer cadastro
        responseContent = `🔍 Não encontrei "${novaMensagem.conteudo}" no sistema.\n\n🆕 Quer cadastrar este cliente agora?\n\nVou precisar de:\n• Nome completo\n• Telefone\n• CPF (opcional)\n• Email (opcional)`;
        tipoResposta = 'cadastro';
        
        data.metadata = {
          ...data.metadata,
          dadosExtraidos: {
            nome: novaMensagem.conteudo
          },
          actions: [
            { 
              type: 'cadastrar_cliente', 
              label: 'Sim, cadastrar', 
              data: { nome: novaMensagem.conteudo } 
            },
            { 
              type: 'tentar_novamente', 
              label: 'Não, tentar outro nome', 
              data: {} 
            }
          ]
        };
      }

      const acoesInline = gerarAcoesInline(tipoResposta, data.metadata);
      
      const respostaAgente = {
        id: Date.now() + 1,
        tipo: tipoResposta,
        conteudo: responseContent,
        timestamp: new Date().toISOString(),
        metadata: {
          ...data.metadata,
          dadosExtraidos: data.dadosExtraidos,
          actions: acoesInline
        }
      };

      setConversas(prev => {
        const novasConversas = [...prev, respostaAgente];
        salvarConversasLocal(novasConversas);
        return novasConversas;
      });

      // 🎯 ABRIR MODAL DE CADASTRO SE NECESSÁRIO
      if (tipoResposta === 'cadastro' && data.dadosExtraidos) {
        setClientePrePreenchido({
          nomeCompleto: data.dadosExtraidos.nome || novaMensagem.conteudo,
          telefone: data.dadosExtraidos.telefone || '',
          cpfCnpj: data.dadosExtraidos.cpfCnpj || '',
          email: data.dadosExtraidos.email || ''
        });
        // Não abre automaticamente, espera usuário clicar no botão
      }

      // ✅ LIMPAR CONTEXTO APÓS SUCESSO
      if (data.success && contextoAtivo) {
        setContextoAtivo(null);
        if (inputRef.current) {
          inputRef.current.placeholder = 'Digite sua mensagem...';
        }
      }

      // Falar resposta se voz habilitada
      if (vozHabilitada && responseContent && 'speechSynthesis' in window) {
        try {
          const textoLimpo = responseContent
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, ' ')
            .replace(/[•✅❌📋🔧🚗💼📊🔍🆕👤📅💰📦]/gu, '')
            .trim();

          if (textoLimpo.length > 0 && textoLimpo.length < AI_CONFIG.VOICE.MAX_TEXT_LENGTH_FOR_SPEECH) {
            falarTexto(textoLimpo);
          }
        } catch (error) {
          logger.error('Erro ao preparar texto para fala', {
            error: error.message
          });
        }
      }
    } else {
      throw new Error(`Erro na API: ${response.status}`);
    }
  } catch (error) {
    logger.error('Erro ao enviar mensagem', {
      error: error.message,
      stack: error.stack,
      userId: user?.id,
      messageLength: mensagem.length,
      contextoAtivo: contextoAtivo,
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
  } finally {
    setCarregando(false);
  }
};
```

---

### 6. Atualizar ActionButtons para Tratar Novas Ações

**Localizar o componente ActionButtons e adicionar handlers:**

```javascript
// No handler de ações
const handleAction = (action) => {
  switch (action.type) {
    case 'cadastrar_cliente':
      // Abrir modal com dados pré-preenchidos
      setClientePrePreenchido({
        nomeCompleto: action.data.nome || '',
        telefone: action.data.telefone || '',
        cpfCnpj: action.data.cpfCnpj || '',
        email: action.data.email || ''
      });
      setModalClienteAberto(true);
      break;
      
    case 'tentar_novamente':
      // Limpar campo e manter contexto
      setMensagem('');
      if (inputRef.current) {
        inputRef.current.placeholder = 'Digite outro nome, CPF ou telefone...';
        inputRef.current.focus();
      }
      setContextoAtivo('buscar_cliente');
      break;
      
    // ... outros casos
  }
};
```

---

## 🧪 Como Testar

### Teste 1: Buscar Cliente Existente

1. Clique em "🔍 Buscar cliente"
2. Verifique que aparece mensagem guia
3. Digite um nome de cliente existente
4. Verifique que aparece resultado com ações

**Resultado esperado:** ✅ Cliente encontrado com botões de ação

---

### Teste 2: Buscar Cliente Inexistente

1. Clique em "🔍 Buscar cliente"
2. Digite um nome que não existe
3. Verifique que aparece opção de cadastro
4. Clique em "Sim, cadastrar"
5. Verifique que modal abre com nome pré-preenchido

**Resultado esperado:** ✅ Fluxo de cadastro iniciado

---

### Teste 3: Validação de CPF

1. Clique em "🔍 Buscar cliente"
2. Digite: `12345678900`
3. Verifique que formata automaticamente para: `123.456.789-00`
4. Verifique hint: "✅ CPF detectado e formatado"

**Resultado esperado:** ✅ CPF formatado automaticamente

---

### Teste 4: Validação de Entrada Curta

1. Clique em "🔍 Buscar cliente"
2. Digite apenas: `Jo`
3. Verifique warning: "Digite pelo menos 3 caracteres"

**Resultado esperado:** ✅ Warning exibido

---

## 📊 Checklist de Implementação

- [ ] Adicionar estados de contexto
- [ ] Atualizar botões de sugestão
- [ ] Implementar validação em tempo real
- [ ] Atualizar input com feedback visual
- [ ] Melhorar função enviarMensagem
- [ ] Atualizar ActionButtons
- [ ] Testar fluxo completo
- [ ] Validar com usuários reais

---

## 🎯 Resultado Esperado

Após implementar estas mudanças:

- ✅ Botões de sugestão funcionam corretamente
- ✅ Contexto é mantido durante o fluxo
- ✅ Validação em tempo real funciona
- ✅ Erros são tratados com empatia
- ✅ Cadastro assistido disponível
- ✅ UX profissional e intuitiva

---

**Data:** 22/10/2025  
**Status:** ⏳ Pronto para implementação  
**Prioridade:** 🔴 CRÍTICA
