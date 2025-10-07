import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, Minimize2, Maximize2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatInterface({ 
  isOpen, 
  onToggle, 
  userType = 'cliente',
  userId,
  className = '',
  onSendMessage,
  messages = [],
  isLoading = false,
  isConnected = true,
  conversationId,
  suggestions = []
}) {
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setShowSuggestions(false);

    // Chamar função de envio do componente pai
    if (onSendMessage) {
      await onSendMessage(messageText);
    }

    // Focar novamente no input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputValue, isLoading, onSendMessage]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (typeof suggestion === 'string') {
      setInputValue(suggestion);
    } else {
      setInputValue(suggestion.text || suggestion.label || '');
    }
    setShowSuggestions(false);
    inputRef.current?.focus();
  };


  if (!isOpen) return null;

  return (
    <div className={`${className} ${isMinimized ? 'h-16' : 'h-full'} transition-all duration-300`}>
      <div className="flex flex-col h-full bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Assistente OFIX</h3>
              <p className="text-xs text-gray-600">
                {isConnected ? (isLoading ? 'Digitando...' : 'Online') : 'Reconectando...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-all"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <Bot className="w-16 h-16 mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Assistente OFIX</h3>
                  <p className="text-sm max-w-xs">
                    {userType === 'cliente' 
                      ? 'Estou aqui para ajudar com informações sobre seus serviços e agendamentos.'
                      : 'Pronto para auxiliar com diagnósticos técnicos e procedimentos.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id || index}
                      message={message}
                      userType={userType}
                      showTimestamp={true}
                    />
                  ))}
                  
                  {isLoading && <TypingIndicator />}
                </>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      {typeof suggestion === 'string' ? suggestion : suggestion.text || suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "Digite sua mensagem..." : "Reconectando..."}
                    disabled={!isConnected || isLoading}
                    className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 max-h-24 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    rows="1"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                    }}
                  />
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || !isConnected || isLoading}
                    className="absolute right-2 bottom-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                    aria-label="Enviar mensagem"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    {isConnected ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    )}
                    {userType === 'cliente' ? 'Cliente' : 'Mecânico'}
                  </span>
                  <span>•</span>
                  <span>{messages.length} mensagens</span>
                  {conversationId && (
                    <>
                      <span>•</span>
                      <span>ID: {conversationId.slice(-6)}</span>
                    </>
                  )}
                </div>
                {isLoading && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processando...
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
