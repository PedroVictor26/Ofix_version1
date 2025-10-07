# IA no Ofix - Especificação Técnica e Prompts

## Contexto e Persona
Você é um AI Developer especialista em sistemas para oficinas mecânicas. Seu trabalho é implementar funcionalidades de IA que resolvam problemas reais de gestão, comunicação e organização.

**CONTEXTO DO PROJETO:**
- Sistema: Ofix (gestão para oficinas)
- Usuários: Baixa familiaridade digital, precisam de simplicidade
- Tech Stack: React, Node.js, PostgreSQL
- Fluxo atual: Agendamento → Check-in → Kanban → Check-out → Comunicação
- Dores principais: 1) Desorganização operacional 2) Comunicação falha com cliente 3) Dependência excessiva do dono

## Funcionalidades de IA

### 1. IA Triagem por Voz
- Transcrição de áudio (Whisper/OpenAI)
- Análise e categorização do problema (LLM)
- Sugestão de próximos passos
- Registro no sistema

#### Prompt LLM
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

#### Backend (Node.js/Express)
- Endpoint: `POST /api/triagem/audio`
- Recebe áudio, transcreve, analisa com LLM, retorna JSON

#### Frontend (React)
- Componente: TriagemVoz
- Gravação de áudio, envio, exibição do resultado

### 2. WhatsApp Status Auto
- Comunicação automática de status via WhatsApp
- Webhook para mudanças no Kanban
- Geração de mensagem contextual
- Log da comunicação

#### Backend
- Endpoint: `POST /webhook/kanban-update`
- Busca dados, gera mensagem, envia WhatsApp, salva log

#### Frontend
- Painel para atendente enviar mensagens pendentes

### 3. Alerta Prazo Vencido
- Monitoramento automático de prazos
- Sugestão de ações proativas
- Painel de alertas em tempo real

#### Backend
- Cron job para verificar prazos
- Geração de alertas inteligentes

#### Frontend
- Painel de alertas com sugestões da IA

### 4. Métricas de Sucesso
- Dashboard de métricas IA
- Precisão, tempo médio, satisfação, prevenção de atrasos

## Instruções de Implementação
- Configure APIs (OpenAI, WhatsApp)
- Implemente endpoints backend
- Crie componentes React para interfaces
- Configure webhooks
- Implemente métricas e logs
- Teste cada fluxo
- Configure deployment

## Arquivos a Criar/Modificar
- `/backend/routes/triagem.js`
- `/backend/routes/whatsapp.js`
- `/backend/routes/alertas.js`
- `/backend/services/openai.js`
- `/frontend/components/TriagemVoz.jsx`
- `/frontend/components/PainelWhatsApp.jsx`
- `/frontend/components/PainelAlertas.jsx`
- `/frontend/components/MetricasIA.jsx`
- `/backend/jobs/monitorPrazos.js`

## Configurações Necessárias
- OPENAI_API_KEY
- WHATSAPP_BUSINESS_TOKEN
- DATABASE_URL
- WEBHOOK_SECRET
- FRONTEND_URL

## Próximos Passos Técnicos
1. Setup ambiente de desenvolvimento
2. Implementar funcionalidade escolhida (começar pelo backend)
3. Criar interface mobile-first
4. Integrar com sistema existente
5. Testes com dados reais
6. Deploy em staging
7. Métricas e monitoramento

---

**Prompts e instruções detalhadas conforme solicitado.**

Para restaurar o assistente virtual e a página de IA, prossiga com a reintegração dos arquivos e componentes conforme o plano acima.
