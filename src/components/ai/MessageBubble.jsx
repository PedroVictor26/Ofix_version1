import { useState } from 'react';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, ExternalLink, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function MessageBubble({ 
  message, 
  userType = 'cliente',
  onFeedback,
  onActionClick,
  showTimestamp = true 
}) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const isUser = message.type === 'user' || message.isUser;
  const isAI = message.type === 'ai' || (!isUser && !message.isUser);
  const isSystem = message.type === 'system';
  const isError = message.isError || message.type === 'error';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
    }
  };

  const handleFeedback = (helpful) => {
    if (feedbackGiven) return;
    
    if (onFeedback) {
      onFeedback({
        helpful,
        rating: helpful ? 5 : 2,
        timestamp: new Date().toISOString(),
        messageId: message.id
      });
    }
    
    setFeedbackGiven(true);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMessageTypeIcon = () => {
    if (isError) return <AlertTriangle className="w-3 h-3 text-red-500" />;
    if (isSystem) return <Info className="w-3 h-3 text-blue-500" />;
    if (message.confidence && message.confidence < 0.7) return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    return null;
  };

  const getMessageIcon = () => {
    if (isUser) {
      return (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      );
    }
    
    return (
      <div className={`w-8 h-8 ${isError ? 'bg-red-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} rounded-full flex items-center justify-center`}>
        <Bot className="w-4 h-4 text-white" />
      </div>
    );
  };

  const renderActions = () => {
    if (!message.actions || !Array.isArray(message.actions) || message.actions.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {message.actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick && onActionClick(action)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
              action.style === 'primary' 
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : action.style === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : action.style === 'warning'
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : action.style === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-current'
            }`}
          >
            {action.icon && <ExternalLink className="w-3 h-3" />}
            {action.label || action.text}
          </button>
        ))}
      </div>
    );
  };

  const renderMetadata = () => {
    if (!message.metadata || typeof message.metadata !== 'object') {
      return null;
    }

    return (
      <div className="mt-2 p-2 bg-black bg-opacity-10 rounded-lg text-xs opacity-75">
        {message.metadata.source && (
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Fonte: {message.metadata.source}</span>
          </div>
        )}
        {message.metadata.processingTime && (
          <div className="flex items-center gap-1 mt-1">
            <span>Tempo: {message.metadata.processingTime}ms</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* Avatar para mensagens da IA */}
      {isAI && (
        <div className="flex-shrink-0">
          {getMessageIcon()}
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'} relative group`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 relative ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : isError
              ? 'bg-red-50 border-l-4 border-red-500 text-gray-900 rounded-bl-md'
              : isSystem
              ? 'bg-yellow-50 border-l-4 border-yellow-500 text-gray-900 rounded-bl-md'
              : 'bg-gray-100 text-gray-900 rounded-bl-md hover:bg-gray-50'
          }`}
        >
          {/* Message content */}
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content || message.text}
          </div>

          {/* Actions */}
          {renderActions()}

          {/* Metadata */}
          {renderMetadata()}

          {/* Action buttons overlay */}
          {showActions && isAI && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleCopy}
                className="p-1 text-gray-400 hover:text-gray-600 bg-white rounded shadow-sm"
                title="Copiar mensagem"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>

        {/* Message metadata */}
        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          {showTimestamp && (
            <span>{formatTimestamp(message.timestamp)}</span>
          )}
          
          {isAI && message.confidence !== undefined && (
            <span className={getConfidenceColor(message.confidence)}>
              {getMessageTypeIcon()}
              {Math.round(message.confidence * 100)}% confiança
            </span>
          )}

          {copied && <span className="text-green-600">Copiado!</span>}
        </div>

        {/* Feedback buttons for AI messages */}
        {isAI && !isError && !feedbackGiven && onFeedback && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Esta resposta foi útil?</span>
            <button
              onClick={() => handleFeedback(true)}
              className="p-1 hover:bg-green-100 rounded-full transition-colors group"
              title="Resposta útil"
            >
              <ThumbsUp className="w-3 h-3 text-gray-400 group-hover:text-green-600" />
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="p-1 hover:bg-red-100 rounded-full transition-colors group"
              title="Resposta não útil"
            >
              <ThumbsDown className="w-3 h-3 text-gray-400 group-hover:text-red-600" />
            </button>
          </div>
        )}

        {feedbackGiven && (
          <div className="text-xs text-gray-500 mt-2">
            Obrigado pelo feedback!
          </div>
        )}
      </div>

      {/* Avatar para mensagens do usuário */}
      {isUser && (
        <div className="flex-shrink-0">
          {getMessageIcon()}
        </div>
      )}
    </div>
  );
}
