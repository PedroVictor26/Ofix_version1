# 🔧 Configuração de Variáveis de Ambiente no Render

## 🚨 **ERRO ATUAL: JWT_SECRET**

O backend está falhando porque o `JWT_SECRET` deve ter pelo menos 32 caracteres.

## ✅ **SOLUÇÃO: Configurar Variáveis no Render**

### 1️⃣ **Acesse o Dashboard do Render**
- Vá para: https://dashboard.render.com
- Encontre seu serviço **ofix-backend-prod**
- Clique em **Environment**

### 2️⃣ **Configure as Variáveis Obrigatórias**

```bash
# 🔐 JWT Configuration (OBRIGATÓRIO)
JWT_SECRET=ofix_super_secure_jwt_secret_key_with_32_plus_characters_for_maximum_security_2024
JWT_EXPIRES_IN=7d

# 🗄️ Database (Já deve estar configurado)
DATABASE_URL=postgresql://sua-url-do-render-postgresql
DIRECT_DATABASE_URL=postgresql://sua-url-do-render-postgresql

# 🚀 Server Configuration
PORT=1000
NODE_ENV=production

# 🤖 AI Configuration (Opcional - para funcionalidades de IA)
AI_PROVIDER=ollama
AI_TIMEOUT=30000
AI_MAX_RETRIES=3
AI_ENABLE_CACHE=true
```

### 3️⃣ **Passos Detalhados no Render**

1. **Login no Render**: https://dashboard.render.com
2. **Selecione o Serviço**: `ofix-backend-prod`
3. **Vá para Environment**: Menu lateral → **Environment**
4. **Adicione as Variáveis**: 
   - Clique em **"Add Environment Variable"**
   - **Key**: `JWT_SECRET`
   - **Value**: `ofix_super_secure_jwt_secret_key_with_32_plus_characters_for_maximum_security_2024`
   - Clique **"Save Changes"**

5. **Repita para cada variável** listada acima

### 4️⃣ **Restart do Serviço**

Após adicionar as variáveis:
- Clique em **"Manual Deploy"** OU
- O serviço será reiniciado automaticamente

### 5️⃣ **Verificar Logs**

- Vá para **Logs** no menu lateral
- Verifique se não há mais erros de JWT_SECRET
- Confirme que o servidor está rodando na porta 1000

## 📋 **Checklist de Configuração**

- [ ] JWT_SECRET (32+ caracteres)
- [ ] JWT_EXPIRES_IN
- [ ] DATABASE_URL
- [ ] DIRECT_DATABASE_URL  
- [ ] PORT=1000
- [ ] NODE_ENV=production
- [ ] Deploy manual executado
- [ ] Logs sem erros

## 🎯 **JWT_SECRET Recomendado**

Use este JWT_SECRET seguro (64 caracteres):

```
ofix_super_secure_jwt_secret_key_with_32_plus_characters_for_maximum_security_2024
```

## 🔍 **Como Confirmar que Funcionou**

1. **Logs no Render**: Sem erros de JWT_SECRET
2. **Teste da API**: 
   ```bash
   curl https://ofix-backend-prod.onrender.com/health
   ```
3. **Frontend**: Consegue fazer login sem erros

## 🚨 **Importante**

- **NUNCA** compartilhe o JWT_SECRET publicamente
- Use um JWT_SECRET diferente para cada ambiente (dev/prod)
- O JWT_SECRET deve ter pelo menos 32 caracteres
- Prefira strings aleatórias complexas

## 📞 **Suporte**

Se ainda tiver problemas:
1. Verifique os logs do Render
2. Confirme se todas as variáveis estão salvas
3. Teste o endpoint: `/health` ou `/api/auth/login`