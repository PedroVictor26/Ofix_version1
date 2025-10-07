import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Brain,
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Tag,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
  Link
} from 'lucide-react';

/**
 * Sistema de Gestão de Base de Conhecimento
 * Permite adicionar, editar e organizar informações para o assistente
 */
const KnowledgeManagement = ({ className = '' }) => {
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
    category: '',
    tags: [],
    type: 'faq', // faq, procedure, policy, technical
    priority: 'medium',
    isActive: true
  });

  // Dados mockados
  const mockCategories = [
    { id: 'servicos', name: 'Serviços', count: 15 },
    { id: 'pecas', name: 'Peças', count: 8 },
    { id: 'diagnostico', name: 'Diagnóstico', count: 12 },
    { id: 'atendimento', name: 'Atendimento', count: 6 },
    { id: 'politicas', name: 'Políticas', count: 4 }
  ];

  const mockKnowledge = [
    {
      id: 1,
      title: 'Como diagnosticar problema no motor',
      content: 'Procedimento completo para diagnóstico de motores...',
      category: 'diagnostico',
      tags: ['motor', 'diagnóstico', 'problemas'],
      type: 'procedure',
      priority: 'high',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Sistema',
      views: 45,
      helpful: 38
    },
    {
      id: 2,
      title: 'Preços de serviços de freio',
      content: 'Tabela de preços para serviços relacionados ao sistema de freios...',
      category: 'servicos',
      tags: ['freio', 'preços', 'serviços'],
      type: 'faq',
      priority: 'medium',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Gestor',
      views: 23,
      helpful: 20
    }
  ];

  useEffect(() => {
    loadKnowledgeBase();
    loadCategories();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/knowledge', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setKnowledgeItems(data.length > 0 ? data : mockKnowledge);
      } else {
        setKnowledgeItems(mockKnowledge);
      }
    } catch (error) {
      // console.error('Erro ao carregar base de conhecimento:', error);
      setKnowledgeItems(mockKnowledge);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/ai/knowledge/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.length > 0 ? data : mockCategories);
      } else {
        setCategories(mockCategories);
      }
    } catch (error) {
      // console.error('Erro ao carregar categorias:', error);
      setCategories(mockCategories);
    }
  };

  const saveKnowledgeItem = async () => {
    try {
      setLoading(true);
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `/api/ai/knowledge/${editingItem.id}`
        : '/api/ai/knowledge';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        await loadKnowledgeBase();
        setShowAddModal(false);
        setEditingItem(null);
        setNewItem({
          title: '',
          content: '',
          category: '',
          tags: [],
          type: 'faq',
          priority: 'medium',
          isActive: true
        });
      }
    } catch (error) {
      // console.error('Erro ao salvar item:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteKnowledgeItem = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const response = await fetch(`/api/ai/knowledge/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await loadKnowledgeBase();
      }
    } catch (error) {
      // console.error('Erro ao excluir item:', error);
    }
  };

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'faq': return <FileText className="h-4 w-4" />;
      case 'procedure': return <BookOpen className="h-4 w-4" />;
      case 'policy': return <AlertCircle className="h-4 w-4" />;
      case 'technical': return <Brain className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportKnowledge = () => {
    const dataStr = JSON.stringify(knowledgeItems, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-base-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Base de Conhecimento</h2>
          <p className="text-gray-600">Gerencie informações e conteúdo para o assistente</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportKnowledge}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold text-gray-900">{knowledgeItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categorias</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Itens Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {knowledgeItems.filter(item => item.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mais Acessados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.max(...knowledgeItems.map(item => item.views || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar na base de conhecimento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Conhecimento */}
      <Card>
        <CardHeader>
          <CardTitle>Itens de Conhecimento ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(item.type)}
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        {!item.isActive && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {item.content.substring(0, 150)}...
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setNewItem(item);
                          setShowAddModal(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteKnowledgeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {item.author}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>{item.views || 0} visualizações</span>
                      <span>{item.helpful || 0} úteis</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum item encontrado
                </h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Tente ajustar os filtros de pesquisa.' 
                    : 'Adicione o primeiro item à base de conhecimento.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Adicionar/Editar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Editar Item' : 'Adicionar Novo Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Título do item de conhecimento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo
                </label>
                <textarea
                  value={newItem.content}
                  onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={6}
                  placeholder="Conteúdo detalhado..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="faq">FAQ</option>
                    <option value="procedure">Procedimento</option>
                    <option value="policy">Política</option>
                    <option value="technical">Técnico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={Array.isArray(newItem.tags) ? newItem.tags.join(', ') : ''}
                  onChange={(e) => setNewItem(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  setNewItem({
                    title: '',
                    content: '',
                    category: '',
                    tags: [],
                    type: 'faq',
                    priority: 'medium',
                    isActive: true
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={saveKnowledgeItem}
                disabled={loading || !newItem.title || !newItem.content}
              >
                {loading ? 'Salvando...' : (editingItem ? 'Atualizar' : 'Adicionar')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeManagement;
