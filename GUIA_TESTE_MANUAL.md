# 🧪 Guia de Teste Manual - Assistente IA OFIX

## Pré-requisitos

1. Backend rodando na porta 1000
2. Aplicação frontend rodando (`npm run dev`)
3. Usuário autenticado no sistema

## Testes a Realizar

### 1. Sistema de Logging ✅
**Como testar:**
1. Abra o Console do navegador (F12 → Console)
2. Envie uma mensagem no chat
3. Verifique os logs estruturados com timestamp, nível e contexto

**Esperado:**
- Logs aparecem no console com formato estruturado
- Logs de debug, info, warn e error são diferenciados

---

### 2. Validação de Mensagens ✅
**Como testar:**
1. Tente enviar uma mensagem vazia
2. Tente enviar uma mensagem com mais de 1000 caracteres
3. Tente enviar HTML: `<script>alert('xss')</script>Olá`

**Esperado:**
- Mensagem vazia: erro "Mensagem não pode estar vazia"
- Mensagem longa: erro "Mensagem muito longa"
- HTML: mensagem sanitizada sem tags

---

### 3. Autenticação Automática ✅
**Como testar:**
1. Faça login no sistema
2. Navegue para a página do assistente
3. Envie uma mensagem
4. Abra Network tab (F12 → Network)
5. Veja a requisição e verifique o header `Authorization`

**Esperado:**
- Header `Authorization: Bearer <token>` presente em todas as requisições

---

### 4. Retry Logic ✅
**Como testar:**
1. Desligue o backend temporariamente
2. Envie uma mensagem
3. Observe o console

**Esperado:**
- Sistema tenta 3 vezes com delay exponencial
- Logs mostram "Tentando novamente em Xms..."
- Após 3 tentativas, exibe erro ao usuário

---

### 5. Timeout de Requisições ✅
**Como testar:**
1. Configure o backend para responder lentamente (>30s)
2. Envie uma mensagem

**Esperado:**
- Após 30 segundos, requisição é cancelada
- Mensagem "Tempo limite excedido" aparece

---

### 6. Histórico com Limite de 100 Mensagens ✅
**Como testar:**
1. Abra o localStorage (F12 → Application → Local Storage)
2. Envie 150 mensagens
3. Verifique o localStorage

**Esperado:**
- Apenas as últimas 100 mensagens são mantidas
- Mensagens antigas são removidas automaticamente

---

### 7. Debounce de Auto-Save ✅
**Como testar:**
1. Abra o console
2. Envie várias mensagens rapidamente (5 mensagens em 2 segundos)
3. Observe os logs de "Histórico salvo"

**Esperado:**
- Save só acontece 1 segundo após a última mensagem
- Não há múltiplos saves desnecessários

---

### 8. Reconhecimento de Voz ✅
**Como testar:**
1. Clique no botão de microfone
2. Permita acesso ao microfone
3. Fale algo em português
4. Observe o input sendo preenchido

**Esperado:**
- Microfone ativa e captura áudio
- Transcrição aparece no input
- Apenas resultados com confiança >0.5 são aceitos

---

### 9. ChatHeader - Status de Conexão ✅
**Como testar:**
1. Observe o header do chat
2. Veja o indicador de status
3. Desligue o backend e observe a mudança

**Esperado:**
- Status "Agente Online" quando conectado (ícone verde)
- Status "Conectando..." quando tentando conectar (ícone amarelo girando)
- Status "Erro de Conexão" quando falha (ícone vermelho)

---

### 10. ChatHeader - Botões de Ação ✅
**Como testar:**
1. Clique no botão de voz (ícone de volume)
2. Clique no botão de limpar histórico (ícone de lixeira)
3. Clique no botão de configurações (ícone de engrenagem)
4. Clique no botão de reconectar

**Esperado:**
- Botão de voz: alterna entre ativado/desativado
- Limpar histórico: remove todas as mensagens
- Configurações: abre painel de config de voz
- Reconectar: tenta reconectar com o backend

---

### 11. MessageBubble - Tipos de Mensagem ✅
**Como testar:**
1. Envie uma mensagem (tipo: usuario)
2. Receba resposta do agente (tipo: agente)
3. Observe mensagens de sistema, erro, confirmação

**Esperado:**
- Mensagem do usuário: azul, alinhada à direita
- Mensagem do agente: branca, alinhada à esquerda
- Mensagem de erro: vermelha
- Mensagem de confirmação: verde
- Cada tipo tem ícone e cor apropriados

---

### 12. MessageBubble - Botões de Ação ✅
**Como testar:**
1. Diga ao assistente: "Cadastrar cliente João Silva telefone 11999999999"
2. Observe a mensagem de resposta

**Esperado:**
- Mensagem tipo "cadastro" aparece
- Botão "📝 Cadastrar Cliente" é exibido
- Ao clicar, abre modal com dados pré-preenchidos

---

### 13. Performance - React.memo ✅
**Como testar:**
1. Abra React DevTools (extensão do navegador)
2. Ative "Highlight updates"
3. Envie uma nova mensagem
4. Observe que apenas a nova mensagem é renderizada

**Esperado:**
- Mensagens antigas não re-renderizam
- Apenas novos componentes são destacados

---

## Testes de Integração

### Fluxo Completo 1: Conversa Simples
1. Abra a página do assistente
2. Envie: "Olá"
3. Aguarde resposta
4. Envie: "Como você pode me ajudar?"
5. Aguarde resposta

**Esperado:**
- Todas as mensagens aparecem corretamente
- Histórico é salvo no localStorage
- Status de conexão permanece "Online"

---

### Fluxo Completo 2: Reconhecimento de Voz
1. Clique no botão de microfone
2. Fale: "Olá assistente"
3. Aguarde transcrição
4. Envie a mensagem
5. Aguarde resposta

**Esperado:**
- Voz é transcrita corretamente
- Mensagem é enviada
- Resposta é recebida

---

### Fluxo Completo 3: Recuperação de Erro
1. Desligue o backend
2. Envie uma mensagem
3. Observe tentativas de retry
4. Ligue o backend novamente
5. Envie outra mensagem

**Esperado:**
- Primeira mensagem falha após 3 tentativas
- Status muda para "Erro de Conexão"
- Segunda mensagem funciona normalmente
- Status volta para "Online"

---

## Verificação de Logs

Abra o console e verifique se aparecem logs como:

```
[INFO] Reconhecimento de voz iniciado { modoContinuo: false }
[DEBUG] Enviando mensagem para API { mensagem: "Olá", tentativa: 1 }
[INFO] Mensagem enviada com sucesso { tentativa: 1 }
[DEBUG] Histórico salvo { conversasCount: 2 }
```

---

## Checklist Final

- [ ] Sistema de logging funcionando
- [ ] Validação de mensagens funcionando
- [ ] Headers de autenticação presentes
- [ ] Retry logic funcionando
- [ ] Timeout de 30s funcionando
- [ ] Limite de 100 mensagens funcionando
- [ ] Debounce de save funcionando
- [ ] Reconhecimento de voz funcionando
- [ ] ChatHeader exibindo status correto
- [ ] Botões de ação funcionando
- [ ] MessageBubble com estilos corretos
- [ ] Botões de ação contextuais funcionando
- [ ] Performance otimizada (React.memo)

---

## Problemas Comuns

### Reconhecimento de voz não funciona
- Verifique se está usando HTTPS ou localhost
- Verifique permissões do navegador
- Teste em Chrome/Edge (melhor suporte)

### Backend não conecta
- Verifique se o backend está rodando na porta 1000
- Verifique a variável de ambiente `VITE_API_BASE_URL`
- Verifique CORS no backend

### Mensagens não aparecem
- Verifique o console por erros
- Verifique se o token de autenticação é válido
- Limpe o localStorage e tente novamente

---

## Próximos Passos

Após validar todas as funcionalidades acima, você pode:

1. Continuar implementando as tarefas restantes do spec
2. Testar em diferentes navegadores
3. Testar em dispositivos móveis
4. Realizar testes de carga
5. Coletar feedback de usuários reais
