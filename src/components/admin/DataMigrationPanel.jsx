import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, RefreshCw } from "lucide-react";
import toast from 'react-hot-toast';

/**
 * 🔄 COMPONENTE DE MIGRAÇÃO DE DADOS
 * 
 * Interface simplificada para migração de dados antigos para o OFIX
 */
export default function DataMigrationPanel() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * 📁 Selecionar arquivo
   */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log('📁 Arquivo selecionado:', file.name);
    }
  };

  /**
   * 🚀 Iniciar migração (placeholder)
   */
  const handleStartMigration = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo para migração');
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('Processando migração...');

    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Migração concluída com sucesso!', { id: toastId });
    } catch (err) {
      toast.error('Erro na migração', { id: toastId });
      console.error('Erro na migração:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 📥 Baixar template (placeholder)
   */
  const handleDownloadTemplate = () => {
    toast.success('Funcionalidade em desenvolvimento');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          🔄 Migração de Dados
        </h2>
        <p className="text-slate-600 mt-2">
          Importe dados de sistemas antigos para o OFIX
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.json"
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                Clique para selecionar arquivo (.csv, .xlsx, .json)
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800">{selectedFile.name}</p>
              <p className="text-sm text-green-600">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Template
            </Button>
            
            <Button
              onClick={handleStartMigration}
              disabled={!selectedFile || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Migrar
            </Button>

            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
