# QWEN.md - OFIX Project Context

## Project Overview

OFIX is a comprehensive management system for automotive workshops (oficinas) built with a modern React + Node.js stack. The project includes a sophisticated AI integration with an Agno AI agent called "Matias" that assists with workshop operations.

The system features a complete frontend built with React, Tailwind CSS, and Vite, and a backend API built with Node.js, Express, and PostgreSQL. It includes a dedicated AI page with voice recognition and synthesis capabilities.

### Key Features
- Dashboard with Kanban OS view
- Client management
- Vehicle control
- Order of service (OS) management
- Inventory control
- Financial management
- Integrated AI assistant (Matias)
- Voice recognition and synthesis

## Project Structure

```
ofix_new/
├── api/
├── dist/                 # Build output
├── logs/                 # Log files
├── nginx/
├── node_modules/
├── ofix-backend/         # Backend API (Node.js)
├── scripts/
├── src/                  # Frontend source code
│   ├── agents/
│   ├── components/       # Reusable UI components
│   ├── constants/
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/
│   ├── pages/            # Page components
│   ├── services/         # API and external service calls
│   ├── test/
│   ├── utils/            # Utility functions
│   ├── App.jsx
│   ├── Layout.jsx
│   └── main.jsx
├── .env.agno.example
├── .env.example
├── .env.production
├── package.json
├── package-lock.json
├── README.md
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── ...
```

## Technologies Used

### Frontend
- React 18 with Vite
- TypeScript
- Tailwind CSS
- @dnd-kit for drag and drop
- Radix UI components
- Framer Motion for animations
- React Router DOM for navigation
- Recharts for data visualization
- Lucide React for icons
- React Hook Form for forms
- Axios for API requests

### Backend
- Node.js + Express
- PostgreSQL database
- Prisma ORM
- JWT authentication
- CORS middleware
- Hugging Face inference
- OpenAI API
- WebSocket support
- Node-cron for scheduled tasks

### AI Integration
- Agno AI Agent (Matias)
- Voice recognition and synthesis
- Natural Language Processing (NLP)
- Context-aware responses

## Building and Running

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database

### Frontend Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Set backend URL
VITE_API_BASE_URL=https://ofix-backend-prod.onrender.com

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

### Backend Setup
```bash
# Navigate to backend directory
cd ofix-backend

# Install dependencies
npm install

# Setup database with Prisma
npx prisma generate
npx prisma db push

# Development server
npm run dev

# Production server
npm start
```

### Environment Variables

#### Frontend (.env)
```
VITE_API_BASE_URL= # URL to backend API
VITE_AGNO_API_URL= # URL to Agno AI service
VITE_AGNO_AGENT_ID= # ID of the Agno agent
VITE_AGNO_API_TOKEN= # Token for Agno API authentication
```

#### Backend (.env)
```
PORT= # Port to run the server on
DATABASE_URL= # PostgreSQL database URL
JWT_SECRET= # Secret for JWT token generation
AGNO_API_URL= # URL to Agno AI service
AGNO_API_TOKEN= # Token for Agno API authentication
AGNO_DEFAULT_AGENT_ID= # Default ID for Agno agent
```

## Development Conventions

1. **Code Structure**: The project follows a component-based architecture with clear separation of concerns between UI, business logic, and data management.

2. **AI Integration**: The AI page (AIPage.jsx) has extensive refactoring with proper error handling, voice recognition/synthesis, and context management.

3. **State Management**: Uses React Context for global state management and custom hooks for component-specific logic.

4. **Security**: Implements CORS, rate limiting, input sanitization, and JWT authentication.

5. **Performance**: Uses lazy loading for routes, debouncing for API calls, and proper memory management.

## Key Files and Components

### Frontend
- `src/App.jsx`: Main application router with protected routes
- `src/Layout.jsx`: Main layout component with navigation
- `src/pages/AIPage.jsx`: Integrated AI assistant with voice features
- `src/components/auth/ProtectedRoute.jsx`: Authentication guard
- `src/context/AuthContext.jsx`: Authentication state management

### Backend
- `ofix-backend/src/app.js`: Main Express application configuration
- `ofix-backend/src/server.js`: Server startup
- `ofix-backend/src/routes/`: API route definitions
- `ofix-backend/src/middlewares/`: Security and validation middleware

## Deployment

### Frontend Deployment
The project is configured for deployment on platforms like Netlify or Vercel:
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add environment variables

### Backend Deployment
The backend is configured for deployment on Render:
1. Runtime: Node.js
2. Build command: `npm install`
3. Start command: `npm start`

## Special Features

### AI Assistant (Matias)
- Integrated Agno AI agent for workshop management
- Voice recognition and speech synthesis
- Context-aware responses based on workshop data
- Error handling and retry logic
- Auto-save conversation history

### Voice Features
- Real-time speech-to-text conversion
- Text-to-speech synthesis
- Configurable voice parameters (rate, pitch, volume)
- Echo prevention
- Noise cancellation

### Security Measures
- Input sanitization using DOMPurify
- Rate limiting
- Security headers
- JWT authentication
- CORS configuration
- Environment variable management

### Performance Optimizations
- Debounced API calls
- Memory-limited conversation history
- Lazy loading components
- Proper error handling without exposing sensitive information
- Efficient state management

## Testing and Quality Assurance

The project includes:
- ESLint for code quality
- Vitest for unit testing
- Linting and security audit scripts
- Error boundaries for graceful error handling
- Comprehensive logging system


sempre fale em portugues

quando terminar alterações so suba para o github se alterar o backend