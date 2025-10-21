# Design Document

## Overview

Este documento descreve o design técnico para as melhorias do Assistente de IA do OFIX. O design foca em três pilares principais:

1. **Novas Funcionalidades**: Consultas de agendamentos, clientes, estoque e ordens de serviço via IA
2. **Arquitetura Melhorada**: Refatoração em hooks customizados, validação robusta e logging estruturado
3. **Otimização**: Performance, retry logic, debounce e limites de histórico

O sistema manterá a arquitetura atual (React frontend + Backend API + Agno AI Service) mas com melhorias significativas na organização do código e novas capacidades.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              AIPage Component (Refatorado)             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ ChatHeader   │  │ ChatMessages │  │  ChatInput  │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ VoiceConfig  │  │ QueryResults │  │ Suggestions │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Custom Hooks                         │ │
│  │  • useChatAPI      • useVoiceRecognition              │ │
│  │  • useChatHistory  • useVoiceSynthesis                │ │
│  │  • useAuthHeaders  • useQueryHandler                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Utils & Services                     │ │
│  │  • logger          • messageValidator                 │ │
│  │  • queryParser     • dataFormatter                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Agno Routes (Expandido)                   │ │
│  │  • /chat-inteligente    • /consultar-agendamentos     │ │
│  │  • /consultar-clientes  • /consultar-estoque          │ │
│  │  • /consultar-os        • /exportar-conversa          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              NLP & Intent Recognition                  │ │
│  │  • IntentClassifier     • EntityExtractor             │ │
│  │  • ContextManager       • ResponseFormatter           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agno AI Service (External)                  │
│                  matias-agno-assistant.onrender.com          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│  • Clientes  • Agendamentos  • Estoque  • Ordens Serviço   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → Validação → Sanitização → Hook useChatAPI
2. **useChatAPI** → Backend /chat-inteligente → NLP Processing
3. **NLP** → Intent Classification → Entity Extraction
4. **Backend** → Database Query (se necessário) → Response Formatting
5. **Backend** → Agno AI Service (para respostas conversacionais)
6. **Response** → Frontend → useChatHistory → UI Update


## Components and Interfaces

### Frontend Components

#### 1. AIPage (Main Component)
**Responsabilidade**: Orquestrar todos os sub-componentes e gerenciar estado global da página

**Props**: Nenhum (usa AuthContext)

**State Management**:
```javascript
{
  statusConexao: 'conectado' | 'conectando' | 'desconectado' | 'erro',
  modalClienteAberto: boolean,
  clientePrePreenchido: ClienteData | null,
  mostrarConfig: boolean,
  queryResults: QueryResult | null
}
```

**Hooks Utilizados**:
- `useAuth()` - Autenticação
- `useChatAPI()` - Comunicação com API
- `useChatHistory()` - Gerenciamento de histórico
- `useVoiceRecognition()` - Reconhecimento de voz
- `useVoiceSynthesis()` - Síntese de voz
- `useQueryHandler()` - Processamento de consultas

#### 2. ChatHeader
**Responsabilidade**: Exibir status, título e botões de ação

**Props**:
```typescript
interface ChatHeaderProps {
  statusConexao: ConnectionStatus;
  vozHabilitada: boolean;
  falando: boolean;
  onToggleVoz: () => void;
  onPararFala: () => void;
  onLimparHistorico: () => void;
  onToggleConfig: () => void;
  onReconectar: () => void;
}
```

#### 3. ChatMessages
**Responsabilidade**: Renderizar lista de mensagens com virtualização

**Props**:
```typescript
interface ChatMessagesProps {
  conversas: Conversa[];
  loading: boolean;
  onAbrirModal: (dados: ClienteData) => void;
  onExecutarAcao: (acao: string, dados: any) => void;
}
```

**Features**:
- Virtualização com react-window para performance
- Renderização condicional por tipo de mensagem
- Botões de ação contextuais (cadastrar cliente, ver detalhes, etc)

#### 4. MessageBubble
**Responsabilidade**: Renderizar uma mensagem individual

**Props**:
```typescript
interface MessageBubbleProps {
  conversa: Conversa;
  onAbrirModal?: (dados: ClienteData) => void;
  onExecutarAcao?: (acao: string, dados: any) => void;
}
```

**Tipos de Mensagem**:
- `usuario`: Mensagem do usuário (alinhada à direita)
- `agente`: Resposta do agente (alinhada à esquerda)
- `sistema`: Mensagens do sistema (centralizada)
- `erro`: Mensagens de erro (vermelho)
- `confirmacao`: Confirmações (verde)
- `cadastro`: Solicitação de cadastro (com botão)
- `consulta_cliente`: Resultado de consulta (com dados formatados)

#### 5. ChatInput
**Responsabilidade**: Input de mensagem com botões de ação

**Props**:
```typescript
interface ChatInputProps {
  mensagem: string;
  carregando: boolean;
  gravando: boolean;
  onMensagemChange: (msg: string) => void;
  onEnviar: () => void;
  onIniciarGravacao: () => void;
  onPararGravacao: () => void;
  suggestions: string[];
}
```

#### 6. VoiceConfigPanel
**Responsabilidade**: Painel de configurações de voz

**Props**:
```typescript
interface VoiceConfigPanelProps {
  vozesDisponiveis: SpeechSynthesisVoice[];
  vozSelecionada: SpeechSynthesisVoice | null;
  configVoz: VoiceConfig;
  modoContinuo: boolean;
  onVozChange: (voz: SpeechSynthesisVoice) => void;
  onConfigChange: (config: VoiceConfig) => void;
  onModoContinuoChange: (enabled: boolean) => void;
  onTestarVoz: () => void;
}
```

#### 7. QueryResultsPanel
**Responsabilidade**: Exibir resultados de consultas estruturadas

**Props**:
```typescript
interface QueryResultsPanelProps {
  tipo: 'agendamentos' | 'clientes' | 'estoque' | 'os';
  dados: any[];
  loading: boolean;
  onFechar: () => void;
  onDetalhes: (item: any) => void;
}
```

#### 8. SuggestionsBar
**Responsabilidade**: Barra de sugestões contextuais

**Props**:
```typescript
interface SuggestionsBarProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}
```

### Custom Hooks

#### 1. useAuthHeaders
**Responsabilidade**: Gerenciar headers de autenticação

**Interface**:
```typescript
interface UseAuthHeadersReturn {
  getAuthHeaders: () => Record<string, string>;
}

function useAuthHeaders(): UseAuthHeadersReturn
```

**Implementação**:
- Lê token do localStorage
- Valida token
- Retorna headers com Authorization Bearer
- Trata erros silenciosamente

#### 2. useChatAPI
**Responsabilidade**: Comunicação com API com retry e timeout

**Interface**:
```typescript
interface UseChatAPIReturn {
  enviarMensagem: (msg: string, contexto: Contexto[]) => Promise<Response>;
  verificarConexao: () => Promise<boolean>;
  carregarHistoricoServidor: (userId: string) => Promise<Mensagem[]>;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

function useChatAPI(getAuthHeaders: () => Headers): UseChatAPIReturn
```

**Features**:
- Retry automático com exponential backoff
- Timeout configurável (30s)
- Validação de mensagem antes de enviar
- Logging estruturado


#### 3. useChatHistory
**Responsabilidade**: Gerenciar histórico de conversas

**Interface**:
```typescript
interface UseChatHistoryReturn {
  conversas: Conversa[];
  loading: boolean;
  adicionarMensagem: (msg: Conversa) => void;
  adicionarMensagens: (msgs: Conversa[]) => void;
  limparHistorico: () => void;
  carregarHistorico: () => Promise<void>;
  obterContexto: (quantidade?: number) => Contexto[];
  buscarPorTipo: (tipo: string) => Conversa[];
  obterEstatisticas: () => Estatisticas;
}

function useChatHistory(userId: string): UseChatHistoryReturn
```

**Features**:
- Debounce de 1s para salvar no localStorage
- Limite de 100 mensagens
- Métodos de busca e filtro
- Estatísticas do histórico

#### 4. useVoiceRecognition
**Responsabilidade**: Reconhecimento de voz

**Interface**:
```typescript
interface UseVoiceRecognitionReturn {
  gravando: boolean;
  transcript: string;
  confidence: number;
  iniciarGravacao: () => void;
  pararGravacao: () => void;
  limparTranscript: () => void;
}

function useVoiceRecognition(
  modoContinuo: boolean,
  onResult: (text: string) => void
): UseVoiceRecognitionReturn
```

**Features**:
- Suporte a modo contínuo
- Filtro por confiança mínima
- Tratamento de erros
- Reinício automático no modo contínuo

#### 5. useVoiceSynthesis
**Responsabilidade**: Síntese de voz

**Interface**:
```typescript
interface UseVoiceSynthesisReturn {
  falando: boolean;
  vozesDisponiveis: SpeechSynthesisVoice[];
  vozSelecionada: SpeechSynthesisVoice | null;
  configVoz: VoiceConfig;
  falarTexto: (texto: string) => void;
  pararFala: () => void;
  setVozSelecionada: (voz: SpeechSynthesisVoice) => void;
  setConfigVoz: (config: VoiceConfig) => void;
}

function useVoiceSynthesis(
  vozHabilitada: boolean
): UseVoiceSynthesisReturn
```

**Features**:
- Limpeza de markdown para melhor pronúncia
- Configuração de velocidade, tom e volume
- Seleção de vozes em português
- Prevenção de eco (pausa reconhecimento durante fala)

#### 6. useQueryHandler (NOVO)
**Responsabilidade**: Processar e executar consultas estruturadas

**Interface**:
```typescript
interface UseQueryHandlerReturn {
  executarConsulta: (tipo: QueryType, params: any) => Promise<QueryResult>;
  loading: boolean;
  error: string | null;
}

type QueryType = 
  | 'agendamentos'
  | 'clientes'
  | 'estoque'
  | 'os'
  | 'relatorio';

interface QueryResult {
  tipo: QueryType;
  dados: any[];
  total: number;
  metadata?: any;
}

function useQueryHandler(getAuthHeaders: () => Headers): UseQueryHandlerReturn
```

**Features**:
- Roteamento de consultas para endpoints corretos
- Formatação de resultados
- Cache de consultas recentes
- Tratamento de erros específico por tipo

### Utility Functions

#### 1. logger
**Responsabilidade**: Sistema de logging estruturado

**Interface**:
```typescript
interface Logger {
  error(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  info(message: string, context?: object): void;
  debug(message: string, context?: object): void;
}
```

**Implementação**:
```javascript
class Logger {
  log(level, message, context) {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context
    };
    
    // Dev: console
    if (isDevelopment) {
      console[level](message, context);
    }
    
    // Prod: enviar para servidor
    if (!isDevelopment && level === 'error') {
      this.sendToServer(logData);
    }
  }
}
```

#### 2. messageValidator
**Responsabilidade**: Validar e sanitizar mensagens

**Interface**:
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: string;
}

function validarMensagem(mensagem: string): ValidationResult
```

**Validações**:
- Tamanho mínimo e máximo
- Caracteres permitidos
- Sanitização de HTML/XSS com DOMPurify
- Remoção de scripts maliciosos

#### 3. queryParser (NOVO)
**Responsabilidade**: Parsear intenções de consulta

**Interface**:
```typescript
interface ParsedQuery {
  tipo: QueryType;
  entidades: Entity[];
  filtros: Filter[];
  periodo?: DateRange;
}

interface Entity {
  tipo: 'cliente' | 'veiculo' | 'peca' | 'os';
  valor: string;
  confianca: number;
}

function parseQuery(mensagem: string): ParsedQuery
```

**Patterns Reconhecidos**:
- Agendamentos: "meus agendamentos", "compromissos hoje", "agenda da semana"
- Clientes: "buscar cliente João", "cliente CPF 123", "informações do cliente"
- Estoque: "verificar estoque", "tenho filtro de óleo?", "peças disponíveis"
- OS: "status da OS 123", "serviços em andamento", "ordens pendentes"

#### 4. dataFormatter (NOVO)
**Responsabilidade**: Formatar dados para exibição

**Interface**:
```typescript
function formatarAgendamento(agendamento: Agendamento): string
function formatarCliente(cliente: Cliente): string
function formatarEstoque(item: ItemEstoque): string
function formatarOS(os: OrdemServico): string
function formatarData(data: Date, formato?: string): string
function formatarMoeda(valor: number): string
```


## Data Models

### Frontend Models

#### Conversa
```typescript
interface Conversa {
  id: number;
  tipo: MessageType;
  conteudo: string;
  timestamp: string;
  metadata?: {
    dadosExtraidos?: any;
    queryResult?: QueryResult;
    acoes?: Acao[];
  };
}

type MessageType = 
  | 'usuario'
  | 'agente'
  | 'sistema'
  | 'erro'
  | 'confirmacao'
  | 'pergunta'
  | 'cadastro'
  | 'alerta'
  | 'consulta_cliente'
  | 'sucesso';
```

#### QueryResult
```typescript
interface QueryResult {
  tipo: QueryType;
  dados: any[];
  total: number;
  periodo?: DateRange;
  filtros?: Filter[];
  metadata?: {
    tempoResposta?: number;
    fonte?: string;
  };
}

type QueryType = 
  | 'agendamentos'
  | 'clientes'
  | 'estoque'
  | 'os'
  | 'relatorio';
```

#### Agendamento
```typescript
interface Agendamento {
  id: number;
  clienteId: number;
  clienteNome: string;
  veiculoPlaca?: string;
  dataHora: string;
  tipoServico: string;
  status: 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
  observacoes?: string;
  tecnicoResponsavel?: string;
}
```

#### Cliente
```typescript
interface Cliente {
  id: number;
  nomeCompleto: string;
  telefone: string;
  email?: string;
  cpfCnpj: string;
  endereco?: string;
  dataCadastro: string;
  ultimoServico?: string;
  totalServicos?: number;
}
```

#### ItemEstoque
```typescript
interface ItemEstoque {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  quantidadeMinima: number;
  localizacao?: string;
  preco: number;
  categoria?: string;
  fornecedor?: string;
}
```

#### OrdemServico
```typescript
interface OrdemServico {
  id: number;
  numero: string;
  clienteId: number;
  clienteNome: string;
  veiculoPlaca: string;
  veiculoModelo?: string;
  dataAbertura: string;
  dataConclusao?: string;
  status: 'aberta' | 'em_andamento' | 'aguardando_pecas' | 'concluida' | 'cancelada';
  tecnicoResponsavel: string;
  servicos: ServicoOS[];
  pecas: PecaOS[];
  valorTotal: number;
  observacoes?: string;
}

interface ServicoOS {
  descricao: string;
  valor: number;
}

interface PecaOS {
  nome: string;
  quantidade: number;
  valorUnitario: number;
}
```

#### VoiceConfig
```typescript
interface VoiceConfig {
  rate: number;    // 0.5 - 2.0
  pitch: number;   // 0.5 - 2.0
  volume: number;  // 0.0 - 1.0
}
```

#### Acao
```typescript
interface Acao {
  tipo: 'cadastrar' | 'editar' | 'visualizar' | 'exportar' | 'agendar';
  label: string;
  dados?: any;
  icone?: string;
}
```

### Backend Models

#### ChatRequest
```typescript
interface ChatRequest {
  message: string;
  usuario_id?: string;
  contexto_conversa?: Contexto[];
}

interface Contexto {
  tipo: string;
  conteudo: string;
}
```

#### ChatResponse
```typescript
interface ChatResponse {
  success: boolean;
  response: string;
  tipo: MessageType;
  dadosExtraidos?: any;
  metadata?: {
    intencao?: string;
    entidades?: Entity[];
    confianca?: number;
    tempoProcessamento?: number;
  };
}
```

#### ConsultaRequest
```typescript
interface ConsultaAgendamentosRequest {
  usuario_id: string;
  periodo?: {
    inicio: string;
    fim: string;
  };
  status?: string[];
}

interface ConsultaClientesRequest {
  usuario_id: string;
  busca?: string;
  cpfCnpj?: string;
  telefone?: string;
}

interface ConsultaEstoqueRequest {
  usuario_id: string;
  busca?: string;
  categoria?: string;
  estoqueMinimo?: boolean;
}

interface ConsultaOSRequest {
  usuario_id: string;
  numero?: string;
  status?: string[];
  clienteId?: number;
}
```

## Error Handling

### Error Types

```typescript
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
  context?: object;
}
```

### Error Handling Strategy

1. **Validation Errors**: Exibir toast vermelho com mensagem clara
2. **Network Errors**: Retry automático até 3 vezes
3. **Timeout Errors**: Cancelar requisição e informar usuário
4. **Authentication Errors**: Redirecionar para login
5. **Server Errors**: Exibir mensagem genérica e logar detalhes
6. **Not Found**: Sugerir ações alternativas

### Error Messages

```javascript
const ERROR_MESSAGES = {
  VALIDATION_ERROR: {
    EMPTY_MESSAGE: 'Mensagem não pode estar vazia',
    TOO_LONG: 'Mensagem muito longa (máximo 1000 caracteres)',
    INVALID_CHARS: 'Mensagem contém caracteres inválidos'
  },
  NETWORK_ERROR: {
    OFFLINE: 'Você está offline. Verifique sua conexão.',
    TIMEOUT: 'Tempo limite excedido. Tente novamente.',
    FAILED: 'Erro de conexão. Tentando novamente...'
  },
  SERVER_ERROR: {
    GENERIC: 'Erro no servidor. Tente novamente em instantes.',
    SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível'
  },
  NOT_FOUND: {
    CLIENTE: 'Cliente não encontrado. Deseja cadastrar?',
    AGENDAMENTO: 'Nenhum agendamento encontrado para este período',
    ESTOQUE: 'Peça não encontrada no estoque',
    OS: 'Ordem de serviço não encontrada'
  }
};
```


## Testing Strategy

### Unit Tests

#### Hooks
```javascript
// useChatAPI.test.js
describe('useChatAPI', () => {
  it('deve enviar mensagem com sucesso', async () => {
    const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));
    await act(async () => {
      const response = await result.current.enviarMensagem('Olá');
      expect(response.success).toBe(true);
    });
  });

  it('deve fazer retry em caso de falha', async () => {
    // Mock fetch para falhar 2 vezes e suceder na 3ª
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));
    await act(async () => {
      const response = await result.current.enviarMensagem('Olá');
      expect(response.success).toBe(true);
    });
    
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('deve respeitar timeout', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useChatAPI(mockGetAuthHeaders));
    
    const promise = result.current.enviarMensagem('Olá');
    jest.advanceTimersByTime(31000); // > 30s timeout
    
    await expect(promise).rejects.toThrow('Tempo limite excedido');
  });
});

// useChatHistory.test.js
describe('useChatHistory', () => {
  it('deve adicionar mensagem ao histórico', () => {
    const { result } = renderHook(() => useChatHistory('user123'));
    act(() => {
      result.current.adicionarMensagem({
        id: 1,
        tipo: 'usuario',
        conteudo: 'Teste',
        timestamp: new Date().toISOString()
      });
    });
    expect(result.current.conversas).toHaveLength(1);
  });

  it('deve limitar histórico a 100 mensagens', () => {
    const { result } = renderHook(() => useChatHistory('user123'));
    act(() => {
      for (let i = 0; i < 150; i++) {
        result.current.adicionarMensagem({
          id: i,
          tipo: 'usuario',
          conteudo: `Mensagem ${i}`,
          timestamp: new Date().toISOString()
        });
      }
    });
    expect(result.current.conversas).toHaveLength(100);
  });

  it('deve salvar com debounce', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useChatHistory('user123'));
    
    act(() => {
      result.current.adicionarMensagem({ id: 1, tipo: 'usuario', conteudo: 'A', timestamp: '' });
      result.current.adicionarMensagem({ id: 2, tipo: 'usuario', conteudo: 'B', timestamp: '' });
    });
    
    // Não deve ter salvado ainda
    expect(localStorage.setItem).not.toHaveBeenCalled();
    
    // Avançar tempo do debounce
    jest.advanceTimersByTime(1000);
    
    // Agora deve ter salvado
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
  });
});
```

#### Utils
```javascript
// messageValidator.test.js
describe('validarMensagem', () => {
  it('deve validar mensagem válida', () => {
    const result = validarMensagem('Olá, como vai?');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('deve rejeitar mensagem vazia', () => {
    const result = validarMensagem('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Mensagem não pode estar vazia');
  });

  it('deve rejeitar mensagem muito longa', () => {
    const longMessage = 'a'.repeat(1001);
    const result = validarMensagem(longMessage);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('muito longa');
  });

  it('deve sanitizar HTML', () => {
    const result = validarMensagem('<script>alert("xss")</script>Olá');
    expect(result.sanitized).not.toContain('<script>');
    expect(result.sanitized).toContain('Olá');
  });
});

// queryParser.test.js
describe('parseQuery', () => {
  it('deve identificar consulta de agendamentos', () => {
    const result = parseQuery('mostrar meus agendamentos de hoje');
    expect(result.tipo).toBe('agendamentos');
    expect(result.periodo).toBeDefined();
  });

  it('deve extrair nome de cliente', () => {
    const result = parseQuery('buscar cliente João Silva');
    expect(result.tipo).toBe('clientes');
    expect(result.entidades).toContainEqual({
      tipo: 'cliente',
      valor: 'João Silva',
      confianca: expect.any(Number)
    });
  });

  it('deve identificar consulta de estoque', () => {
    const result = parseQuery('verificar estoque de filtro de óleo');
    expect(result.tipo).toBe('estoque');
    expect(result.entidades[0].valor).toContain('filtro de óleo');
  });
});
```

### Integration Tests

```javascript
// AIPage.integration.test.js
describe('AIPage Integration', () => {
  it('deve enviar mensagem e receber resposta', async () => {
    render(<AIPage />);
    
    const input = screen.getByPlaceholderText(/digite sua pergunta/i);
    const button = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: 'Olá' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/olá/i)).toBeInTheDocument();
    });
  });

  it('deve consultar agendamentos', async () => {
    render(<AIPage />);
    
    const input = screen.getByPlaceholderText(/digite sua pergunta/i);
    fireEvent.change(input, { target: { value: 'meus agendamentos de hoje' } });
    fireEvent.submit(input);
    
    await waitFor(() => {
      expect(screen.getByText(/agendamentos/i)).toBeInTheDocument();
    });
  });

  it('deve abrir modal de cadastro ao detectar intenção', async () => {
    render(<AIPage />);
    
    const input = screen.getByPlaceholderText(/digite sua pergunta/i);
    fireEvent.change(input, { 
      target: { value: 'cadastrar cliente João Silva telefone 11999999999' } 
    });
    fireEvent.submit(input);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
    });
  });

  it('deve fazer retry em caso de erro de rede', async () => {
    // Mock fetch para falhar 2 vezes
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, response: 'Sucesso' })
      });

    render(<AIPage />);
    
    const input = screen.getByPlaceholderText(/digite sua pergunta/i);
    fireEvent.change(input, { target: { value: 'Olá' } });
    fireEvent.submit(input);
    
    await waitFor(() => {
      expect(screen.getByText(/sucesso/i)).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
```

### E2E Tests

```javascript
// aipage.e2e.test.js
describe('AIPage E2E', () => {
  it('deve completar fluxo de consulta de cliente', async () => {
    await page.goto('http://localhost:3000/ai');
    
    // Login
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Aguardar carregar
    await page.waitForSelector('.chat-container');
    
    // Enviar consulta
    await page.fill('[placeholder*="digite sua pergunta"]', 'buscar cliente João');
    await page.click('button[aria-label="Enviar"]');
    
    // Verificar resposta
    await page.waitForSelector('.message-bubble:has-text("João")');
    
    // Verificar dados do cliente
    expect(await page.textContent('.cliente-info')).toContain('Telefone');
    expect(await page.textContent('.cliente-info')).toContain('Email');
  });

  it('deve usar reconhecimento de voz', async () => {
    await page.goto('http://localhost:3000/ai');
    
    // Mock getUserMedia
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.resolve({});
    });
    
    // Clicar no botão de microfone
    await page.click('button[aria-label="Gravar"]');
    
    // Verificar indicador de gravação
    expect(await page.isVisible('.recording-indicator')).toBe(true);
    
    // Simular resultado de reconhecimento
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('speechresult', {
        detail: { transcript: 'meus agendamentos' }
      }));
    });
    
    // Verificar input preenchido
    expect(await page.inputValue('[placeholder*="digite sua pergunta"]'))
      .toContain('meus agendamentos');
  });
});
```

### Performance Tests

```javascript
// performance.test.js
describe('Performance', () => {
  it('deve renderizar 100 mensagens em menos de 1s', () => {
    const start = performance.now();
    
    const { rerender } = render(<ChatMessages conversas={[]} />);
    
    const mensagens = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      tipo: 'usuario',
      conteudo: `Mensagem ${i}`,
      timestamp: new Date().toISOString()
    }));
    
    rerender(<ChatMessages conversas={mensagens} />);
    
    const end = performance.now();
    expect(end - start).toBeLessThan(1000);
  });

  it('deve salvar no localStorage com debounce', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useChatHistory('user123'));
    
    const start = performance.now();
    
    // Adicionar 10 mensagens rapidamente
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.adicionarMensagem({
          id: i,
          tipo: 'usuario',
          conteudo: `Msg ${i}`,
          timestamp: ''
        });
      }
    });
    
    // Deve ter chamado setItem apenas 1 vez após debounce
    jest.advanceTimersByTime(1000);
    
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
  });
});
```


## Backend API Design

### New Endpoints

#### 1. POST /agno/consultar-agendamentos
**Descrição**: Consulta agendamentos do usuário

**Request**:
```json
{
  "usuario_id": "123",
  "periodo": {
    "inicio": "2025-10-20T00:00:00Z",
    "fim": "2025-10-27T23:59:59Z"
  },
  "status": ["pendente", "confirmado"]
}
```

**Response**:
```json
{
  "success": true,
  "agendamentos": [
    {
      "id": 1,
      "clienteNome": "João Silva",
      "dataHora": "2025-10-21T14:00:00Z",
      "tipoServico": "Revisão",
      "status": "confirmado",
      "veiculoPlaca": "ABC-1234"
    }
  ],
  "total": 1,
  "periodo": {
    "inicio": "2025-10-20T00:00:00Z",
    "fim": "2025-10-27T23:59:59Z"
  }
}
```

#### 2. POST /agno/consultar-clientes
**Descrição**: Busca clientes por nome, CPF ou telefone

**Request**:
```json
{
  "usuario_id": "123",
  "busca": "João Silva",
  "cpfCnpj": "123.456.789-00",
  "telefone": "(11) 99999-9999"
}
```

**Response**:
```json
{
  "success": true,
  "clientes": [
    {
      "id": 1,
      "nomeCompleto": "João Silva",
      "telefone": "(11) 99999-9999",
      "email": "joao@email.com",
      "cpfCnpj": "123.456.789-00",
      "ultimoServico": "2025-10-15",
      "totalServicos": 5
    }
  ],
  "total": 1
}
```

#### 3. POST /agno/consultar-estoque
**Descrição**: Consulta itens do estoque

**Request**:
```json
{
  "usuario_id": "123",
  "busca": "filtro de óleo",
  "categoria": "filtros",
  "estoqueMinimo": true
}
```

**Response**:
```json
{
  "success": true,
  "itens": [
    {
      "id": 1,
      "codigo": "FLT-001",
      "nome": "Filtro de Óleo Mann W719/30",
      "quantidade": 15,
      "quantidadeMinima": 5,
      "localizacao": "Prateleira A3",
      "preco": 45.90,
      "categoria": "Filtros"
    }
  ],
  "total": 1,
  "alertas": {
    "estoqueMinimo": 0,
    "semEstoque": 0
  }
}
```

#### 4. POST /agno/consultar-os
**Descrição**: Consulta ordens de serviço

**Request**:
```json
{
  "usuario_id": "123",
  "numero": "OS-2025-001",
  "status": ["aberta", "em_andamento"],
  "clienteId": 1
}
```

**Response**:
```json
{
  "success": true,
  "ordensServico": [
    {
      "id": 1,
      "numero": "OS-2025-001",
      "clienteNome": "João Silva",
      "veiculoPlaca": "ABC-1234",
      "veiculoModelo": "Fiat Uno 2020",
      "dataAbertura": "2025-10-20T08:00:00Z",
      "status": "em_andamento",
      "tecnicoResponsavel": "Carlos",
      "servicos": [
        { "descricao": "Troca de óleo", "valor": 150.00 }
      ],
      "pecas": [
        { "nome": "Óleo 5W30", "quantidade": 4, "valorUnitario": 35.00 }
      ],
      "valorTotal": 290.00
    }
  ],
  "total": 1
}
```

#### 5. POST /agno/exportar-conversa
**Descrição**: Exporta histórico de conversa

**Request**:
```json
{
  "usuario_id": "123",
  "formato": "pdf",
  "periodo": {
    "inicio": "2025-10-01T00:00:00Z",
    "fim": "2025-10-20T23:59:59Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "arquivo": {
    "url": "https://storage.../conversa-2025-10-20.pdf",
    "nome": "conversa-2025-10-20.pdf",
    "tamanho": 245678,
    "expiraEm": "2025-10-21T00:00:00Z"
  }
}
```

### Enhanced NLP Processing

#### Intent Classification
```javascript
const INTENTS = {
  CONSULTAR_AGENDAMENTOS: {
    patterns: [
      /meus?\s+agendamentos?/i,
      /compromissos?\s+(de\s+)?hoje/i,
      /agenda\s+(da\s+)?semana/i,
      /quando\s+(é|tenho)\s+meu\s+próximo/i
    ],
    confidence: 0.8
  },
  CONSULTAR_CLIENTES: {
    patterns: [
      /buscar\s+cliente/i,
      /informações?\s+(do|da)\s+cliente/i,
      /cliente\s+cpf/i,
      /dados\s+(do|da)\s+cliente/i
    ],
    confidence: 0.8
  },
  CONSULTAR_ESTOQUE: {
    patterns: [
      /verificar\s+estoque/i,
      /tenho\s+.+\s+em\s+estoque/i,
      /quantidade\s+(de|da)/i,
      /peças?\s+disponíveis?/i
    ],
    confidence: 0.8
  },
  CONSULTAR_OS: {
    patterns: [
      /status\s+(da\s+)?os/i,
      /ordem\s+(de\s+)?serviço/i,
      /serviços?\s+em\s+andamento/i,
      /os\s+\d+/i
    ],
    confidence: 0.8
  },
  CADASTRAR_CLIENTE: {
    patterns: [
      /cadastrar\s+(novo\s+)?cliente/i,
      /adicionar\s+cliente/i,
      /novo\s+cliente/i
    ],
    confidence: 0.9
  }
};

function classifyIntent(message) {
  let bestMatch = null;
  let highestConfidence = 0;

  for (const [intent, config] of Object.entries(INTENTS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        if (config.confidence > highestConfidence) {
          highestConfidence = config.confidence;
          bestMatch = intent;
        }
      }
    }
  }

  return {
    intent: bestMatch,
    confidence: highestConfidence
  };
}
```

#### Entity Extraction
```javascript
function extractEntities(message) {
  const entities = [];

  // Extrair nome de cliente
  const nomeMatch = message.match(/cliente\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+cpf|\s+telefone|$)/i);
  if (nomeMatch) {
    entities.push({
      tipo: 'cliente',
      campo: 'nome',
      valor: nomeMatch[1].trim(),
      confianca: 0.9
    });
  }

  // Extrair CPF
  const cpfMatch = message.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
  if (cpfMatch) {
    entities.push({
      tipo: 'cliente',
      campo: 'cpf',
      valor: cpfMatch[0],
      confianca: 1.0
    });
  }

  // Extrair telefone
  const telefoneMatch = message.match(/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/);
  if (telefoneMatch) {
    entities.push({
      tipo: 'cliente',
      campo: 'telefone',
      valor: telefoneMatch[0],
      confianca: 1.0
    });
  }

  // Extrair placa
  const placaMatch = message.match(/[A-Z]{3}-?\d{4}/i);
  if (placaMatch) {
    entities.push({
      tipo: 'veiculo',
      campo: 'placa',
      valor: placaMatch[0].toUpperCase(),
      confianca: 1.0
    });
  }

  // Extrair número de OS
  const osMatch = message.match(/os\s*(\d+)/i);
  if (osMatch) {
    entities.push({
      tipo: 'os',
      campo: 'numero',
      valor: osMatch[1],
      confianca: 1.0
    });
  }

  // Extrair período temporal
  const periodoMatch = message.match(/(hoje|amanhã|semana|mês)/i);
  if (periodoMatch) {
    entities.push({
      tipo: 'periodo',
      campo: 'tipo',
      valor: periodoMatch[1].toLowerCase(),
      confianca: 0.9
    });
  }

  return entities;
}
```

#### Response Formatting
```javascript
function formatResponse(tipo, dados) {
  switch (tipo) {
    case 'agendamentos':
      return formatarAgendamentos(dados);
    case 'clientes':
      return formatarClientes(dados);
    case 'estoque':
      return formatarEstoque(dados);
    case 'os':
      return formatarOS(dados);
    default:
      return dados;
  }
}

function formatarAgendamentos(agendamentos) {
  if (agendamentos.length === 0) {
    return 'Você não tem agendamentos para este período.';
  }

  let response = `📅 **Seus Agendamentos** (${agendamentos.length})\n\n`;
  
  agendamentos.forEach((ag, index) => {
    const data = new Date(ag.dataHora);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    response += `${index + 1}. **${ag.clienteNome}**\n`;
    response += `   📆 ${dataFormatada} às ${horaFormatada}\n`;
    response += `   🔧 ${ag.tipoServico}\n`;
    response += `   🚗 ${ag.veiculoPlaca || 'N/A'}\n`;
    response += `   ✅ Status: ${ag.status}\n\n`;
  });

  return response;
}

function formatarClientes(clientes) {
  if (clientes.length === 0) {
    return 'Nenhum cliente encontrado. Deseja cadastrar um novo cliente?';
  }

  if (clientes.length === 1) {
    const c = clientes[0];
    return `👤 **${c.nomeCompleto}**\n\n` +
           `📞 Telefone: ${c.telefone}\n` +
           `📧 Email: ${c.email || 'N/A'}\n` +
           `🆔 CPF/CNPJ: ${c.cpfCnpj}\n` +
           `📊 Total de Serviços: ${c.totalServicos || 0}\n` +
           `📅 Último Serviço: ${c.ultimoServico ? new Date(c.ultimoServico).toLocaleDateString('pt-BR') : 'N/A'}`;
  }

  let response = `👥 **Clientes Encontrados** (${clientes.length})\n\n`;
  clientes.forEach((c, index) => {
    response += `${index + 1}. **${c.nomeCompleto}**\n`;
    response += `   📞 ${c.telefone}\n`;
    response += `   🆔 ${c.cpfCnpj}\n\n`;
  });

  return response;
}
```


## Security Considerations

### Input Validation
- Validar tamanho máximo de mensagens (1000 caracteres)
- Sanitizar HTML e scripts com DOMPurify
- Validar formato de CPF, telefone, email com regex
- Escapar caracteres especiais em queries SQL

### Authentication
- JWT tokens com expiração de 24h
- Refresh tokens para renovação automática
- Validação de token em todas as requisições
- Logout automático após expiração

### Authorization
- Verificar permissões do usuário antes de consultas
- Filtrar dados por usuário logado
- Não expor dados de outros usuários
- Rate limiting por usuário

### Data Protection
- Não logar dados sensíveis (senhas, tokens completos)
- Criptografar dados sensíveis no localStorage
- HTTPS obrigatório em produção
- CORS configurado corretamente

### XSS Prevention
```javascript
// Sanitizar antes de renderizar
import DOMPurify from 'dompurify';

function renderMessage(content) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: []
  });
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### SQL Injection Prevention
```javascript
// Usar prepared statements
async function buscarCliente(cpf) {
  return await prisma.cliente.findFirst({
    where: { cpfCnpj: cpf }
  });
}
```

### Rate Limiting
```javascript
// Backend middleware
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // 20 requisições por minuto
  message: 'Muitas requisições. Tente novamente em instantes.'
});

app.post('/agno/chat-inteligente', chatLimiter, async (req, res) => {
  // ...
});
```

## Performance Optimizations

### Frontend Optimizations

#### 1. React.memo para Componentes
```javascript
const MessageBubble = React.memo(({ conversa }) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.conversa.id === nextProps.conversa.id;
});
```

#### 2. Virtualização de Lista
```javascript
import { FixedSizeList } from 'react-window';

function ChatMessages({ conversas }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <MessageBubble conversa={conversas[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={conversas.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

#### 3. Debounce de Auto-Save
```javascript
import { debounce } from 'lodash';

const salvarLocal = useMemo(
  () => debounce((conversas) => {
    localStorage.setItem(storageKey, JSON.stringify(conversas));
  }, 1000),
  [storageKey]
);
```

#### 4. Lazy Loading de Componentes
```javascript
const VoiceConfigPanel = lazy(() => import('./VoiceConfigPanel'));
const QueryResultsPanel = lazy(() => import('./QueryResultsPanel'));

function AIPage() {
  return (
    <Suspense fallback={<Loading />}>
      {mostrarConfig && <VoiceConfigPanel />}
      {queryResults && <QueryResultsPanel />}
    </Suspense>
  );
}
```

#### 5. Code Splitting
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'voice': ['./src/hooks/useVoiceRecognition', './src/hooks/useVoiceSynthesis'],
          'chat': ['./src/hooks/useChatAPI', './src/hooks/useChatHistory'],
          'vendor': ['react', 'react-dom', 'lodash']
        }
      }
    }
  }
});
```

### Backend Optimizations

#### 1. Database Indexing
```sql
-- Índices para consultas rápidas
CREATE INDEX idx_agendamentos_usuario_data ON agendamentos(usuario_id, data_hora);
CREATE INDEX idx_clientes_cpf ON clientes(cpf_cnpj);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_os_numero ON ordens_servico(numero);
CREATE INDEX idx_os_status ON ordens_servico(status);
```

#### 2. Query Optimization
```javascript
// Usar select específico ao invés de *
async function buscarAgendamentos(usuarioId, periodo) {
  return await prisma.agendamento.findMany({
    where: {
      usuarioId,
      dataHora: {
        gte: periodo.inicio,
        lte: periodo.fim
      }
    },
    select: {
      id: true,
      clienteNome: true,
      dataHora: true,
      tipoServico: true,
      status: true,
      veiculoPlaca: true
    },
    orderBy: { dataHora: 'asc' }
  });
}
```

#### 3. Caching
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

async function buscarClienteComCache(cpf) {
  const cacheKey = `cliente:${cpf}`;
  
  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Buscar no banco
  const cliente = await prisma.cliente.findFirst({
    where: { cpfCnpj: cpf }
  });
  
  // Salvar no cache
  if (cliente) {
    cache.set(cacheKey, cliente);
  }
  
  return cliente;
}
```

#### 4. Connection Pooling
```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pooling
  connection_limit = 10
  pool_timeout = 20
}
```

## Deployment Considerations

### Environment Variables
```bash
# Frontend (.env)
VITE_API_BASE_URL=https://api.ofix.com
VITE_AGNO_SERVICE_URL=https://matias-agno-assistant.onrender.com
VITE_ENV=production

# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/ofix
JWT_SECRET=your-secret-key
AGNO_AGENT_ID=oficinaia
NODE_ENV=production
PORT=1000
```

### Build Configuration
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', '@/components/ui']
        }
      }
    }
  }
});
```

### Monitoring
```javascript
// Sentry para error tracking
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_ENV,
  tracesSampleRate: 0.1
});

// Logger com envio para servidor
class Logger {
  error(message, context) {
    console.error(message, context);
    
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(new Error(message), {
        extra: context
      });
    }
  }
}
```

## Migration Strategy

### Phase 1: Preparação (Semana 1)
1. Criar novos hooks customizados
2. Implementar sistema de logging
3. Adicionar validação e sanitização
4. Criar testes unitários para utils

### Phase 2: Refatoração (Semana 2)
1. Extrair componentes menores da AIPage
2. Migrar lógica para hooks
3. Adicionar constantes e configurações
4. Implementar retry logic e timeout

### Phase 3: Novas Funcionalidades (Semana 3)
1. Implementar endpoints de consulta no backend
2. Adicionar NLP processing melhorado
3. Criar componentes de exibição de resultados
4. Implementar sugestões contextuais

### Phase 4: Testes e Otimização (Semana 4)
1. Testes de integração
2. Testes E2E
3. Otimizações de performance
4. Documentação final

### Rollback Plan
- Manter versão antiga em branch separada
- Feature flags para novas funcionalidades
- Monitoramento de erros em produção
- Rollback automático se taxa de erro > 5%

