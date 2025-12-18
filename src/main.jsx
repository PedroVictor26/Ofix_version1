import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './components/ui/toast';
import { ThemeProvider } from "./context/ThemeContext";

// Import Matias Enhanced styles
import './styles/matias-design-system.css';
import './styles/matias-animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <ToastProvider>
      <App />
    </ToastProvider>
  </ThemeProvider>
);