import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './components/ui/toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);