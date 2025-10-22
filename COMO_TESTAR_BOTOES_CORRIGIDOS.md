# 🧪 Como Testar os Botões de Sugestão Corrigidos

## 🎯 O Que Foi Corrigido

Os botões de sugestão rápida agora enviam **comandos estruturados** em vez do texto literal do botão, eliminando mensagens de erro confusas.

## 📋 Checklist de Testes

### ✅ Teste 1: Buscar Cliente

**Passos:**
1. Abra a página do Assistente IA (AIPage)
2. Clique no botão **"👤 Buscar cliente"**
3. Observe o chat

**Resultado Esperado:**
- ✅ Mensagem enviada: "buscar cliente" (não "Buscar cliente por nome ou CPF")
- ✅ Placeholder do input muda para: "Ex: João Silva ou 123.456.789-00"
- ✅ Backend responde com algo como: "Claro! Por favor, informe o nome, CPF ou telefone do cliente."
- ❌ NÃO deve aparecer: "Nenhum cliente encontrado para 'por nome ou CPF'"

---

### ✅ Teste 2: Agendar Serviço

**Passos:**
1. Clique no botão **"📅 Agendar serviço"**
2. Observe o chat

**Resultado Esperado:**
- ✅ Mensagem enviada: "agendar serviço"
- ✅ Placeholder muda para: "Ex: Troca de óleo para amanhã às 14h"
- ✅ Backend responde solicitando mais informações sobre o agendamento

---

### ✅ Teste 3: Status da OS

**Passos:**
1. Clique no botão **"🔧 Status da OS"**
2. Observe o chat

**Resultado Esperado:**
- ✅ Mensagem enviada: "status da OS"
- ✅ Placeholder muda para: "Ex: OS 1234 ou cliente João Silva"
- ✅ Backend responde pedindo o número da OS ou nome do cliente

---

### ✅ Teste 4: Consultar Peças

**Passos:**
1. Clique no botão **"📦 Consultar peças"**
2. Observe o chat

**Resultado Esperado:**
- ✅ Mensagem enviada: "consultar peças"
- ✅ Placeholder muda para: "Ex: filtro de óleo ou código ABC123"
- ✅ Backend responde pedindo o nome ou código da peça

---

### ✅ Teste 5: Calcular Orçamento

**Passos:**
1. Clique no botão **"💰 Calcular orçamento"**
2. Observe o chat

**Resultado Esperado:**
- ✅ Mensagem enviada: "calcular orçamento"
- ✅ Placeholder muda para: "Ex: troca de óleo + filtro"
- ✅ Backend responde pedindo detalhes dos serviços

---

## 🔍 Como Verificar no DevTools

### Inspecionar Mensagens Enviadas

1. Abra o DevTools (F12)
2. Vá para a aba **Console**
3. Clique em um botão de sugestão
4. Procure por logs como:

```javascript
// Deve aparecer algo assim:
[ChatAPI] Enviando mensagem: "buscar cliente"

// NÃO deve aparecer:
[ChatAPI] Enviando mensagem: "Buscar cliente por nome ou CPF"
```

### Inspecionar Network

1. Abra o DevTools (F12)
2. Vá para a aba **Network**
3. Filtre por **Fetch/XHR**
4. Clique em um botão de sugestão
5. Clique na requisição para `/api/agno/chat` ou similar
6. Veja o **Payload**:

```json
{
  "message": "buscar cliente",  // ✅ Correto
  // NÃO deve ser:
  // "message": "Buscar cliente por nome ou CPF"  // ❌ Errado
}
```

---

## 🎬 Fluxo Completo de Teste

### Cenário: Buscar um Cliente Real

**1. Clique em "👤 Buscar cliente"**
```
Você: buscar cliente
Matias: Claro! Por favor, informe o nome, CPF ou telefone do cliente.
[Placeholder: Ex: João Silva ou 123.456.789-00]
```

**2. Digite um nome real**
```
Você: Pedro Oliveira
Matias: ✅ Encontrado: Pedro Oliveira
        🚗 Veículo: Gol 2018 (ABC-1234)
        📞 (11) 98765-4321
        [Ver OS] [Agendar] [Ligar]
```

**3. Teste com CPF**
```
Você: buscar cliente
Matias: Claro! Por favor, informe o nome, CPF ou telefone do cliente.

Você: 123.456.789-00
Matias: ✅ Encontrado: Maria Santos
        🚗 Veículo: Civic 2020 (XYZ-5678)
        📞 (11) 91234-5678
```

---

## ❌ Problemas Que NÃO Devem Mais Acontecer

### Antes da Correção:
```
Você: [Clica em "Buscar cliente por nome ou CPF"]
Sistema envia: "Buscar cliente por nome ou CPF"
Matias: ❌ Nenhum cliente encontrado para "por nome ou CPF"
```

### Depois da Correção:
```
Você: [Clica em "Buscar cliente"]
Sistema envia: "buscar cliente"
Matias: ✅ Claro! Por favor, informe o nome, CPF ou telefone do cliente.
```

---

## 🐛 O Que Fazer Se Encontrar Problemas

### Problema 1: Placeholder não muda
**Causa:** `inputRef` não está funcionando
**Solução:** Verificar se o `ref={inputRef}` está no componente Input

### Problema 2: Ainda envia texto literal
**Causa:** Código antigo em cache
**Solução:** 
```bash
# Limpar cache e reiniciar
npm run dev
# Ou force refresh no navegador (Ctrl+Shift+R)
```

### Problema 3: Backend não reconhece comandos
**Causa:** Backend precisa ser atualizado para reconhecer comandos estruturados
**Solução:** Implementar handlers de comando no backend (ver CORRECAO_BOTOES_SUGESTAO.md)

---

## 📊 Critérios de Sucesso

A correção está funcionando se:

- ✅ Nenhum botão envia texto com "por nome ou CPF"
- ✅ Todos os comandos são curtos e estruturados
- ✅ Placeholders mudam dinamicamente ao clicar nos botões
- ✅ Backend responde com mensagens claras solicitando mais informações
- ✅ Zero mensagens de erro confusas

---

## 🚀 Próximos Passos (Opcional)

Após validar que a correção funciona:

1. **Melhorar Backend:** Adicionar handlers específicos para cada comando
2. **Adicionar Contexto:** Implementar sistema de "awaiting input" para manter contexto
3. **Feedback Visual:** Adicionar indicador visual quando sistema está aguardando input
4. **Histórico Inteligente:** Lembrar última ação para sugestões contextuais

---

## 📝 Relatório de Teste

Após testar, preencha:

| Botão | Comando Enviado | Placeholder OK? | Backend OK? | Status |
|-------|----------------|-----------------|-------------|--------|
| 👤 Buscar cliente | buscar cliente | ⬜ | ⬜ | ⬜ |
| 📅 Agendar serviço | agendar serviço | ⬜ | ⬜ | ⬜ |
| 🔧 Status da OS | status da OS | ⬜ | ⬜ | ⬜ |
| 📦 Consultar peças | consultar peças | ⬜ | ⬜ | ⬜ |
| 💰 Calcular orçamento | calcular orçamento | ⬜ | ⬜ | ⬜ |

**Legenda:** ✅ OK | ❌ Falhou | ⚠️ Parcial

---

**Data do Teste:** _______________

**Testado por:** _______________

**Observações:** _______________________________________________
