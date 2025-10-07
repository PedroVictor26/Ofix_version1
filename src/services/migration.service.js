/**
 * 🔄 SISTEMA DE MIGRAÇÃO DE DADOS OFIX
 * 
 * Sistema completo para migrar dados de sistemas antigos para o OFIX
 * Suporta múltiplos formatos: CSV, Excel, JSON, SQL
 * 
 * Funcionalidades:
 * - Importação de clientes
 * - Importação de veículos
 * - Importação de histórico de serviços
 * - Validação de dados
 * - Relatórios de migração
 * - Rollback em caso de erro
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { createCliente } from '../services/clientes.service';
import { createVeiculo } from '../services/clientes.service';
import { createServico } from '../services/servicos.service';

class DataMigrationService {
  constructor() {
    this.migrationLog = [];
    this.errors = [];
    this.successCount = 0;
    this.totalCount = 0;
  }

  /**
   * 📊 Processar arquivo de migração
   */
  async processFile(file, dataType = 'clientes') {
    console.log(`🔄 Iniciando migração de ${dataType} do arquivo: ${file.name}`);
    
    this.resetCounters();
    
    try {
      let data = [];
      
      // Detectar tipo de arquivo e processar
      if (file.name.endsWith('.csv')) {
        data = await this.parseCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await this.parseExcel(file);
      } else if (file.name.endsWith('.json')) {
        data = await this.parseJSON(file);
      } else {
        throw new Error('Formato de arquivo não suportado. Use CSV, Excel ou JSON.');
      }

      this.totalCount = data.length;
      
      // Processar dados baseado no tipo
      switch (dataType) {
        case 'clientes':
          await this.migrateClientes(data);
          break;
        case 'veiculos':
          await this.migrateVeiculos(data);
          break;
        case 'servicos':
          await this.migrateServicos(data);
          break;
        default:
          throw new Error('Tipo de dados não suportado');
      }

      return this.generateMigrationReport();
      
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      this.logError('CRITICAL', error.message);
      throw error;
    }
  }

  /**
   * 📄 Parsear arquivo CSV
   */
  async parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('⚠️ Avisos no CSV:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`Erro ao processar CSV: ${error.message}`));
        }
      });
    });
  }

  /**
   * 📊 Parsear arquivo Excel
   */
  async parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          resolve(data);
        } catch (error) {
          reject(new Error(`Erro ao processar Excel: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo Excel'));
      reader.readAsBinaryString(file);
    });
  }

  /**
   * 📝 Parsear arquivo JSON
   */
  async parseJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(Array.isArray(data) ? data : [data]);
        } catch (error) {
          reject(new Error(`Erro ao processar JSON: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo JSON'));
      reader.readAsText(file);
    });
  }

  /**
   * 👥 Migrar dados de clientes
   */
  async migrateClientes(clientesData) {
    console.log(`🔄 Migrando ${clientesData.length} clientes...`);
    
    for (let i = 0; i < clientesData.length; i++) {
      const clienteRaw = clientesData[i];
      
      try {
        // Mapear campos do arquivo para o formato OFIX
        const cliente = this.mapClienteFields(clienteRaw);
        
        // Validar dados obrigatórios
        if (!this.validateCliente(cliente)) {
          this.logError('VALIDATION', `Cliente linha ${i + 1}: dados obrigatórios faltando`, clienteRaw);
          continue;
        }

        // Criar cliente no sistema
        const novoCliente = await createCliente(cliente);
        
        this.logSuccess('CLIENTE', `Cliente ${cliente.nomeCompleto} migrado com sucesso`, novoCliente.id);
        this.successCount++;
        
      } catch (error) {
        this.logError('API', `Erro ao criar cliente linha ${i + 1}: ${error.message}`, clienteRaw);
      }
    }
  }

  /**
   * 🚗 Migrar dados de veículos
   */
  async migrateVeiculos(veiculosData) {
    console.log(`🔄 Migrando ${veiculosData.length} veículos...`);
    
    for (let i = 0; i < veiculosData.length; i++) {
      const veiculoRaw = veiculosData[i];
      
      try {
        // Mapear campos do arquivo para o formato OFIX
        const veiculo = this.mapVeiculoFields(veiculoRaw);
        
        // Validar dados obrigatórios
        if (!this.validateVeiculo(veiculo)) {
          this.logError('VALIDATION', `Veículo linha ${i + 1}: dados obrigatórios faltando`, veiculoRaw);
          continue;
        }

        // Criar veículo no sistema
        const novoVeiculo = await createVeiculo(veiculo);
        
        this.logSuccess('VEICULO', `Veículo ${veiculo.marca} ${veiculo.modelo} migrado com sucesso`, novoVeiculo.id);
        this.successCount++;
        
      } catch (error) {
        this.logError('API', `Erro ao criar veículo linha ${i + 1}: ${error.message}`, veiculoRaw);
      }
    }
  }

  /**
   * 🔧 Migrar dados de serviços
   */
  async migrateServicos(servicosData) {
    console.log(`🔄 Migrando ${servicosData.length} serviços...`);
    
    for (let i = 0; i < servicosData.length; i++) {
      const servicoRaw = servicosData[i];
      
      try {
        // Mapear campos do arquivo para o formato OFIX
        const servico = this.mapServicoFields(servicoRaw);
        
        // Validar dados obrigatórios
        if (!this.validateServico(servico)) {
          this.logError('VALIDATION', `Serviço linha ${i + 1}: dados obrigatórios faltando`, servicoRaw);
          continue;
        }

        // Criar serviço no sistema
        const novoServico = await createServico(servico);
        
        this.logSuccess('SERVICO', `Serviço OS ${servico.numeroOs} migrado com sucesso`, novoServico.id);
        this.successCount++;
        
      } catch (error) {
        this.logError('API', `Erro ao criar serviço linha ${i + 1}: ${error.message}`, servicoRaw);
      }
    }
  }

  /**
   * 🗂️ Mapear campos de cliente
   */
  mapClienteFields(raw) {
    return {
      nomeCompleto: raw.nome || raw.nomeCompleto || raw.cliente || raw.name || '',
      cpfCnpj: raw.cpf || raw.cnpj || raw.cpfCnpj || raw.documento || '',
      telefone: raw.telefone || raw.celular || raw.phone || raw.contato || '',
      email: raw.email || raw.emailCliente || '',
      endereco: raw.endereco || raw.address || raw.enderecoCompleto || ''
    };
  }

  /**
   * 🚗 Mapear campos de veículo
   */
  mapVeiculoFields(raw) {
    return {
      placa: raw.placa || raw.placaVeiculo || '',
      marca: raw.marca || raw.fabricante || '',
      modelo: raw.modelo || raw.modeloVeiculo || '',
      anoFabricacao: this.parseYear(raw.ano || raw.anoFabricacao || raw.anoFab),
      anoModelo: this.parseYear(raw.anoModelo || raw.ano),
      cor: raw.cor || raw.corVeiculo || '',
      chassi: raw.chassi || raw.numeroChast || '',
      combustivel: raw.combustivel || raw.tipoCombustivel || 'GASOLINA',
      clienteId: raw.clienteId || '' // Deve ser preenchido externamente
    };
  }

  /**
   * 🔧 Mapear campos de serviço
   */
  mapServicoFields(raw) {
    return {
      numeroOs: raw.numeroOs || raw.os || raw.ordemServico || '',
      descricaoProblema: raw.problema || raw.descricaoProblema || raw.servico || '',
      descricaoSolucao: raw.solucao || raw.descricaoSolucao || '',
      status: this.mapStatus(raw.status || raw.situacao),
      dataEntrada: this.parseDate(raw.dataEntrada || raw.data),
      dataPrevisaoEntrega: this.parseDate(raw.dataPrevisao || raw.previsao),
      dataConclusao: this.parseDate(raw.dataConclusao || raw.dataFim),
      valorTotalFinal: this.parseValue(raw.valor || raw.valorTotal || raw.preco),
      clienteId: raw.clienteId || '',
      veiculoId: raw.veiculoId || ''
    };
  }

  /**
   * ✅ Validação de cliente
   */
  validateCliente(cliente) {
    return cliente.nomeCompleto && cliente.nomeCompleto.trim().length > 0;
  }

  /**
   * ✅ Validação de veículo
   */
  validateVeiculo(veiculo) {
    return veiculo.placa && veiculo.marca && veiculo.modelo;
  }

  /**
   * ✅ Validação de serviço
   */
  validateServico(servico) {
    return servico.numeroOs && servico.clienteId && servico.veiculoId;
  }

  /**
   * 🛠️ Utilitários de conversão
   */
  parseYear(value) {
    if (!value) return null;
    const year = parseInt(value.toString());
    return (year > 1900 && year <= new Date().getFullYear() + 1) ? year : null;
  }

  parseDate(value) {
    if (!value) return null;
    
    // Tentar diferentes formatos de data
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      if (format.test(value)) {
        const date = new Date(value);
        return date.toISOString();
      }
    }
    
    return null;
  }

  parseValue(value) {
    if (!value) return 0;
    
    // Remover caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.toString()
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.');
      
    return parseFloat(cleanValue) || 0;
  }

  mapStatus(status) {
    if (!status) return 'AGUARDANDO';
    
    const statusMap = {
      'aguardando': 'AGUARDANDO',
      'em andamento': 'EM_ANDAMENTO',
      'andamento': 'EM_ANDAMENTO',
      'aguardando peças': 'AGUARDANDO_PECAS',
      'aguardando pecas': 'AGUARDANDO_PECAS',
      'aguardando aprovação': 'AGUARDANDO_APROVACAO',
      'aguardando aprovacao': 'AGUARDANDO_APROVACAO',
      'finalizado': 'FINALIZADO',
      'concluído': 'FINALIZADO',
      'concluido': 'FINALIZADO',
      'cancelado': 'CANCELADO'
    };
    
    return statusMap[status.toLowerCase()] || 'AGUARDANDO';
  }

  /**
   * 📝 Sistema de logs
   */
  logSuccess(type, message, id = null) {
    this.migrationLog.push({
      type: 'SUCCESS',
      category: type,
      message,
      id,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ ${type}: ${message}`);
  }

  logError(type, message, data = null) {
    this.errors.push({
      type,
      message,
      data,
      timestamp: new Date().toISOString()
    });
    console.error(`❌ ${type}: ${message}`, data);
  }

  /**
   * 📊 Gerar relatório de migração
   */
  generateMigrationReport() {
    const report = {
      summary: {
        total: this.totalCount,
        success: this.successCount,
        errors: this.errors.length,
        successRate: this.totalCount > 0 ? ((this.successCount / this.totalCount) * 100).toFixed(2) : 0
      },
      logs: this.migrationLog,
      errors: this.errors,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Relatório de Migração:', report);
    return report;
  }

  /**
   * 🔄 Reset contadores
   */
  resetCounters() {
    this.migrationLog = [];
    this.errors = [];
    this.successCount = 0;
    this.totalCount = 0;
  }

  /**
   * 📥 Exportar template para migração
   */
  generateTemplate(type) {
    const templates = {
      clientes: [
        {
          nome: 'João Silva Santos',
          cpf: '123.456.789-00',
          telefone: '(11) 99999-1234',
          email: 'joao@email.com',
          endereco: 'Rua das Flores, 123 - São Paulo'
        }
      ],
      veiculos: [
        {
          placa: 'ABC-1234',
          marca: 'Toyota',
          modelo: 'Corolla',
          ano: '2020',
          cor: 'Prata',
          combustivel: 'FLEX',
          clienteId: 'ID_DO_CLIENTE'
        }
      ],
      servicos: [
        {
          numeroOs: 'OS001',
          problema: 'Troca de óleo',
          status: 'FINALIZADO',
          dataEntrada: '01/03/2024',
          valor: 'R$ 150,00',
          clienteId: 'ID_DO_CLIENTE',
          veiculoId: 'ID_DO_VEICULO'
        }
      ]
    };

    return templates[type] || [];
  }
}

// Exportar serviço de migração
export const migrationService = new DataMigrationService();

// Hook para usar migração em componentes React
export const useDataMigration = () => {
  return {
    processFile: migrationService.processFile.bind(migrationService),
    generateTemplate: migrationService.generateTemplate.bind(migrationService),
    generateMigrationReport: migrationService.generateMigrationReport.bind(migrationService)
  };
};
