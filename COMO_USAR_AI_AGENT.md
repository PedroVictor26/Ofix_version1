# 🚀 Como Usar o AI Agent OFIX - Guia Prático

## ⚡ Setup Rápido (2 minutos)

### 1. Execute o script de setup automático

```powershell
# No PowerShell, na pasta C:\OfixNovo\ofix_new\
.\setup-ai-agent.ps1
```

### 2. Configure sua chave de API

Edite o arquivo `.env` que foi criado:

```bash
# Substitua "sua_chave_claude_aqui" pela sua chave real
CLAUDE_API_KEY=sk-ant-api03-sua-chave-real-aqui
# OU se preferir OpenAI:
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

### 3. Teste se está funcionando

```powershell
# Teste básico
node ai-agent/cli.js --help
```

## 🎯 Comandos Principais (Copy & Paste)

### Análise de Código

```powershell
# Analisar todo o projeto
node ai-agent/cli.js analyze src

# Analisar um arquivo específico
node ai-agent/cli.js analyze src/components/UserCard.jsx

# Análise com opções específicas
node ai-agent/cli.js analyze src/components/Modal.jsx --performance --security

# Sugestões de melhoria (se disponível)
node ai-agent/cli.js suggestions src
```

### Dashboard Web

```powershell
# Iniciar o dashboard (usar o script de conveniência)
./ai-dashboard.ps1

# OU manualmente:
node ai-agent/src/web/dashboard-server.js

# Depois abra no navegador: http://localhost:3001
```

### Geração de Código

```powershell
# Gerar código (se disponível)
node ai-agent/cli.js generate --type component --name UserProfile

# Ou usar comandos específicos do CLI
node ai-agent/cli.js --help
```

## 🔧 Se Algo Não Funcionar

### Problema: "Comando não encontrado"
```powershell
# Use o caminho completo:
node C:\OfixNovo\ofix_new\ai-agent\cli.js analyze src

# Ou certifique-se de estar na pasta correta:
cd C:\OfixNovo\ofix_new
node ai-agent/cli.js --help
```

### Problema: "API Key inválida"
```powershell
# Verifique o arquivo .env:
Get-Content .env

# Edite o arquivo .env:
notepad .env

# Certifique-se de que a chave está no formato correto
```

### Problema: "Módulo não encontrado"
```powershell
# Execute o setup novamente:
.\setup-ai-agent.ps1

# Ou instale manualmente:
cd ai-agent
npm install --force
cd ..
```

## 💡 Exemplos Práticos

### 1. Analisar um componente específico
```powershell
# Se você tem um arquivo problemático:
node ai-agent/cli.js analyze src/components/Modal.jsx --deep

# O AI vai te dar:
# - Problemas encontrados
# - Sugestões de melhoria
# - Otimizações de performance
```

### 2. Ver informações do sistema
```powershell
# Ver comandos disponíveis
node ai-agent/cli.js --help

# Ver versão e status
node ai-agent/cli.js --version
```

### 3. Usar scripts de conveniência
```powershell
# Análise rápida do projeto
./ai-analyze.ps1

# Dashboard em um clique
./ai-dashboard.ps1
```

## 🎓 Tutorial Interativo

### Ver tutoriais disponíveis
```powershell
node ai-agent/src/cli/documentation.js tutorials:list
```

### Começar tutorial básico
```powershell
node ai-agent/src/cli/documentation.js tutorials:start getting-started
```

## 📱 Integração com VS Code

### 1. Instalar extensão (se disponível)
- Abrir VS Code
- Ir em Extensions
- Procurar "OFIX AI Agent"

### 2. Usar comandos no VS Code
- `Ctrl+Shift+P`
- Digitar "AI Agent"
- Escolher comandos disponíveis

## 🆘 Comandos de Emergência

### Se nada funcionar:
```powershell
# 1. Verificar Node.js
node --version
# Deve ser 18 ou superior

# 2. Limpar e reinstalar
cd ai-agent
rm -rf node_modules
npm install

# 3. Teste simples
node -e "console.log('Node.js funcionando!')"

# 4. Teste do AI Agent
node ai-agent/src/index.js --health
```

## 🎯 Fluxo de Trabalho Recomendado

### Para Desenvolvimento Diário:

1. **Manhã - Análise geral**
   ```powershell
   node ai-agent/src/cli.js analyze
   ```

2. **Durante o desenvolvimento - Análise específica**
   ```powershell
   node ai-agent/src/cli.js analyze src/components/NovoComponente.jsx
   ```

3. **Antes do commit - Review**
   ```powershell
   node ai-agent/src/cli.js review
   ```

4. **Dashboard sempre aberto**
   ```powershell
   node ai-agent/src/web/dashboard-server.js
   # http://localhost:3001
   ```

## 📞 Precisa de Ajuda?

### Logs para debug:
```powershell
# Ver logs do AI Agent
type ai-agent\logs\application.log

# Ver logs de erro
type ai-agent\logs\error.log
```

### Comandos de diagnóstico:
```powershell
# Status do sistema
node ai-agent/src/cli.js --health

# Informações do ambiente
node ai-agent/src/cli.js --info

# Teste de conectividade
node ai-agent/src/cli.js --test-connection
```

---

## 🚀 Começar AGORA

**Copy este comando e cole no PowerShell:**

```powershell
# 1. Vá para a pasta do projeto
cd C:\OfixNovo\ofix_new

# 2. Execute o setup automático
.\setup-ai-agent.ps1

# 3. Edite o arquivo .env e adicione sua chave de API
notepad .env

# 4. Teste o AI Agent
node ai-agent/cli.js --help

# 5. Primeira análise
node ai-agent/cli.js analyze src
```

**É isso! O AI Agent já deve estar funcionando! 🎉**

---

*Se ainda tiver problemas, me avise e vou te ajudar passo a passo!*
