# 🧪 Como Testar as Melhorias de NLP

## Teste Rápido (1 minuto)

### Opção 1: Teste Automatizado
```bash
node teste-nlp-simples.js
```

**Resultado esperado:**
```
🎉 Todos os testes passaram! NLP está funcionando corretamente.
📊 Resultado Final: 9/9 testes passaram
```

---

## Teste Completo na Interface (5 minutos)

### Passo 1: Iniciar o Servidor
```bash
npm run dev
```

### Passo 2: Abrir a AIPage
1. Acesse http://localhost:5173 (ou a porta configurada)
2. Faça login no sistema
3. Navegue até a página do Assistente de IA

### Passo 3: Abrir o Console
- Pressione `F12` (Windows/Linux) ou `Cmd+Option+I` (Mac)
- Vá para a aba "Console"

### Passo 4: Testar Consulta de Preço

**Digite:** "quanto custa a troca de óleo?"

**Verifique no console:**
```
[INFO] Mensagem enriquecida com NLP
{
  intencao: 'consulta_preco',
  confianca: 0.192,
  entidades: ['servico']
}
```

**Resposta esperada do assistente:**
- Deve falar sobre PREÇO, não sobre agendamento
- Deve mencionar valores ou pedir mais informações sobre o serviço

### Passo 5: Testar Agendamento

**Digite:** "quero agendar uma troca de óleo"

**Verifique no console:**
```
[INFO] Mensagem enriquecida com NLP
{
  intencao: 'agendamento',
  confianca: 0.286,
  entidades: ['servico']
}
```

**Resposta esperada do assistente:**
- Deve falar sobre AGENDAMENTO
- Deve pedir data/horário

### Passo 6: Testar Consulta de Estoque

**Digite:** "tem filtro de óleo em estoque?"

**Verifique no console:**
```
[INFO] Mensagem enriquecida com NLP
{
  intencao: 'consulta_estoque',
  confianca: 0.623,
  entidades: ['servico']
}
```

**Resposta esperada do assistente:**
- Deve falar sobre ESTOQUE
- Deve verificar disponibilidade

---

## Teste de Requisição ao Backend (Avançado)

### Passo 1: Abrir Network Tab
1. Pressione `F12`
2. Vá para a aba "Network"
3. Filtre por "Fetch/XHR"

### Passo 2: Enviar Mensagem
Digite: "quanto custa a troca de óleo?"

### Passo 3: Verificar Requisição
1. Clique na requisição para `/agno/chat-inteligente`
2. Vá para a aba "Payload" ou "Request"
3. Verifique o JSON enviado:

```json
{
  "message": "quanto custa a troca de óleo?",
  "usuario_id": 123,
  "contexto_conversa": [...],
  "nlp": {
    "intencao": "consulta_preco",
    "confianca": 0.192,
    "entidades": {
      "servico": "troca de óleo"
    },
    "periodo": null
  },
  "contextoNLP": {
    "tipo": "consulta_preco",
    "acao": "buscar_preco"
  }
}
```

### Passo 4: Verificar Resposta
1. Vá para a aba "Response"
2. Verifique se o backend está usando os dados NLP
3. A resposta deve ser apropriada para a intenção detectada

---

## Casos de Teste Recomendados

### 1. Consulta de Preço (deve detectar `consulta_preco`)
- ✅ "quanto custa a troca de óleo?"
- ✅ "qual o valor da revisão?"
- ✅ "me diz o preço da troca de óleo"
- ✅ "quanto vou pagar pela revisão?"
- ✅ "qual é o preço do alinhamento?"
- ✅ "quanto cobra pela troca de filtro?"

### 2. Agendamento (deve detectar `agendamento`)
- ✅ "quero agendar uma troca de óleo"
- ✅ "marcar revisão para amanhã"
- ✅ "gostaria de agendar um alinhamento"
- ✅ "preciso agendar troca de pastilha"

### 3. Consulta de Estoque (deve detectar `consulta_estoque`)
- ✅ "tem filtro de óleo em estoque?"
- ✅ "tem pastilha de freio disponível?"
- ✅ "verificar estoque de óleo"
- ✅ "tem essa peça?"

### 4. Consulta de Cliente (deve detectar `consulta_cliente`)
- ✅ "buscar cliente João Silva"
- ✅ "dados do cliente CPF 123.456.789-00"
- ✅ "informações do cliente"
- ✅ "procurar cliente Maria"

### 5. Saudação (deve detectar `saudacao`)
- ✅ "oi"
- ✅ "olá"
- ✅ "bom dia"
- ✅ "boa tarde"

### 6. Ajuda (deve detectar `ajuda`)
- ✅ "me ajuda"
- ✅ "o que você faz?"
- ✅ "como funciona?"
- ✅ "quais comandos?"

---

## Verificação de Logs

### Logs Esperados (Console do Navegador)

#### Mensagem Válida:
```
[INFO] Mensagem enriquecida com NLP
{
  intencao: 'consulta_preco',
  confianca: 0.85,
  entidades: ['servico'],
  context: 'enviarMensagem'
}
```

#### Mensagem Inválida:
```
[WARN] Mensagem inválida
{
  errors: ['Mensagem muito longa'],
  messageLength: 1500,
  context: 'enviarMensagem'
}
```

#### Erro de Rede:
```
[ERROR] Erro ao enviar mensagem
{
  error: 'Network error',
  userId: 123,
  messageLength: 50,
  context: 'enviarMensagem'
}
```

---

## Troubleshooting

### Problema: NLP não está funcionando

**Sintomas:**
- Não aparece log "Mensagem enriquecida com NLP"
- Respostas continuam incorretas

**Solução:**
1. Verifique se o import está correto em `AIPage.jsx`:
   ```javascript
   import { enrichMessage } from '../utils/nlp/queryParser';
   ```

2. Verifique se a função está sendo chamada:
   ```javascript
   const mensagemEnriquecida = enrichMessage(novaMensagem.conteudo);
   ```

3. Limpe o cache do navegador (Ctrl+Shift+Delete)

4. Reinicie o servidor de desenvolvimento

### Problema: Intenção detectada incorretamente

**Sintomas:**
- Pergunta sobre preço detectada como agendamento
- Confiança muito baixa (< 10%)

**Solução:**
1. Verifique os padrões em `intentClassifier.js`
2. Adicione mais variações da pergunta
3. Ajuste os pesos das intenções

**Exemplo:**
```javascript
consulta_preco: {
  keywords: [
    'quanto custa',
    'qual o valor',
    // Adicione mais variações aqui
    'quanto sai',
    'quanto fica'
  ],
  weight: 1.2 // Aumentar peso se necessário
}
```

### Problema: Entidades não sendo extraídas

**Sintomas:**
- `entidades: {}` (vazio)
- Serviço não detectado

**Solução:**
1. Verifique os padrões em `entityExtractor.js`
2. Adicione mais padrões regex
3. Teste o regex isoladamente

**Exemplo:**
```javascript
servico: [
  /troca de (?:óleo|oleo)/i,
  /revis[ãa]o/i,
  // Adicione mais padrões aqui
  /(?:troca|reparo) (?:de |do )?filtro/i
]
```

### Problema: Backend não está usando NLP

**Sintomas:**
- Dados NLP enviados mas resposta incorreta
- Backend ignora a intenção

**Solução:**
1. Verifique se o backend está recebendo os dados:
   ```javascript
   console.log('NLP recebido:', req.body.nlp);
   ```

2. Implemente roteamento por intenção:
   ```javascript
   switch (req.body.nlp.intencao) {
     case 'consulta_preco':
       return handleConsultaPreco(req.body.nlp.entidades);
     // ...
   }
   ```

3. Verifique se o Agno AI está configurado para usar NLP

---

## Checklist de Verificação

### Frontend
- [ ] Import do `enrichMessage` em AIPage.jsx
- [ ] Chamada de `enrichMessage()` antes de enviar ao backend
- [ ] Log "Mensagem enriquecida com NLP" aparece no console
- [ ] Dados NLP incluídos no payload da requisição

### Backend
- [ ] Endpoint `/agno/chat-inteligente` recebe dados NLP
- [ ] Backend loga os dados NLP recebidos
- [ ] Backend usa `nlp.intencao` para rotear
- [ ] Backend usa `nlp.entidades` para processar

### Testes
- [ ] Teste automatizado passa (9/9)
- [ ] Consulta de preço detectada corretamente
- [ ] Agendamento detectado corretamente
- [ ] Entidades extraídas corretamente
- [ ] Respostas do assistente apropriadas

---

## Métricas de Sucesso

### Precisão
- ✅ Intenção correta em > 90% dos casos
- ✅ Confiança > 30% para intenções válidas
- ✅ Entidades extraídas quando presentes

### Performance
- ✅ Análise NLP < 10ms
- ✅ Sem impacto no tempo de resposta
- ✅ Sem erros no console

### Experiência do Usuário
- ✅ Respostas mais precisas
- ✅ Menos erros de interpretação
- ✅ Melhor compreensão de linguagem natural

---

## Próximos Passos

Após confirmar que o NLP está funcionando:

1. **Implementar roteamento no backend**
   - Usar `nlp.intencao` para rotear requisições
   - Usar `nlp.entidades` para processar dados

2. **Adicionar mais padrões**
   - Coletar perguntas reais dos usuários
   - Adicionar variações aos padrões
   - Ajustar pesos das intenções

3. **Implementar tarefas 20 e 21**
   - Marcar como concluídas (já implementadas)
   - Continuar com tarefa 22 (dataFormatter)

4. **Monitorar em produção**
   - Coletar métricas de precisão
   - Identificar casos de erro
   - Melhorar padrões continuamente

---

## Suporte

Se encontrar problemas:

1. Verifique os logs no console
2. Teste com `teste-nlp-simples.js`
3. Consulte `MELHORIAS_NLP_IMPLEMENTADAS.md`
4. Verifique o código em `src/utils/nlp/`

**Arquivos de referência:**
- `MELHORIAS_NLP_IMPLEMENTADAS.md` - Documentação técnica
- `RESUMO_SESSAO_ATUAL.md` - Resumo da implementação
- `teste-nlp-simples.js` - Testes automatizados
