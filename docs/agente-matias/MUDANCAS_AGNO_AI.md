# 🤖 Mudanças Necessárias no Agente Agno (matias_agno)

## 📋 Resumo

Com a nova arquitetura multi-agente, o **Agno AI deve ser simplificado** para focar apenas em conversas complexas, deixando ações estruturadas para o backend local.

---

## ✅ O QUE ESTÁ BOM (manter como está)

O Agno AI já funciona bem para:
- ✅ Diagnósticos técnicos
- ✅ Explicações sobre procedimentos
- ✅ Recomendações personalizadas
- ✅ Orçamentos estimados
- ✅ Dúvidas técnicas

**Não mexa nessas funcionalidades!**

---

## ⚠️ O QUE DEVE SER AJUSTADO

### 1. **Simplificar o Prompt (OPCIONAL mas recomendado)**

**Arquivo:** `matias_agno/main.py` ou onde está o prompt do agente

**Mudança:**

#### Antes (Complicado):
```python
instructions = """
Você é o Matias, assistente automotivo.

Você pode:
- Diagnosticar problemas
- Agendar serviços  <--- REMOVER ESSA RESPONSABILIDADE
- Consultar OS      <--- REMOVER ESSA RESPONSABILIDADE
- Cadastrar clientes <--- REMOVER ESSA RESPONSABILIDADE
- Explicar procedimentos
...
"""
```

#### Depois (Focado):
```python
instructions = """
Você é o Matias, CONSULTOR TÉCNICO automotivo especializado.

🎯 SEU FOCO PRINCIPAL:
Você é um ESPECIALISTA em diagnósticos e explicações técnicas.
NÃO precisa criar agendamentos ou consultar banco de dados -
o sistema backend já faz isso automaticamente.

✅ O QUE VOCÊ FAZ MELHOR:
1. Diagnosticar problemas por sintomas
   - Barulhos, vibrações, luzes acesas
   - Análise de sintomas complexos
   
2. Explicar procedimentos técnicos
   - "O que é alinhamento?"
   - "Como funciona o ABS?"
   
3. Recomendar manutenções
   - Intervalos de troca
   - Prioridades de manutenção
   
4. Dar orçamentos ESTIMADOS
   - Faixas de preço (R$ 100-200)
   - Explicar o que influencia o preço

❌ O QUE O SISTEMA JÁ FAZ (não precisa se preocupar):
- Criar agendamentos → Backend local faz automaticamente
- Consultar OS → Backend local busca no banco
- Cadastrar clientes → Backend local processa
- Consultar estoque → Backend local verifica

📚 USO DA BASE DE CONHECIMENTO:
SEMPRE busque informações técnicas nos documentos antes de responder.
Se não tiver certeza, seja honesto e recomende verificação presencial.

💰 TABELA DE PREÇOS (mercado brasileiro, 2025):
- Troca de óleo: R$ 80-120
- Alinhamento/balanceamento: R$ 60-100
- Pastilhas freio dianteiras: R$ 150-300
- Pastilhas freio traseiras: R$ 100-200
- Suspensão/amortecedores: R$ 200-800 cada
- Diagnóstico eletrônico: R$ 50-100
- Bateria: R$ 300-600
- Pneus: R$ 200-500 cada
- Revisão completa: R$ 200-400

🗣️ TOM DE COMUNICAÇÃO:
- Técnico mas acessível
- Use analogias quando necessário
- Pergunte detalhes para diagnósticos precisos
- Sempre termine oferecendo mais ajuda
- Seja honesto sobre limitações

IMPORTANTE: Se o usuário pedir para "agendar", você pode dizer algo como:
"Perfeito! Vou processar o agendamento para você" e o sistema
automaticamente cuidará disso. Você não precisa fazer nada além de
confirmar que entendeu o pedido.

Responda em português brasileiro, de forma clara e profissional.
"""
```

**Por que essa mudança?**
- 🎯 Foca o Agno no que ele faz melhor (conversação técnica)
- ⚡ Evita confusão sobre responsabilidades
- 🐛 Reduz tentativas de fazer ações que o backend já faz melhor

---

### 2. **Remover Lógica de Agendamento (SE EXISTIR)**

Se no seu agente Agno houver código específico para:
- Extrair datas/horas
- Validar campos de agendamento
- Criar registros no banco

**REMOVA ISSO!** O backend local agora faz isso 10x melhor.

**Exemplo de código a remover:**

```python
# ❌ REMOVER - Não precisa mais
if "agendar" in message.lower():
    # extrair data, hora, cliente, etc
    # validar campos
    # criar no banco
    # ...
```

**Substitua por:**

```python
# ✅ MANTER SIMPLES
# Se detectar agendamento, apenas confirme
if "agendar" in message.lower():
    return "Entendi que você quer agendar. Vou processar isso para você!"
    # O backend vai detectar e processar automaticamente
```

---

### 3. **Ajustar Retorno de Ações (SE APLICÁVEL)**

Se o agente retorna `action_required` ou algo similar:

```python
# ❌ ANTES
return {
    "response": "Vou criar o agendamento...",
    "action": "CREATE_APPOINTMENT",  # Não precisa mais
    "data": {...}
}

# ✅ DEPOIS  
return {
    "response": "Entendi! Vou processar o agendamento para você."
    # Backend detecta pela mensagem original
}
```

---

## 🔍 Como Saber Se Precisa Mudar?

### Teste 1: Envie "Agendar revisão segunda 14h"
- ❌ **Se o Agno tentar processar:** Precisa simplificar
- ✅ **Se o Agno só responder:** Está OK!

### Teste 2: Envie "Meu carro está com barulho"
- ✅ **Se o Agno der diagnóstico técnico:** Perfeito!
- ❌ **Se o Agno pedir para agendar:** Foco demais em ações

### Teste 3: Envie "Status da OS 1234"
- ❌ **Se o Agno tentar buscar no banco:** Precisa simplificar
- ✅ **Se o Agno só responder genérico:** Está OK!

---

## 📝 Checklist de Mudanças no Agno

- [ ] **Prompt simplificado** (foco em diagnósticos e explicações)
- [ ] **Removida lógica de agendamento** (se existir)
- [ ] **Removida lógica de consulta DB** (se existir)
- [ ] **Removida lógica de cadastro** (se existir)
- [ ] **Mantido foco em conversação técnica**
- [ ] **Testado com mensagens de agendamento** (não deve tentar processar)
- [ ] **Testado com diagnósticos** (deve responder bem)

---

## 🚀 Deploy das Mudanças

1. **Edite o prompt** no arquivo principal do agente
2. **Remova código de ações** (se houver)
3. **Faça commit e push**
4. **Deploy no Render** (se houver auto-deploy, já atualiza)
5. **Teste com curl:**

```bash
# Teste 1: Agendamento (deve ser simples)
curl -X POST https://matias-agno-assistant.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Agendar revisão segunda 14h", "user_id": "test"}'

# Resposta esperada: Algo como "Entendi! Vou processar para você"
# NÃO deve tentar extrair dados ou criar agendamento

# Teste 2: Diagnóstico (deve ser detalhado)
curl -X POST https://matias-agno-assistant.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Meu carro está fazendo barulho no motor", "user_id": "test"}'

# Resposta esperada: Diagnóstico técnico detalhado
```

---

## ⚠️ E SE NÃO MUDAR NADA?

**Vai funcionar mesmo assim!**

A nova arquitetura tem **fallback** e **classificação inteligente**:
- Se o backend detectar agendamento, processa localmente (ignora Agno)
- Se não detectar, envia para Agno normalmente
- Agno pode continuar fazendo o que faz hoje

**MAS** você perde:
- 🚀 Performance (agendamentos 10x mais rápidos)
- 🎯 Foco (Agno tentando fazer tudo)
- 💰 Economia (menos chamadas desnecessárias)

---

## 💡 Recomendação Final

### **MÍNIMO NECESSÁRIO:**
Nada! O sistema funciona como está.

### **RECOMENDADO:**
Simplifique o prompt para focar em diagnósticos.

### **IDEAL:**
Prompt simplificado + remoção de lógica de ações.

---

## 🆘 Dúvidas?

**Precisa de ajuda para mudar o Agno?**
1. Me mostre o arquivo do prompt atual
2. Me mostre se há lógica de agendamento
3. Vou criar o código atualizado para você!

**Quer testar antes de mudar?**
1. Rode o backend com as mudanças
2. Teste com o Agno atual
3. Veja que já funciona melhor mesmo sem mexer no Agno!

---

## 🎉 Resumo

| Item | Obrigatório? | Benefício |
|------|--------------|-----------|
| Simplificar prompt | ❌ Não | 🎯 Foco melhor |
| Remover lógica de ações | ❌ Não | 🐛 Menos bugs |
| Testar após mudanças | ✅ Sim | ✅ Garantir funcionamento |
| Atualizar backend | ✅ Sim | 🚀 10x mais rápido |

**PRIORIDADE:** Atualizar o backend (já feito!) > Testar > Opcionalmente simplificar Agno

**Bora testar?** 🚀
