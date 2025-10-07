import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Search,
  Car,
  Wrench,
  FileText,
  Lightbulb
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const DiagnosticPanel = ({ onDiagnosisComplete, vehicleData, isVisible = true }) => {
  const [formData, setFormData] = useState({
    symptoms: [''],
    vehicleBrand: vehicleData?.brand || '',
    vehicleModel: vehicleData?.model || '',
    year: vehicleData?.year || new Date().getFullYear(),
    mileage: vehicleData?.mileage || '',
    additionalInfo: ''
  });
  
  const [diagnosis, setDiagnosis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (vehicleData) {
      setFormData(prev => ({
        ...prev,
        vehicleBrand: vehicleData.brand || '',
        vehicleModel: vehicleData.model || '',
        year: vehicleData.year || new Date().getFullYear(),
        mileage: vehicleData.mileage || ''
      }));
    }
  }, [vehicleData]);

  const handleSymptomChange = (index, value) => {
    const newSymptoms = [...formData.symptoms];
    newSymptoms[index] = value;
    setFormData(prev => ({
      ...prev,
      symptoms: newSymptoms
    }));
  };

  const addSymptomField = () => {
    setFormData(prev => ({
      ...prev,
      symptoms: [...prev.symptoms, '']
    }));
  };

  const removeSymptomField = (index) => {
    if (formData.symptoms.length > 1) {
      const newSymptoms = formData.symptoms.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        symptoms: newSymptoms
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Filtrar sintomas vazios
      const validSymptoms = formData.symptoms.filter(s => s.trim() !== '');
      
      if (validSymptoms.length === 0) {
        toast({
          title: "Sintomas obrigatórios",
          description: "Por favor, descreva pelo menos um sintoma.",
          variant: "destructive"
        });
        return;
      }

      const diagnosisData = {
        ...formData,
        symptoms: validSymptoms
      };

      const response = await fetch('/api/ai/diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(diagnosisData)
      });

      if (!response.ok) {
        throw new Error('Falha na análise de diagnóstico');
      }

      const result = await response.json();
      setDiagnosis(result);
      
      if (onDiagnosisComplete) {
        onDiagnosisComplete(result);
      }

      toast({
        title: "Diagnóstico concluído",
        description: "Análise realizada com sucesso.",
        variant: "default"
      });

    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      toast({
        title: "Erro no diagnóstico",
        description: "Ocorreu um erro durante a análise. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Formulário de Diagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Painel de Diagnóstico IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informações do Veículo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vehicleBrand">Marca</Label>
                <Input
                  id="vehicleBrand"
                  value={formData.vehicleBrand}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vehicleBrand: e.target.value
                  }))}
                  placeholder="Ex: Ford, Volkswagen"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">Modelo</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vehicleModel: e.target.value
                  }))}
                  placeholder="Ex: Fiesta, Gol"
                  required
                />
              </div>
              <div>
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    year: parseInt(e.target.value)
                  }))}
                  required
                />
              </div>
            </div>

            {/* Quilometragem */}
            <div>
              <Label htmlFor="mileage">Quilometragem (opcional)</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  mileage: e.target.value
                }))}
                placeholder="Ex: 85000"
              />
            </div>

            {/* Sintomas */}
            <div>
              <Label>Sintomas Observados</Label>
              <div className="space-y-2">
                {formData.symptoms.map((symptom, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={symptom}
                      onChange={(e) => handleSymptomChange(index, e.target.value)}
                      placeholder={`Sintoma ${index + 1}: Ex: Motor falhando, ruído estranho`}
                      className="flex-1"
                    />
                    {formData.symptoms.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSymptomField(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSymptomField}
                  className="w-full"
                >
                  + Adicionar Sintoma
                </Button>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div>
              <Label htmlFor="additionalInfo">Informações Adicionais</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  additionalInfo: e.target.value
                }))}
                placeholder="Descreva qualquer contexto adicional, histórico de problemas, condições de uso..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Analisando...' : 'Executar Diagnóstico IA'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resultado do Diagnóstico */}
      {diagnosis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultado do Diagnóstico
              {diagnosis.confidence && (
                <Badge variant="secondary">
                  {Math.round(diagnosis.confidence * 100)}% confiança
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nível de Urgência */}
            {diagnosis.urgencyLevel && (
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full text-white ${getUrgencyColor(diagnosis.urgencyLevel)}`}>
                  {getUrgencyIcon(diagnosis.urgencyLevel)}
                </div>
                <div>
                  <p className="font-medium">Nível de Urgência</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {diagnosis.urgencyLevel}
                  </p>
                </div>
              </div>
            )}

            {/* Diagnóstico Principal */}
            {diagnosis.diagnosis && (
              <div>
                <h3 className="font-medium mb-2">Análise Diagnóstica</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {typeof diagnosis.diagnosis === 'object' ? (
                    <div className="space-y-2">
                      {diagnosis.diagnosis.primaryCause && (
                        <p><strong>Causa Principal:</strong> {diagnosis.diagnosis.primaryCause}</p>
                      )}
                      {diagnosis.diagnosis.description && (
                        <p><strong>Descrição:</strong> {diagnosis.diagnosis.description}</p>
                      )}
                      {diagnosis.diagnosis.possibleCauses && (
                        <div>
                          <strong>Possíveis Causas:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {diagnosis.diagnosis.possibleCauses.map((cause, index) => (
                              <li key={index}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{diagnosis.diagnosis}</p>
                  )}
                </div>
              </div>
            )}

            {/* Ações Sugeridas */}
            {diagnosis.suggestedActions && diagnosis.suggestedActions.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Ações Recomendadas
                </h3>
                <ul className="space-y-2">
                  {diagnosis.suggestedActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Custo Estimado */}
            {diagnosis.estimatedCost && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Custo Estimado</p>
                  <p className="text-lg font-bold text-blue-600">
                    R$ {diagnosis.estimatedCost.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2 
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1">
                Gerar Orçamento
              </Button>
              <Button variant="outline" className="flex-1">
                Compartilhar Diagnóstico
              </Button>
              <Button className="flex-1">
                Agendar Serviço
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiagnosticPanel;
