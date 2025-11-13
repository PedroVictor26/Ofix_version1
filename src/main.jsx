import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './components/ui/toast';

// Import Matias Enhanced styles
import './styles/matias-design-system.css';
import './styles/matias-animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);