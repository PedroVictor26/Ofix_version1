# 🔧 Guia de Integração - Componentes do Chat

## 📦 Componentes Criados

### 1. MessageBubble ✅
**Arquivo:** `src/components/chat/MessageBubble.jsx`

**Features:**
- ✅ Suporte a múltiplos tipos de mensagem
- ✅ Cores e ícones contextuais
- ✅ Botões de ação (cadastrar cliente)
- ✅ Timestamp formatado
- ✅ React.memo para performance

**Uso:**
```jsx
import MessageBubble from './components/chat/MessageBubble';

<MessageBubble 
  conversa={{
    id: 1,
    tipo: 'usuario',
    conteudo: 'Olá!',
    timestamp: new Date().toISOString(),
    metadata: {}
  }}
  onAbrirModal={(dados) => console.log('Abrir modal', dados)}
  onExecutarAcao={(acao, dados) => console.log('Executar', acao, dados)}
/>
```

### 2. ChatHeader ✅
**Arquivo:** `src/components/chat/ChatHeader.jsx`

**Features:**
- ✅ Status de conexão visual
- ✅ Botões de ação (voz, limpar, config)
- ✅ Logo e título
- ✅ Indicador de fala

**Uso:**
```jsx
import ChatHeader from './components/chat/ChatHeader';

<ChatHeader
  statusConexao="conectado"
  vozHabilitada={true}
  falando={false}
  onToggleVoz={() => setVozHabilitada(!vozHabilitada)}
  onPararFala={() => pararFala()}
  onLimparHistorico={() => limparHistorico()}
  onToggleConfig={() => setMostrarConfig(!mostrarConfig)}
  onReconectar={() => verificarConexao()}
/>
```

## 🔄 Como Integrar na AIPage

### Passo 1: Importar Componentes

```jsx
// No topo da AIPage.jsx
import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble from '../components/chat/MessageBubble';
```

### Passo 2: Substituir Header Atual

**Antes:**
```jsx
<div className="bg-white rounded-xl shadow-sm border...">
  {/* Todo o código do header */}
</div>
```

**Depois:**
```jsx
<ChatHeader
  statusConexao={statusConexao}
  vozHabilitada={vozHabilitada}
  falando={falando}
  onToggleVoz={alternarVoz}
  onPararFala={pararFala}
  onLimparHistorico={limparHistorico}
  onToggleConfig={() => setMostrarConfig(!mostrarConfig)}
  onReconectar={verificarConexao}
/>
```

### Passo 3: Substituir Renderização de Mensagens

**Antes:**
```jsx
{conversas.map((conversa) => (
  <div key={conversa.id} className="flex gap-3...">
    {/* Todo o código da mensagem */}
  </div>
))}
```

**Depois:**
```jsx
{conversas.map((conversa) => (
  <MessageBubble
    key={conversa.id}
    conversa={conversa}
    onAbrirModal={setClientePrePreenchido}
    onExecutarAcao={(acao, dados) => {
      // Implementar ações
    }}
  />
))}
```

## 📊 Benefícios da Refatoração

### Antes (AIPage.jsx)
- ❌ 1.010 linhas em um arquivo
- ❌ Difícil de testar
- ❌ Difícil de manter
- ❌ Código duplicado

### Depois
- ✅ AIPage: ~300 linhas
- ✅ Componentes testáveis
- ✅ Fácil de manter
- ✅ Reutilizável

## 🎯 Próximos Componentes a Criar

### ChatMessages (Lista Virtualizada)
```jsx
// src/components/chat/ChatMessages.jsx
import { FixedSizeList } from 'react-window';
import MessageBubble from './MessageBubble';

const ChatMessages = ({ conversas, loading, onAbrirModal }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <MessageBubble 
        conversa={conversas[index]} 
        onAbrirModal={onAbrirModal}
      />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={conversas.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### ChatInput (Input com Sugestões)
```jsx
// src/components/chat/ChatInput.jsx
const ChatInput = ({ 
  mensagem, 
  carregando, 
  gravando,
  onMensagemChange,
  onEnviar,
  onIniciarGravacao,
  onPararGravacao,
  suggestions = []
}) => {
  return (
    <div className="border-t border-slate-200 p-4">
      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div className="flex gap-2 mb-3">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => onMensagemChange(sug)}
              className="px-3 py-1 bg-slate-100 rounded-full text-sm"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={mensagem}
          onChange={(e) => onMensagemChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onEnviar()}
          placeholder="Digite sua pergunta..."
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={carregando}
        />
        
        {/* Botão Microfone */}
        <button
          onClick={gravando ? onPararGravacao : onIniciarGravacao}
          className={`p-2 rounded-lg ${gravando ? 'bg-red-500' : 'bg-slate-100'}`}
        >
          {gravando ? <MicOff /> : <Mic />}
        </button>

        {/* Botão Enviar */}
        <button
          onClick={onEnviar}
          disabled={carregando || !mensagem.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Send />
        </button>
      </div>
    </div>
  );
};
```

### VoiceConfigPanel (Configurações de Voz)
```jsx
// src/components/chat/VoiceConfigPanel.jsx
const VoiceConfigPanel = ({
  vozesDisponiveis,
  vozSelecionada,
  configVoz,
  modoContinuo,
  onVozChange,
  onConfigChange,
  onModoContinuoChange,
  onTestarVoz
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
      <h3 className="text-sm font-semibold mb-4">⚙️ Configurações de Voz</h3>

      {/* Seletor de Voz */}
      <div className="mb-4">
        <label className="text-xs text-slate-600 mb-2 block">
          🎤 Voz do Assistente
        </label>
        <select
          value={vozSelecionada?.name || ''}
          onChange={(e) => {
            const voz = vozesDisponiveis.find(v => v.name === e.target.value);
            onVozChange(voz);
          }}
          className="w-full px-3 py-2 border rounded-lg"
        >
          {vozesDisponiveis.map((voz) => (
            <option key={voz.name} value={voz.name}>
              {voz.name} ({voz.lang})
            </option>
          ))}
        </select>
      </div>

      {/* Modo Contínuo */}
      <div className="mb-4 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-slate-700">
            🔄 Modo Contínuo
          </label>
          <p className="text-xs text-slate-500">
            Reconhecimento de voz sem parar
          </p>
        </div>
        <button
          onClick={() => onModoContinuoChange(!modoContinuo)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            modoContinuo ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              modoContinuo ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-3 gap-4">
        {/* Velocidade */}
        <div>
          <label className="text-xs text-slate-600 mb-1 block">
            Velocidade: {configVoz.rate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={configVoz.rate}
            onChange={(e) => onConfigChange({ 
              ...configVoz, 
              rate: parseFloat(e.target.value) 
            })}
            className="w-full"
          />
        </div>

        {/* Tom */}
        <div>
          <label className="text-xs text-slate-600 mb-1 block">
            Tom: {configVoz.pitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={configVoz.pitch}
            onChange={(e) => onConfigChange({ 
              ...configVoz, 
              pitch: parseFloat(e.target.value) 
            })}
            className="w-full"
          />
        </div>

        {/* Volume */}
        <div>
          <label className="text-xs text-slate-600 mb-1 block">
            Volume: {Math.round(configVoz.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={configVoz.volume}
            onChange={(e) => onConfigChange({ 
              ...configVoz, 
              volume: parseFloat(e.target.value) 
            })}
            className="w-full"
          />
        </div>
      </div>

      {/* Botão de Teste */}
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={onTestarVoz}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          🎵 Testar Voz
        </button>
      </div>
    </div>
  );
};
```

## 🧪 Como Testar

### 1. Testar MessageBubble
```jsx
// src/components/chat/__tests__/MessageBubble.test.jsx
import { render, screen } from '@testing-library/react';
import MessageBubble from '../MessageBubble';

describe('MessageBubble', () => {
  it('deve renderizar mensagem do usuário', () => {
    render(
      <MessageBubble 
        conversa={{
          id: 1,
          tipo: 'usuario',
          conteudo: 'Olá',
          timestamp: new Date().toISOString()
        }}
      />
    );
    
    expect(screen.getByText('Olá')).toBeInTheDocument();
  });

  it('deve renderizar mensagem do agente', () => {
    render(
      <MessageBubble 
        conversa={{
          id: 1,
          tipo: 'agente',
          conteudo: 'Oi, como posso ajudar?',
          timestamp: new Date().toISOString()
        }}
      />
    );
    
    expect(screen.getByText('Oi, como posso ajudar?')).toBeInTheDocument();
  });
});
```

## 📝 Checklist de Integração

- [ ] 1. Importar componentes na AIPage
- [ ] 2. Substituir header pelo ChatHeader
- [ ] 3. Substituir mensagens pelo MessageBubble
- [ ] 4. Criar ChatMessages com virtualização
- [ ] 5. Criar ChatInput
- [ ] 6. Criar VoiceConfigPanel
- [ ] 7. Testar todos os componentes
- [ ] 8. Verificar performance
- [ ] 9. Atualizar documentação

## 🎯 Resultado Esperado

**AIPage.jsx reduzida de 1.010 para ~300 linhas!**

```jsx
// AIPage.jsx (versão refatorada)
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import VoiceConfigPanel from '../components/chat/VoiceConfigPanel';

const AIPage = () => {
  // Hooks
  const { getAuthHeaders } = useAuthHeaders();
  const { enviarMensagem, loading } = useChatAPI(getAuthHeaders);
  const { conversas, adicionarMensagem } = useChatHistory(user?.id);
  const { falarTexto, pararFala } = useVoiceSynthesis(vozHabilitada);
  
  return (
    <div className="h-full flex flex-col">
      <ChatHeader {...headerProps} />
      
      {mostrarConfig && <VoiceConfigPanel {...voiceProps} />}
      
      <ChatMessages 
        conversas={conversas}
        loading={loading}
        onAbrirModal={setClientePrePreenchido}
      />
      
      <ChatInput {...inputProps} />
    </div>
  );
};
```

---

**Documentação completa!** 🎉
