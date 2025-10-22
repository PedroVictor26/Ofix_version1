# 🤖 DESCRIÇÃO COMPLETA - CHAT IA OFIX

## 📋 VISÃO GERAL

**Nome:** Assistente IA OFIX - Matias  
**Plataforma:** Sistema de gestão para oficinas automotivas  
**Tecnologia:** Agno AI + Groq LLaMA 3.1 + LanceDB (base de conhecimento)  
**Público:** Mecânicos, atendentes e gestores de oficinas

---

## 🎯 FUNCIONALIDADES PRINCIPAIS

### 1. **Processamento de Linguagem Natural (NLP)**
- Detecta intenções do usuário automaticamente
- Extrai entidades (nomes, datas, valores, serviços)
- Classifica consultas em categorias:
  - Consulta de preços
  - Agendamentos
  - Consulta de clientes
  - Consulta de estoque
  - Consulta de ordens de serviço (OS)
  - Estatísticas
  - Ajuda geral

### 2. **Interação por Voz**
- **Reconhecimento de voz:** Transcreve fala em texto
- **Síntese de voz:** Lê respostas em voz alta
- **Configurações ajustáveis:**
  - Velocidade da fala (0.5x a 2x)
  - Tom de voz (0.5 a 2)
  - Volume (0% a 100%)
  - Seleção de voz (português)
  - Modo contínuo (escuta automática)

### 3. **Consultas Inteligentes**
- **Clientes:** Busca por nome, CPF, telefone
- **Ordens de Serviço:** Status, histórico, detalhes
- **Estoque:** Disponibilidade de peças
- **Preços:** Valores de serviços e peças
- **Agendamentos:** Criar e consultar agendamentos

### 4. **Cadastro Assistido por IA**
- Extrai dados de clientes da conversa
- Pré-preenche formulários automaticamente
- Detecta quando cliente não existe
- Abre modal de cadastro com dados extraídos

### 5. **Histórico de Conversas**
- Salva conversas localmente (localStorage)
- Sincroniza com backend
- Mantém contexto entre sessões
- Botão para limpar histórico

---

## 🎨 INTERFACE ATUAL

### Header
- Logo e nome do assistente
- **Indicador de status** (Online/Offline/Conectando)
  - Verde com pulso quando conectado
  - Amarelo quando conectando
  - Vermelho quando erro
- Botões de ação:
  - Ativar/desativar voz
  - Parar fala
  - Limpar histórico
  - Configurações de voz
  - Reconectar

### Área de Chat
- **Mensagens do usuário:** Azul, alinhadas à direita
- **Mensagens do assistente:** Cinza, alinhadas à esquerda
- **Tipos de mensagem com cores:**
  - Confirmação: Verde
  - Erro: Vermelho
  - Pergunta: Amarelo
  - Sistema: Verde
  - Cadastro/Alerta: Roxo
  - Consulta cliente: Ciano

### Botões de Sugestão Rápida
- 👤 Buscar cliente por nome ou CPF
- 📅 Agendar serviço
- 🔧 Status da OS
- 📦 Consultar peças em estoque
- 💰 Calcular orçamento

### Indicador de Carregamento
- 3 bolinhas animadas
- Texto: "Matias está pensando..."
- Animação de bounce sequencial

### Área de Input
- Campo de texto para mensagem
- Botão de microfone (gravar voz)
- Botão de enviar
- Contador de caracteres
- Validação de mensagem

---

## 🔧 CAPACIDADES TÉCNICAS

### Backend
- **Endpoint principal:** `/api/agno/chat-inteligente`
- **Processamento NLP:** Local + Agno AI
- **Base de conhecimento:** LanceDB com dados automotivos
- **Fallback:** Respostas locais se Agno falhar

### Frontend
- **Framework:** React + Vite
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Hooks customizados:**
  - `useAuthHeaders` - Autenticação
  - `useChatAPI` - Comunicação com API
  - `useChatHistory` - Gerenciamento de histórico
  - `useVoiceRecognition` - Reconhecimento de voz
  - `useVoiceSynthesis` - Síntese de voz

### Validações
- Tamanho mínimo/máximo de mensagem
- Sanitização de entrada
- Detecção de spam
- Rate limiting
- Logging estruturado

---

## 💬 EXEMPLOS DE USO

### Consulta de Preço
**Usuário:** "Quanto custa uma troca de óleo?"  
**Matias:** Retorna tabela de preços por tipo de veículo

### Agendamento
**Usuário:** "Agendar revisão para o Gol do João na segunda às 14h"  
**Matias:** 
1. Busca cliente João
2. Identifica veículo Gol
3. Calcula próxima segunda-feira
4. Verifica disponibilidade
5. Cria agendamento
6. Confirma com detalhes

### Consulta de Cliente
**Usuário:** "Buscar cliente João Silva"  
**Matias:** Retorna dados do cliente + veículos cadastrados

### Cadastro Assistido
**Usuário:** "Cadastrar cliente Maria Santos, telefone 11 98765-4321"  
**Matias:** 
1. Extrai nome e telefone
2. Verifica se cliente existe
3. Abre modal pré-preenchido
4. Usuário completa dados
5. Salva no sistema

---

## 🎯 DIFERENCIAIS

### 1. **Inteligência Contextual**
- Entende linguagem natural
- Não precisa de comandos específicos
- Adapta respostas ao contexto

### 2. **Multimodal**
- Texto + Voz
- Flexibilidade de uso
- Acessibilidade

### 3. **Integração Completa**
- Conectado ao banco de dados real
- Acessa clientes, OS, estoque
- Executa ações reais no sistema

### 4. **Feedback Visual Rico**
- Cores por tipo de mensagem
- Animações suaves
- Indicadores de status claros
- Toast notifications

### 5. **Experiência Profissional**
- Interface polida
- Respostas rápidas
- Fallback inteligente
- Nunca deixa usuário sem resposta

---

## 📊 MÉTRICAS E PERFORMANCE

### Tempo de Resposta
- **Local (fallback):** < 100ms
- **Agno AI:** 2-5 segundos
- **Com cold start:** até 30s (primeira requisição)

### Precisão NLP
- **Detecção de intenção:** ~85-90%
- **Extração de entidades:** ~80-85%
- **Classificação de consultas:** ~90%

### Disponibilidade
- **Backend:** 99.5%
- **Agno AI:** 98%
- **Fallback local:** 100%

---

## 🔒 SEGURANÇA

- Autenticação JWT
- Validação de entrada
- Sanitização de dados
- Rate limiting
- Logging de auditoria
- Dados sensíveis protegidos

---

## 🚀 TECNOLOGIAS UTILIZADAS

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide Icons
- Web Speech API

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication

### IA
- Agno Framework
- Groq LLaMA 3.1
- LanceDB (vector database)
- NLP local (fallback)

---

## 📈 ROADMAP FUTURO

### Curto Prazo
- Histórico pesquisável
- Atalhos de teclado
- Sugestões contextuais

### Médio Prazo
- Modo compacto
- Ações inline nas respostas
- Temas personalizáveis

### Longo Prazo
- Múltiplos idiomas
- Integração com WhatsApp
- Dashboard de analytics

---

## 💡 CASOS DE USO PRINCIPAIS

1. **Atendimento Rápido:** Cliente liga, atendente usa voz para consultar
2. **Agendamento Express:** Agendar serviço em segundos
3. **Consulta de Estoque:** Verificar peças disponíveis rapidamente
4. **Cadastro Ágil:** Cadastrar cliente durante ligação
5. **Orçamento Instantâneo:** Calcular valores na hora

---

**Versão:** 2.0  
**Última Atualização:** 21/10/2025  
**Status:** ✅ Produção
