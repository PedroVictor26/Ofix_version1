# 🚀 DEPLOY GRATUITO - PROJETO OFIX

## 📋 STATUS ATUAL
- ✅ **Backend**: Render (`https://ofix-backend-prod.onrender.com`)
- 🔄 **Frontend**: Vamos deployar agora!
- 💰 **Custo**: R$ 0,00 (Totalmente gratuito)

---

## 🎯 ESCOLHA SUA OPÇÃO DE DEPLOY

### 🥇 **OPÇÃO 1: NETLIFY (RECOMENDADA)**

**Por que Netlify?**
- ✅ Mais fácil de configurar
- ✅ Deploy automático do GitHub
- ✅ SSL gratuito
- ✅ CDN global
- ✅ 100GB bandwidth/mês grátis

**Como deployar:**

1. **Acesse [netlify.com](https://netlify.com)**
2. **Faça login com GitHub**
3. **Clique "New site from Git"**
4. **Selecione seu repositório OFIX**
5. **Configure:**
   ```
   Build command: npm run build
   Publish directory: dist
   ```
6. **Adicione variáveis de ambiente:**
   ```
   VITE_API_BASE_URL = https://ofix-backend-prod.onrender.com
   ```
7. **Deploy!**

---

### 🥈 **OPÇÃO 2: VERCEL**

**Como deployar:**

1. **Acesse [vercel.com](https://vercel.com)**
2. **Faça login com GitHub**
3. **Clique "New Project"**
4. **Selecione seu repositório**
5. **Framework: Vite**
6. **Adicione env vars:**
   ```
   VITE_API_BASE_URL = https://ofix-backend-prod.onrender.com
   ```

---

### 🥉 **OPÇÃO 3: RENDER (FRONTEND)**

**Se quiser tudo na mesma plataforma:**

1. **Acesse [render.com](https://render.com)**
2. **Create New > Static Site**
3. **Conecte GitHub**
4. **Configure:**
   ```
   Build Command: npm run build
   Publish Directory: dist
   ```

---

## ⚙️ CONFIGURAÇÕES IMPORTANTES

### **Arquivos criados para deploy:**

1. **netlify.toml** (Para Netlify)
2. **vercel.json** (Para Vercel)
3. **render.yaml** (Para Render)

### **Variáveis de ambiente necessárias:**
```env
VITE_API_BASE_URL=https://ofix-backend-prod.onrender.com
```

---

## 🚀 PASSO A PASSO COMPLETO

### **1. Commit suas alterações:**
```bash
git add .
git commit -m "feat: configuração para deploy de produção"
git push origin main
```

### **2. Escolha uma plataforma acima**

### **3. Configure as variáveis de ambiente**

### **4. Deploy automático será feito!**

---

## 🔧 CONFIGURAÇÃO DO BACKEND (RENDER)

**Se seu backend ainda não está rodando, aqui estão as configurações:**

### **Backend Settings (Render):**
```
Environment: Node
Build Command: npm install
Start Command: npm start
```

### **Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL=sua-database-url
CORS_ORIGIN=https://seu-frontend.netlify.app
```

---

## 🌐 URLS FINAIS

Após o deploy, você terá:

- **Frontend**: `https://seu-projeto.netlify.app`
- **Backend**: `https://ofix-backend-prod.onrender.com`
- **Custo Total**: **R$ 0,00**

---

## 🆘 TROUBLESHOOTING

### **Erro CORS:**
No backend, adicione sua URL do frontend:
```javascript
app.use(cors({
  origin: ['https://seu-frontend.netlify.app']
}));
```

### **Erro 404 em rotas:**
Adicione `_redirects` para Netlify:
```
/*    /index.html   200
```

### **Build falha:**
```bash
# Teste local primeiro
npm run build
npm run preview
```

---

## 📞 PRÓXIMOS PASSOS

1. **Escolha Netlify (recomendado)**
2. **Siga o passo a passo**
3. **Em 5 minutos estará no ar!**

**🎉 Seu OFIX ficará disponível 24/7 gratuitamente!**