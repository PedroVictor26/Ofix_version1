# 🤖 Integração OFIX + Agno AI Agent

## Visão Geral

Esta implementação integra seu agente Agno AI ao sistema OFIX através de uma página dedicada. A arquitetura utiliza:

- **Frontend**: Página `AIPage.jsx` com interface de chat
- **Backend**: API proxy em `agno.routes.js` 
- **Agno**: Seu agente já implementado rodando no AgentOS

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OFIX Frontend │    │   OFIX Backend  │    │   Agno AgentOS  │
│   (React)       │───▶│   (Node.js)     │───▶│   (FastAPI)     │
│   AIPage.jsx    │    │   agno.routes.js│    │   Seu Agente    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Como Implementar

### 1. Configure o Backend

Adicione as configurações no `.env` do backend:

```bash
# URL onde seu AgentOS está rodando
AGNO_API_URL=http://localhost:8000

# Token de auth do AgentOS (se necessário)
AGNO_API_TOKEN=seu_token_aqui

# ID do seu agente
AGNO_DEFAULT_AGENT_ID=agente-ofix
```

### 2. Configure o Frontend

Adicione as configurações no `.env.local` do frontend:

```bash
# IMPORTANTE: Use VITE_ como prefixo para Vite
VITE_AGNO_API_URL=http://localhost:8000
VITE_AGNO_AGENT_ID=agente-ofix
VITE_AGNO_API_TOKEN=
```

### 3. Instale Dependências

No backend, você pode precisar de:

```bash
npm install node-fetch
```

### 4. Acesse a Página

Navegue para `/assistente-ia` no sistema OFIX para usar o agente.

## 📡 Endpoints Criados

### Backend (`/api/agno/`)

- `GET /health` - Verifica se o agente está online
- `POST /chat` - Envia mensagem para o agente
- `GET /runs` - Lista execuções do agente  
- `GET /runs/:runId` - Status de execução específica
- `GET /agent/:agentId` - Informações do agente

### Agno AgentOS (conforme documentação)

- `POST /agents/{agent_id}/runs` - Executa o agente
- `GET /health` - Status do sistema
- Outros endpoints conforme sua implementação

## 🎯 Funcionalidades da Página

### Interface de Chat
- Chat em tempo real com o agente
- Histórico de conversas
- Indicadores visuais de status
- Área dedicada e focada

### Status de Conexão
- Monitoramento em tempo real
- Indicadores visuais (online/offline/erro)
- Botão de reconexão
- Mensagens de erro informativas

### Contexto Inteligente
- Informações do usuário (nome, função)
- Contexto da plataforma OFIX
- Timestamps das mensagens
- Metadados das respostas

## 🔧 Personalização

### Modificar o Agente ID
Altere `AGNO_DEFAULT_AGENT_ID` para usar agentes diferentes.

### Customizar Interface
Edite `AIPage.jsx` para:
- Alterar cores e layout
- Adicionar funcionalidades específicas
- Implementar shortcuts/comandos rápidos

### Adicionar Contexto
No payload do chat, você pode incluir:
- Dados do cliente atual
- Informações do serviço
- Estado da aplicação
- Histórico relevante

## 🐛 Troubleshooting

### Agente não conecta
1. Verifique se o AgentOS está rodando
2. Confirme a URL e porta
3. Teste o endpoint `/health` diretamente

### Mensagens não chegam
1. Verifique os logs do backend
2. Confirme o `agent_id` correto
3. Teste a API do Agno diretamente

### Erros de CORS
Configure CORS no AgentOS ou use proxy no backend.

## 📚 Próximos Passos

1. **Implementar**: Siga este guia para ter o básico funcionando
2. **Personalizar**: Adapte para suas necessidades específicas
3. **Expandir**: Adicione funcionalidades como:
   - Upload de arquivos
   - Comandos específicos do OFIX
   - Integração com dados da plataforma
   - Notificações push

## 🎉 Vantagens desta Abordagem

- **Página Dedicada**: Espaço focado na IA
- **Fácil Expansão**: Adicione funcionalidades gradualmente
- **Isolamento**: Não interfere com o resto do sistema
- **Reutilização**: Seu agente funciona independente
- **Flexibilidade**: Pode conectar outros agentes facilmente

---

Está pronto para começar! A implementação está funcionando e você pode acessar em `/assistente-ia` 🚀