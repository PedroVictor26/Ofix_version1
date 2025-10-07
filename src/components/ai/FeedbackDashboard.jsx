import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

/**
 * Sistema de Feedback e Avaliação do Assistente Virtual
 * Coleta e exibe feedbacks dos usuários sobre as interações
 */
const FeedbackDashboard = ({ className = '' }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newFeedback, setNewFeedback] = useState({
    rating: 0,
    comment: '',
    category: 'geral'
  });

  // Dados mockados de feedback
  const mockFeedbacks = [
    {
      id: 1,
      userId: 'usr_001',
      rating: 5,
      comment: 'Excelente atendimento! O assistente foi muito útil.',
      category: 'atendimento',
      conversationId: 'conv_123',
      createdAt: new Date().toISOString(),
      userType: 'cliente'
    },
    {
      id: 2,
      userId: 'usr_002',
      rating: 4,
      comment: 'Bom, mas pode melhorar nas respostas técnicas.',
      category: 'tecnico',
      conversationId: 'conv_124',
      createdAt: new Date().toISOString(),
      userType: 'mecanico'
    },
    {
      id: 3,
      userId: 'usr_003',
      rating: 3,
      comment: 'Médio. Às vezes não entende direito.',
      category: 'compreensao',
      conversationId: 'conv_125',
      createdAt: new Date().toISOString(),
      userType: 'cliente'
    }
  ];

  // Métricas de satisfação
  const satisfactionMetrics = {
    averageRating: 4.2,
    totalFeedbacks: 156,
    positivePercentage: 78,
    negativePercentage: 12,
    neutralPercentage: 10
  };

  const submitFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newFeedback)
      });

      if (response.ok) {
        const result = await response.json();
        setFeedbacks(prev => [result, ...prev]);
        setNewFeedback({ rating: 0, comment: '', category: 'geral' });
      }
    } catch (error) {
      // console.error('Erro ao enviar feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        } ${
          interactive ? 'cursor-pointer hover:text-yellow-400' : ''
        }`}
        onClick={interactive && onRate ? () => onRate(i + 1) : undefined}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryBadge = (category) => {
    const colors = {
      atendimento: 'bg-blue-100 text-blue-800',
      tecnico: 'bg-green-100 text-green-800',
      compreensao: 'bg-orange-100 text-orange-800',
      velocidade: 'bg-purple-100 text-purple-800',
      geral: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.geral;
  };

  const filteredFeedbacks = mockFeedbacks.filter(feedback => {
    if (filter === 'all') return true;
    if (filter === 'positive') return feedback.rating >= 4;
    if (filter === 'negative') return feedback.rating <= 2;
    if (filter === 'neutral') return feedback.rating === 3;
    return true;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback do Assistente</h2>
          <p className="text-gray-600">Avaliações e comentários dos usuários</p>
        </div>
      </div>

      {/* Métricas de Satisfação */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex text-yellow-400">
                {renderStars(Math.round(satisfactionMetrics.averageRating))}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                <p className="text-2xl font-bold text-gray-900">
                  {satisfactionMetrics.averageRating}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ThumbsUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Positivos</p>
                <p className="text-2xl font-bold text-green-600">
                  {satisfactionMetrics.positivePercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ThumbsDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Negativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {satisfactionMetrics.negativePercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {satisfactionMetrics.totalFeedbacks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novo Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Dar Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avaliação
              </label>
              <div className="flex">
                {renderStars(
                  newFeedback.rating,
                  true,
                  (rating) => setNewFeedback(prev => ({ ...prev, rating }))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={newFeedback.category}
                onChange={(e) => setNewFeedback(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="geral">Geral</option>
                <option value="atendimento">Atendimento</option>
                <option value="tecnico">Técnico</option>
                <option value="compreensao">Compreensão</option>
                <option value="velocidade">Velocidade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentário
              </label>
              <textarea
                value={newFeedback.comment}
                onChange={(e) => setNewFeedback(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Compartilhe sua experiência..."
              />
            </div>

            <Button
              onClick={submitFeedback}
              disabled={loading || newFeedback.rating === 0}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'positive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('positive')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Positivos
            </Button>
            <Button
              variant={filter === 'negative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('negative')}
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              Negativos
            </Button>
            <Button
              variant={filter === 'neutral' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('neutral')}
            >
              <Filter className="h-4 w-4 mr-1" />
              Neutros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>Feedbacks Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFeedbacks.length > 0 ? (
              filteredFeedbacks.map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(feedback.rating)}
                      </div>
                      <Badge className={getCategoryBadge(feedback.category)}>
                        {feedback.category}
                      </Badge>
                      <Badge variant="outline">
                        {feedback.userType}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{feedback.comment}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Usuário: {feedback.userId}</span>
                    <span>Conversa: {feedback.conversationId}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum feedback encontrado
                </h3>
                <p className="text-gray-600">
                  Ajuste os filtros ou aguarde novos feedbacks dos usuários.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackDashboard;
