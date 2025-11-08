# 🚀 DEPLOY GUIDE - PROJETO OFIX

## 📋 PRÉ-REQUISITOS

1. Conta no GitHub
2. Conta na Vercel (github.com/vercel)
3. Conta na Railway (railway.app)

---

## 🎯 PASSO A PASSO COMPLETO

### **ETAPA 1: PREPARAR O CÓDIGO**

1. **Commit e push para GitHub:**
   ```bash
   git add .
   git commit -m "feat: preparar para deploy em produção"
   git push origin main
   ```

### **ETAPA 2: DEPLOY DO BACKEND (Railway)**

1. **Acesse railway.app e faça login com GitHub**

2. **Criar novo projeto:**
   - Clique "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório OFIX

3. **Configurar variáveis de ambiente:**
   ```env
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ofix
   OPENAI_API_KEY=sua-chave-aqui
   JWT_SECRET=seu-jwt-secret-aqui
   CORS_ORIGIN=https://seu-frontend.vercel.app
   ```

4. **Configurar build:**
   - Root Directory: `ofix-backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`

5. **Adicionar PostgreSQL:**
   - No dashboard, clique "Add Service"
   - Selecione "PostgreSQL"
   - Copie a URL de conexão para DATABASE_URL

### **ETAPA 3: DEPLOY DO FRONTEND (Vercel)**

1. **Acesse vercel.com e faça login com GitHub**

2. **Importar projeto:**
   - Clique "New Project"
   - Selecione seu repositório
   - Framework Preset: Vite
   - Root Directory: `/` (raiz)

3. **Configurar variáveis:**
   ```env
   VITE_API_URL=https://seu-backend.railway.app
   ```

4. **Deploy automático será iniciado**

### **ETAPA 4: CONFIGURAR DOMÍNIO (OPCIONAL)**

1. **Na Vercel:**
   - Vá em Settings > Domains
   - Adicione seu domínio personalizado

2. **Na Railway:**
   - Vá em Settings > Domains
   - Configure subdomain para API

---

## 🔧 CONFIGURAÇÕES IMPORTANTES

### **Frontend (package.json) - Adicionar script:**
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### **Backend - Configurar CORS:**
```javascript
// No servidor Express
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://seu-frontend.vercel.app'
  ]
}));
```

---

## 🚀 COMANDOS ÚTEIS

### **Deploy Frontend:**
```bash
# Local test
npm run build
npm run preview

# Vercel CLI (opcional)
npx vercel --prod
```

### **Deploy Backend:**
```bash
# Test local
cd ofix-backend
npm start

# Railway CLI (opcional)
npx railway deploy
```

---

## 📊 MONITORAMENTO

### **URLs após deploy:**
- Frontend: `https://seu-projeto.vercel.app`
- Backend: `https://seu-backend.railway.app`
- Database: Gerenciado pela Railway

### **Logs:**
- Vercel: Dashboard > Functions tab
- Railway: Dashboard > Deployments

---

## 💰 CUSTOS ESTIMADOS

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby | Gratuito |
| Railway | Hobby | $5/mês |
| **Total** | | **$5/mês** |

---

## 🆘 TROUBLESHOOTING

### **Erro CORS:**
```javascript
// Adicionar no backend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
```

### **Erro Build:**
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install
```

### **Erro Database:**
```bash
# Rodar migrations
npx prisma migrate deploy
npx prisma generate
```

---

## 🔐 SEGURANÇA

1. **Nunca commite .env files**
2. **Use variáveis de ambiente**
3. **Configure CORS corretamente**
4. **Use HTTPS sempre**

---

## 📞 SUPORTE

- Railway: docs.railway.app
- Vercel: vercel.com/docs
- GitHub Actions: docs.github.com/actions

**🎉 Seu OFIX estará no ar em poucos minutos!**