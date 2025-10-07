# 🤖 Prompt Completo para Implementação de IA no Sistema Ofix

## 📋 Contexto e Persona

```
Você é um AI Developer especialista em sistemas para oficinas mecânicas. Seu trabalho é implementar funcionalidades de IA que resolvam problemas reais de gestão, comunicação e organização.

CONTEXTO DO PROJETO:
- Sistema: Ofix (gestão para oficinas mecânicas)
- Usuários: Baixa familiaridade digital, precisam de simplicidade
- Tech Stack: React/Vite, Node.js/Express, PostgreSQL/MongoDB
- Fluxo atual: Agendamento → Check-in → Kanban → Check-out → Comunicação
- Dores principais: 
  1) Desorganização operacional 
  2) Comunicação falha com cliente 
  3) Dependência excessiva do dono

FUNCIONALIDADES PRIORIZADAS: 
- IA Triagem por Voz
- WhatsApp Status Automático
- Alertas de Prazo Vencido
```

## 🎯 Especificação Técnica Detalhada

### 1. **IA Triagem por Voz**

#### Objetivo:
Cliente liga, descreve problema por áudio, sistema automaticamente:
- Transcreve áudio para texto
- Categoriza tipo de serviço (motor, freios, suspensão, elétrica, etc.)
- Estima tempo e complexidade
- Sugere próximos passos para atendente
- Registra tudo no sistema

#### Fluxo Técnico:
1. Captura áudio via interface mobile/web
2. Envia para Whisper API (OpenAI) para transcrição
3. Transcrição vai para LLM com prompt estruturado
4. LLM retorna JSON com categorização e recomendações
5. Interface exibe resultados para atendente confirmar
6. Dados salvos no banco com flag "triagem_ia"

#### Prompt do LLM:
```json
{
  "system": "Você é especialista em diagnóstico automotivo. Analise a descrição do problema e retorne JSON estruturado.",
  "user": "Cliente disse: '[TRANSCRICAO_AUDIO]'. Categorize o problema e sugira próximos passos.",
  "response_format": {
    "categoria_principal": "string",
    "categoria_secundaria": "string", 
    "tempo_estimado_horas": "number",
    "complexidade": "baixa|media|alta",
    "urgencia": "baixa|media|alta|emergencia",
    "pecas_provaveis": ["array de strings"],
    "proximos_passos": "string",
    "confianca_analise": "number 0-100"
  }
}
```

#### Implementação Backend:
```javascript
// 1. BACKEND - Endpoint para processar áudio
app.post('/api/triagem/audio', upload.single('audio'), async (req, res) => {
  try {
    // Transcrever áudio
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      language: "pt"
    });

    // Analisar com LLM
    const analysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {role: "system", content: TRIAGEM_SYSTEM_PROMPT},
        {role: "user", content: `Cliente disse: "${transcription.text}"`}
      ],
      response_format: { type: "json_object" }
    });

    const resultado = JSON.parse(analysis.choices[0].message.content);

    // Salvar no banco
    const triagem = await db.triagens.create({
      audio_original: req.file.path,
      transcricao: transcription.text,
      categoria_principal: resultado.categoria_principal,
      tempo_estimado: resultado.tempo_estimado_horas,
      complexidade: resultado.complexidade,
      status: 'aguardando_confirmacao'
    });

    res.json({triagem_id: triagem.id, ...resultado});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});
```

#### Implementação Frontend:
```javascript
// 2. FRONTEND - Componente de captura de áudio
const TriagemVoz = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const recorder = new MediaRecorder(stream);
    // ... implementar gravação
  };

  const processarAudio = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'triagem.wav');
    
    const response = await fetch('/api/triagem/audio', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    setResultado(data);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? '🛑 Parar' : '🎤 Gravar Problema'}
      </button>
      
      {resultado && (
        <div>
          <h3>📋 Análise Automática</h3>
          <p><strong>Problema:</strong> {resultado.categoria_principal}</p>
          <p><strong>Tempo estimado:</strong> {resultado.tempo_estimado_horas}h</p>
          <p><strong>Urgência:</strong> {resultado.urgencia}</p>
          <p><strong>Próximos passos:</strong> {resultado.proximos_passos}</p>
        </div>
      )}
    </div>
  );
};
```

### 2. **WhatsApp Status Automático**

#### Objetivo:
Automatizar comunicação de status via WhatsApp baseado em mudanças no Kanban

#### Fluxo Técnico:
1. Webhook dispara quando status muda no Kanban
2. Sistema identifica cliente e número WhatsApp
3. Gera mensagem contextual baseada no novo status
4. Envia via WhatsApp Business API ou wa.me
5. Log da comunicação salvo no banco

#### Implementação:
```javascript
// 1. WEBHOOK - Listener para mudanças de status
app.post('/webhook/kanban-update', async (req, res) => {
  const {servico_id, status_anterior, status_novo, cliente_id} = req.body;
  
  try {
    // Buscar dados do serviço e cliente
    const servico = await db.servicos.findById(servico_id);
    const cliente = await db.clientes.findById(cliente_id);
    
    // Gerar mensagem contextual
    const mensagem = gerarMensagemStatus(servico, status_novo, status_anterior);
    
    // Enviar WhatsApp
    await enviarWhatsApp(cliente.telefone, mensagem);
    
    // Log da comunicação
    await db.comunicacoes.create({
      servico_id,
      cliente_id,
      tipo: 'whatsapp_auto',
      conteudo: mensagem,
      status: 'enviado'
    });
    
    res.json({success: true});
  } catch (error) {
    console.error('Erro webhook:', error);
    res.status(500).json({error: error.message});
  }
});

// 2. GERADOR DE MENSAGENS CONTEXTUAIS
const gerarMensagemStatus = (servico, statusNovo, statusAnterior) => {
  const templates = {
    'recebido': `🚗 Olá ${servico.cliente_nome}! Seu ${servico.veiculo_modelo} chegou na nossa oficina. Já vamos começar a análise. Qualquer novidade te avisamos!`,
    'em_analise': `🔍 ${servico.cliente_nome}, estamos analisando seu ${servico.veiculo_modelo}. Em breve teremos o diagnóstico completo!`,
    'aguardando_pecas': `⏳ ${servico.cliente_nome}, identificamos o problema no seu ${servico.veiculo_modelo}. Estamos providenciando as peças necessárias. Previsão: ${servico.prazo_estimado}.`,
    'em_execucao': `🔧 Boa notícia! Já começamos o reparo do seu ${servico.veiculo_modelo}. Nosso mecânico ${servico.mecanico_nome} está cuidando de tudo.`,
    'pronto': `✅ Pronto! Seu ${servico.veiculo_modelo} está finalizado e pode ser retirado. Funcionamento: ${servico.horario_funcionamento}`,
    'entregue': `🎉 Obrigado por confiar em nosso trabalho! Se tiver alguma dúvida sobre o serviço realizado, estamos aqui. Volte sempre!`
  };
  
  return templates[statusNovo] || `📱 Status atualizado: ${statusNovo}`;
};

// 3. ENVIO WHATSAPP (usando wa.me para simplicidade)
const enviarWhatsApp = async (telefone, mensagem) => {
  // Para MVP: gerar link wa.me e exibir para atendente
  const telefoneFormatado = telefone.replace(/\D/g, '').replace(/^0/, '55');
  const mensagemCodificada = encodeURIComponent(mensagem);
  const linkWa = `https://wa.me/${telefoneFormatado}?text=${mensagemCodificada}`;
  
  // Salvar link para atendente enviar (MVP)
  await db.whatsapp_queue.create({
    telefone: telefoneFormatado,
    mensagem,
    link_wa: linkWa,
    status: 'pendente'
  });
  
  // Futuro: integração direta com WhatsApp Business API
  return {success: true, link: linkWa};
};

// 4. PAINEL PARA ATENDENTE - Fila de mensagens
const PainelWhatsApp = () => {
  const [mensagensPendentes, setMensagensPendentes] = useState([]);
  
  useEffect(() => {
    fetch('/api/whatsapp/pendentes')
      .then(r => r.json())
      .then(setMensagensPendentes);
  }, []);
  
  const marcarEnviado = async (id) => {
    await fetch(`/api/whatsapp/${id}/enviado`, {method: 'POST'});
    setMensagensPendentes(prev => prev.filter(m => m.id !== id));
  };
  
  return (
    <div>
      <h2>📱 Mensagens para Enviar</h2>
      {mensagensPendentes.map(msg => (
        <div key={msg.id} className="message-item">
          <p><strong>Para:</strong> {msg.telefone}</p>
          <p><strong>Mensagem:</strong> {msg.mensagem}</p>
          <a href={msg.link_wa} target="_blank">
            📱 Enviar WhatsApp
          </a>
          <button onClick={() => marcarEnviado(msg.id)}>
            ✅ Marcar como Enviado
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 3. **Alertas de Prazo Vencido**

#### Objetivo:
Monitorar prazos automaticamente e sugerir ações proativas

#### Implementação:
```javascript
// 1. CRON JOB - Verificação automática (roda a cada hora)
const cron = require('node-cron');

cron.schedule('0 * * * *', async () => {
  console.log('🕐 Verificando prazos...');
  await verificarPrazos();
});

const verificarPrazos = async () => {
  const agora = new Date();
  
  // Buscar serviços com prazos vencidos ou próximos do vencimento
  const servicosRisco = await db.servicos.findAll({
    where: {
      status: ['em_analise', 'aguardando_pecas', 'em_execucao'],
      [Op.or]: [
        {prazo_entrega: {[Op.lt]: agora}}, // Vencido
        {prazo_entrega: {[Op.lt]: new Date(agora.getTime() + 24*60*60*1000)}} // Vence em 24h
      ]
    },
    include: ['cliente', 'mecanico']
  });
  
  for (const servico of servicosRisco) {
    await gerarAlertaInteligente(servico);
  }
};

// 2. GERADOR DE ALERTAS INTELIGENTES
const gerarAlertaInteligente = async (servico) => {
  const agora = new Date();
  const prazo = new Date(servico.prazo_entrega);
  const horasAtraso = Math.ceil((agora - prazo) / (1000 * 60 * 60));
  const isVencido = agora > prazo;
  
  // IA analisa contexto e sugere ações
  const prompt = `
    Analise este serviço automotivo e sugira 3 ações específicas:
    Serviço: ${servico.descricao}
    Cliente: ${servico.cliente.nome}
    Mecânico: ${servico.mecanico?.nome || 'Não alocado'}
    Status atual: ${servico.status}
    Prazo original: ${prazo.toLocaleDateString()}
    ${isVencido ? `VENCIDO há ${horasAtraso} horas` : `Vence em ${Math.abs(horasAtraso)} horas`}
    
    Retorne JSON com sugestões práticas:
  `;
  
  const analise = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{role: "user", content: prompt}],
    response_format: { type: "json_object" }
  });
  
  const sugestoes = JSON.parse(analise.choices[0].message.content);
  
  // Criar alerta no sistema
  await db.alertas.create({
    servico_id: servico.id,
    tipo: isVencido ? 'prazo_vencido' : 'prazo_proximo',
    prioridade: isVencido ? 'alta' : 'media',
    titulo: `${isVencido ? '🚨 VENCIDO' : '⚠️ VENCE HOJE'}: ${servico.cliente.nome}`,
    descricao: sugestoes.resumo,
    sugestoes_ia: sugestoes.acoes,
    status: 'ativo'
  });
  
  // Notificar dono/atendente
  await notificarEquipe(servico, sugestoes);
};

// 3. PAINEL DE ALERTAS EM TEMPO REAL
const PainelAlertas = () => {
  const [alertas, setAlertas] = useState([]);
  const [alertasAtivos, setAlertasAtivos] = useState(0);
  
  useEffect(() => {
    // WebSocket para alertas em tempo real
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (event) => {
      const novoAlerta = JSON.parse(event.data);
      setAlertas(prev => [novoAlerta, ...prev]);
      setAlertasAtivos(prev => prev + 1);
    };
    
    // Carregar alertas existentes
    fetch('/api/alertas/ativos').then(r => r.json()).then(setAlertas);
  }, []);
  
  const resolverAlerta = async (alertaId, acao) => {
    await fetch(`/api/alertas/${alertaId}/resolver`, {
      method: 'POST',
      body: JSON.stringify({acao}),
      headers: {'Content-Type': 'application/json'}
    });
    
    setAlertas(prev => prev.filter(a => a.id !== alertaId));
    setAlertasAtivos(prev => prev - 1);
  };
  
  return (
    <div>
      <h2>🚨 Alertas Ativos ({alertasAtivos})</h2>
      <p>{alertas.filter(a => a.prioridade === 'alta').length} Urgentes</p>
      
      {alertas.map(alerta => (
        <div key={alerta.id} className="alert-item">
          <h3>{alerta.titulo}</h3>
          <span>{alerta.tempo_ativo}</span>
          <p>{alerta.descricao}</p>
          
          <div>
            <h4>💡 IA Sugere:</h4>
            {alerta.sugestoes_ia.map((sugestao, i) => (
              <button 
                key={i}
                onClick={() => resolverAlerta(alerta.id, sugestao)}
                className="btn-sugestao"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 📊 Métricas de Sucesso e Observabilidade

```javascript
// DASHBOARD DE MÉTRICAS
const MetricasIA = () => {
  const [metricas, setMetricas] = useState({});
  
  useEffect(() => {
    fetch('/api/metricas/ia').then(r => r.json()).then(setMetricas);
  }, []);
  
  return (
    <div>
      <h2>📊 Performance da IA</h2>
      
      {/* Triagem Voz */}
      <section>
        <h3>🎤 IA Triagem Voz</h3>
        <div className="metric">
          <span>{metricas.triagem_precisao}%</span>
          <label>Precisão Categorização</label>
        </div>
        <div className="metric">
          <span>{metricas.tempo_medio_triagem}s</span>
          <label>Tempo Médio Processamento</label>
        </div>
        <div className="metric">
          <span>{metricas.reducao_dependencia_dono}%</span>
          <label>↓ Dependência do Dono</label>
        </div>
      </section>
      
      {/* WhatsApp Auto */}
      <section>
        <h3>📱 WhatsApp Status</h3>
        <div className="metric">
          <span>{metricas.mensagens_enviadas}</span>
          <label>Mensagens Automáticas</label>
        </div>
        <div className="metric">
          <span>{metricas.satisfacao_comunicacao}%</span>
          <label>Satisfação Comunicação</label>
        </div>
        <div className="metric">
          <span>{metricas.reducao_ligacoes}%</span>
          <label>↓ Ligações "Cadê meu carro?"</label>
        </div>
      </section>
      
      {/* Alertas Prazo */}
      <section>
        <h3>⏰ Alertas Inteligentes</h3>
        <div className="metric">
          <span>{metricas.prazos_cumpridos}%</span>
          <label>Prazos Cumpridos</label>
        </div>
        <div className="metric">
          <span>{metricas.tempo_resposta_alertas}min</span>
          <label>Tempo Médio Resposta</label>
        </div>
        <div className="metric">
          <span>{metricas.prevencao_atrasos}%</span>
          <label>Atrasos Prevenidos</label>
        </div>
      </section>
    </div>
  );
};
```

## 🛠️ Instruções de Implementação

### Tarefas Específicas:
1. **Configure as APIs necessárias** (OpenAI, WhatsApp Business)
2. **Implemente os endpoints backend** listados acima
3. **Crie os componentes React** para interfaces
4. **Configure webhooks** para mudanças de status
5. **Implemente sistema de métricas e logs**
6. **Teste cada fluxo** com dados reais de oficina
7. **Configure deployment** com variáveis de ambiente

### Arquivos a Criar/Modificar:

#### Backend:
- `/backend/routes/triagem.js`
- `/backend/routes/whatsapp.js`
- `/backend/routes/alertas.js`
- `/backend/services/openai.js`
- `/backend/jobs/monitorPrazos.js`

#### Frontend:
- `/frontend/components/TriagemVoz.jsx`
- `/frontend/components/PainelWhatsApp.jsx`
- `/frontend/components/PainelAlertas.jsx`
- `/frontend/components/MetricasIA.jsx`

### Configurações Necessárias:
```env
OPENAI_API_KEY=sk-...
WHATSAPP_BUSINESS_TOKEN=EAAx... (futuro)
DATABASE_URL=postgresql://...
WEBHOOK_SECRET=abc123
FRONTEND_URL=http://localhost:3000
```

### Próximos Passos Técnicos:
1. **Setup ambiente de desenvolvimento**
2. **Implementar funcionalidade escolhida** (começar pelo backend)
3. **Criar interface mobile-first**
4. **Integrar com sistema existente**
5. **Testes com dados reais**
6. **Deploy em staging**
7. **Métricas e monitoramento**

## 🎯 Prompts Específicos para Implementação

### Prompt para IA Triagem Voz:

**[Persona]:**
Você é um desenvolvedor Sênior Full-Stack, especialista no ecossistema React/Vite, com backend em Node.js (Express) e banco de dados PostgreSQL. Sua missão é traduzir especificações de produto (PRDs) em código de alta qualidade, focando em usabilidade, performance e robustez.

**[Contexto Estratégico]:**
Estamos implementando a funcionalidade prioritária "IA Triagem por Voz" no sistema Ofix. O objetivo é resolver a dor central de atendimentos telefônicos desorganizados, reduzir a dependência do dono da oficina e padronizar a coleta de informações iniciais dos clientes.

**[Objetivo Técnico Principal]:**
Construir o fluxo de ponta a ponta para a funcionalidade "IA Triagem por Voz". Isso inclui:
- Um endpoint de backend para receber o áudio, processá-lo usando IA e retornar uma análise estruturada
- Um componente de frontend que gerencia a gravação de áudio, exibe o estado do processamento e apresenta os resultados para o atendente

**[Regras de Implementação]:**
- **TYPESCRIPT ESTRITO:** Tipagem rigorosa para todas as props, estados, funções e payloads de API
- **ESTRUTURA MODULAR:** Crie componentes reutilizáveis e mantenha a separação clara entre lógica, serviços e UI
- **CÓDIGO LEGÍVEL:** Adicione comentários JSDoc para props e funções complexas
- **ACESSIBILIDADE:** Garanta o uso correto de label, aria-* e semântica HTML
- **FEEDBACK VISUAL:** Use transições de estado (ex: "Gravando...", "Analisando...")

### Prompt para Prompts Operacionais:

**[Persona]:**
Você é um Arquiteto de Software Sênior, especialista em integrar sistemas de IA (LLMs) em aplicações web existentes. Sua expertise está em criar endpoints de API robustos, componentes de frontend interativos e garantir que a comunicação entre o sistema e a IA seja eficiente, segura e à prova de falhas.

**[Contexto Estratégico]:**
O núcleo do sistema Ofix está estável. Nossa próxima fase é injetar inteligência artificial nas operações diárias para aumentar a eficiência, melhorar a comunicação com o cliente e auxiliar na tomada de decisões.

**[Objetivo Técnico Principal]:**
Para cada um dos 4 prompts operacionais, você deve:
- Criar um endpoint de API (Node.js/Express) que atue como um serviço de orquestração
- Desenvolver o(s) componente(s) de UI (React/Vite) que permitirão ao usuário interagir com essa funcionalidade
- Implementar os fallbacks e lógicas de tratamento de erro

### Prompt para Telemetria e Rollout:

**[Persona]:**
Você é um Lead Software Engineer com especialização em DevOps e Data Engineering. Sua responsabilidade é garantir que as novas funcionalidades não apenas funcionem, mas que também sejam observáveis, resilientes e implementadas de forma segura e faseada.

**[Contexto Estratégico]:**
As funcionalidades de IA do Ofix foram desenvolvidas e validadas. Agora, antes de lançá-las para todos os usuários, precisamos instrumentar o sistema para medir o sucesso, formalizar os contratos técnicos e executar um plano de rollout controlado.

**[Objetivo Técnico Principal]:**
Instrumentar a base de código com telemetria, solidificar os contratos de API, aplicar um checklist de produção e preparar a infraestrutura para um lançamento piloto seguro.

## 🔧 Checklist de Produção

### Segurança:
- [ ] Validação de entrada em todos os endpoints
- [ ] Rate limiting implementado
- [ ] Logs de auditoria configurados
- [ ] Variáveis de ambiente protegidas

### Performance:
- [ ] Timeout nas chamadas de IA (5 segundos)
- [ ] Retry com backoff exponencial
- [ ] Limite de tokens verificado
- [ ] Cache implementado onde aplicável

### Observabilidade:
- [ ] Logs estruturados
- [ ] Métricas de negócio
- [ ] Alertas configurados
- [ ] Dashboard de monitoramento

### Qualidade:
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Validação com dados reais
- [ ] Documentação atualizada

---

**IMPORTANTE:** Modifique o código acima conforme sua stack tecnológica atual. Substitua as partes em [COLCHETES] com suas especificações. Priorize implementação funcional sobre perfeccionismo.

**Data de criação:** 03 de Setembro de 2025
**Versão:** 1.0
**Status:** Pronto para implementação
