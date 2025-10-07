import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

export default function TypingIndicator({ 
  className = '',
  showAvatar = true,
  message = 'Assistente está digitando',
  users = []
}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const displayMessage = users.length > 0 
    ? users.length === 1 
      ? `${users[0]} está digitando`
      : `${users.length} pessoas estão digitando`
    : message;

  return (
    <div className={`flex gap-3 justify-start mb-4 ${className}`}>
      {showAvatar && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className="max-w-[80%]">
        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Animated dots */}
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            
            {/* Text with dynamic dots */}
            <span className="text-gray-600 text-sm">
              {displayMessage}{dots}
            </span>
          </div>
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-1">
          {new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}
