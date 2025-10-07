# 🏢 OFIX - Sistema de Gestão para Oficinas

Sistema completo de gestão para oficinas mecânicas desenvolvido com React + Node.js.

## ✨ Funcionalidades

- 📊 **Dashboard** - Visão geral operacional com Kanban de OS
- 👥 **Gestão de Clientes** - Cadastro e histórico completo
- 🚗 **Controle de Veículos** - Informações detalhadas dos veículos
- 📋 **Ordens de Serviço** - Criação e acompanhamento de OS
- 📦 **Controle de Estoque** - Gestão de peças e componentes
- 💰 **Financeiro** - Controle de receitas e despesas
- 🤖 **IA Integrada** - Assistente virtual para suporte

## 🚀 Demo Online

- **Frontend**: Em breve após o deploy
- **Backend**: [https://ofix-backend-prod.onrender.com](https://ofix-backend-prod.onrender.com)

## 🛠️ Tecnologias

### Frontend
- ⚛️ **React 18** - Interface de usuário
- 🎨 **Tailwind CSS** - Estilização moderna
- 🚀 **Vite** - Build tool ultrarrápido
- 📱 **Responsive Design** - Mobile-first
- 🎭 **Framer Motion** - Animações fluidas
### Backend
- 🟢 **Node.js + Express** - API RESTful robusta
- 🗄️ **PostgreSQL** - Banco de dados confiável
- 🔐 **JWT Authentication** - Autenticação segura
- 📡 **CORS habilitado** - Integração frontend/backend
- ☁️ **Deploy Render** - Hospedagem em nuvem

## 📦 Instalação e Uso

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### 1️⃣ Clone o repositório
```bash
git clone https://github.com/seu-usuario/ofix-frontend.git
cd ofix-frontend
```

### 2️⃣ Instale as dependências
```bash
npm install
```

### 3️⃣ Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Configure a URL do backend
VITE_API_BASE_URL=https://ofix-backend-prod.onrender.com
```

### 4️⃣ Execute o projeto
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🚀 Deploy Gratuito

Este projeto está configurado para deploy em plataformas gratuitas:

### Netlify (Recomendado)
1. Conecte seu repositório GitHub
2. Configure o build command: `npm run build`
3. Configure o publish directory: `dist`
4. Adicione as variáveis de ambiente

### Vercel
1. Importe o projeto do GitHub
2. As configurações são detectadas automaticamente
3. Adicione as variáveis de ambiente

## 📱 Principais Telas

### 🏠 Dashboard
- Visão geral em tempo real
- Kanban de Ordens de Serviço
- Métricas principais
- Gráficos de performance

### 👤 Gestão de Clientes
- Listagem com busca e filtros
- Cadastro completo
- Histórico de serviços
- Informações de contato

### 🚗 Controle de Veículos
- Cadastro de veículos
- Vinculação com clientes
- Histórico de manutenções
- Dados técnicos

### 📋 Ordens de Serviço
- Criação automatizada
- Status em tempo real
- Gestão de peças e serviços
- Controle de prazos

## 🤖 IA Integrada

O sistema possui um assistente virtual inteligente que auxilia nas operações:
- Sugestões de serviços
- Análise de padrões
- Alertas automáticos
- Suporte em tempo real

## 🔧 Scripts Disponíveis

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
npm run lint       # Análise de código
npm test           # Executa testes
```

## 📂 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas da aplicação
├── services/      # APIs e serviços
├── utils/         # Utilitários e helpers
├── styles/        # Estilos globais
└── assets/        # Imagens e recursos
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🌟 Apoie o Projeto

Se este projeto foi útil para você, considere dar uma ⭐ no repositório!

---

<div align="center">
  <p>Desenvolvido com ❤️ para revolucionar a gestão de oficinas mecânicas</p>
  <p>
    <a href="#-ofix---sistema-de-gestão-para-oficinas">Voltar ao topo</a>
  </p>
</div>
