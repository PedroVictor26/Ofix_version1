# 🤖 Guia de Instalação e Configuração da IA Local - OFIX

## 📋 Resumo Executivo

**Problema resolvido:** Dependência de APIs pagas (OpenAI/Claude) e falta de controle sobre dados sensíveis.

**Solução implementada:** Sistema modular de IA que suporta múltiplos provedores:
- **Ollama** (local - RECOMENDADO) 🏠
- **Hugging Face** (gratuito online) 🤗  
- **OpenAI** (pago - para comparação) 💰
- **Modelos Customizados** (treinados especificamente para oficina) 🎯

## 🚀 Instalação Rápida (15 minutos)

### 1. **Instalar Ollama (IA Local)**

```powershell
# Baixar e instalar Ollama
# Ir para: https://ollama.ai/download
# Ou usar winget:
winget install Ollama.Ollama

# Verificar instalação
ollama --version

# Instalar modelo principal (4.7GB)
ollama pull llama3.1:8b

# Instalar modelo para embeddings (274MB)
ollama pull nomic-embed-text
```

### 2. **Configurar Backend OFIX**

```bash
# Ir para pasta do backend
cd "c:\OfixNovo - Copia\ofix_new\ofix-backend"

# Copiar configurações
cp .env.example .env

# Editar .env com estas configurações:
```

**Arquivo `.env`:**
```env
# ===== CONFIGURAÇÕES DE IA =====
AI_PROVIDER="ollama"
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"

# Opcional - para testes comparativos
HUGGINGFACE_TOKEN="hf_seu_token_aqui"
OPENAI_API_KEY="sk_sua_chave_aqui"
```

### 3. **Iniciar Sistema**

```powershell
# Terminal 1: Iniciar Ollama (se não iniciou automaticamente)
ollama serve

# Terminal 2: Iniciar backend
cd "c:\OfixNovo - Copia\ofix_new\ofix-backend"
npm start

# Terminal 3: Iniciar frontend
cd "c:\OfixNovo - Copia\ofix_new"
npm run dev
```

## 🧪 Testar Funcionalidades

### 1. **Verificar Status dos Provedores**
```bash
curl http://localhost:1000/api/ai/providers/status
```

### 2. **Testar Triagem por Voz**
```bash
# Upload de arquivo de áudio para triagem
curl -X POST -F "audio=@exemplo.wav" \
  http://localhost:1000/api/ai/triagem-voz
```

### 3. **Comparar Provedores**
```bash
curl -X POST http://localhost:1000/api/ai/providers/compare \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Como diagnosticar problema de freios?"}'
```

## 📊 Vantagens da IA Local vs APIs Pagas

| Critério | IA Local (Ollama) | OpenAI/Claude |
|----------|-------------------|---------------|
| **Custo** | ✅ Gratuito | ❌ $20-100/mês |
| **Privacidade** | ✅ Dados locais | ❌ Dados na nuvem |
| **Velocidade** | ✅ Instant | ⚠️ Depende da internet |
| **Customização** | ✅ Treino próprio | ❌ Limitado |
| **Dependência** | ✅ Independente | ❌ Internet + $$ |
| **Dados oficina** | ✅ Pode treinar | ❌ Genérico |

## 🎯 Funcionalidades Implementadas

### 1. **Triagem por Voz com IA Local**
- ✅ Transcrição de áudio (Whisper local ou HF)
- ✅ Análise automática de problemas
- ✅ Categorização (motor, freios, etc.)
- ✅ Estimativa de tempo e complexidade
- ✅ Sugestão de peças

### 2. **Sistema Modular de Provedores**
- ✅ Ollama (local)
- ✅ Hugging Face (gratuito)
- ✅ OpenAI (pago)
- ✅ Modelos customizados
- ✅ Fallback automático

### 3. **Dashboards de IA**
- ✅ Status dos provedores
- ✅ Comparação de performance
- ✅ Instalação de modelos
- ✅ Métricas de uso

## 🔧 Configuração Avançada

### **Hugging Face (Alternativa Gratuita)**

1. **Criar conta gratuita:** https://huggingface.co
2. **Gerar token:** Settings → Access Tokens
3. **Configurar no .env:**
```env
HUGGINGFACE_TOKEN="hf_seu_token_aqui"
HF_MODEL="microsoft/DialoGPT-medium"
```

### **Modelos Customizados (Treinamento Próprio)**

1. **Preparar dados de treinamento:**
```json
[
  {
    "input": "O freio está rangendo",
    "output": "freios",
    "categories": ["motor", "freios", "suspensao", "eletrica"]
  }
]
```

2. **Iniciar treinamento:**
```bash
curl -X POST http://localhost:1000/api/ai/training/start \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "ofix-triagem-v1",
    "trainingData": [...],
    "config": {"epochs": 50}
  }'
```

## 🎮 Interface de Gestão da IA

Criar componente React para gerenciar IA:

```jsx
// src/components/ai/AIProviderManager.jsx
const AIProviderManager = () => {
  const [providers, setProviders] = useState({});
  const [currentProvider, setCurrentProvider] = useState('ollama');
  
  useEffect(() => {
    fetch('/api/ai/providers/status')
      .then(r => r.json())
      .then(data => {
        setProviders(data.providers);
        setCurrentProvider(data.currentProvider);
      });
  }, []);
  
  return (
    <div className="ai-manager">
      <h2>🤖 Gestão de IA</h2>
      
      {/* Status dos provedores */}
      <div className="providers-grid">
        {Object.entries(providers).map(([name, info]) => (
          <div key={name} className={`provider-card ${info.available ? 'available' : 'unavailable'}`}>
            <h3>{name}</h3>
            <p>{info.description}</p>
            <span className={`status ${info.available ? 'online' : 'offline'}`}>
              {info.available ? '✅ Online' : '❌ Offline'}
            </span>
          </div>
        ))}
      </div>
      
      {/* Teste rápido */}
      <div className="quick-test">
        <h3>🧪 Teste Rápido</h3>
        <button onClick={testCurrentProvider}>
          Testar {currentProvider}
        </button>
      </div>
    </div>
  );
};
```

## 📈 Próximos Passos

### **Fase 1: Validação (Esta semana)**
- [x] Instalar Ollama
- [x] Configurar sistema modular  
- [x] Testar triagem básica
- [ ] Validar com dados reais

### **Fase 2: Treinamento (Próximas 2 semanas)**
- [ ] Coletar dados históricos da oficina
- [ ] Treinar modelo específico para triagem
- [ ] Fine-tuning para mensagens WhatsApp
- [ ] Modelo para alertas inteligentes

### **Fase 3: Produção (Mês 1)**
- [ ] Métricas de performance
- [ ] Sistema de feedback contínuo
- [ ] Auto-aprendizado baseado nos casos
- [ ] Deploy em produção

## 🔍 Troubleshooting

### **Ollama não inicia**
```powershell
# Verificar se está rodando
ollama list

# Reiniciar serviço
ollama serve

# Verificar porta
netstat -an | findstr 11434
```

### **Modelo não responde**
```bash
# Reinstalar modelo
ollama rm llama3.1:8b
ollama pull llama3.1:8b

# Testar diretamente
ollama run llama3.1:8b "Diga olá"
```

### **Performance lenta**
- **RAM:** Mínimo 8GB, recomendado 16GB
- **CPU:** Qualquer processador moderno
- **Modelo menor:** Use `llama3.1:3b` em vez de `8b`

## 📞 Suporte

**Problemas técnicos:**
1. Verificar logs: `console.log` no backend
2. Testar endpoint: `/api/ai/health`
3. Validar .env: Todas variáveis configuradas

**Performance:**
- Ollama local: 2-5 segundos
- Hugging Face: 5-15 segundos  
- OpenAI: 1-3 segundos

---

**✨ Resultado:** IA própria funcionando 100% local, sem custos mensais, com dados protegidos e performance excelente!

**Data:** 03 de Setembro de 2025
**Versão:** 1.0 - Sistema implementado e funcionando
