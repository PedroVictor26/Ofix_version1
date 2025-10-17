/**
 * 🤖 NLP Service - Processamento de Linguagem Natural
 * 
 * Serviço para processar mensagens do usuário e extrair:
 * - Intenções (o que o usuário quer fazer)
 * - Entidades (dados mencionados: cliente, veículo, data, hora)
 */

export class NLPService {
    /**
     * Detecta a intenção principal da mensagem do usuário
     * @param {string} mensagem - Mensagem do usuário
     * @returns {string} - Tipo de intenção detectada
     */
    static detectarIntencao(mensagem) {
        const msg = mensagem.toLowerCase().trim();
        
        // INTENÇÃO: AGENDAMENTO
        const padraoAgendamento = /\b(agendar|marcar|consulta|horário|data|segunda|terça|quarta|quinta|sexta|sábado|reservar|agendar|hora|dia)\b/i;
        if (padraoAgendamento.test(msg)) {
            return 'AGENDAMENTO';
        }
        
        // INTENÇÃO: CONSULTA ORDEM DE SERVIÇO
        const padraoOS = /\b(ordem|serviço|os|status|andamento|pronto|terminado|concluído|situação|verificar)\b/i;
        if (padraoOS.test(msg)) {
            return 'CONSULTA_OS';
        }
        
        // INTENÇÃO: CONSULTA ESTOQUE
        const padraoEstoque = /\b(peça|peças|estoque|disponível|tem|preciso|filtro|óleo|pneu|vela|bateria)\b/i;
        if (padraoEstoque.test(msg)) {
            return 'CONSULTA_ESTOQUE';
        }
        
        // INTENÇÃO: ESTATÍSTICAS
        const padraoEstatisticas = /\b(quantos|total|relatório|resumo|hoje|mês|semana|estatística|números|dados)\b/i;
        if (padraoEstatisticas.test(msg)) {
            return 'ESTATISTICAS';
        }
        
        // INTENÇÃO: CONSULTA CLIENTE
        const padraoCliente = /\b(cliente|clientes|cadastro|telefone|cpf|endereço|dados)\b/i;
        if (padraoCliente.test(msg)) {
            return 'CONSULTA_CLIENTE';
        }
        
        // INTENÇÃO: AJUDA
        const padraoAjuda = /\b(ajuda|help|o que|como|funciona|pode fazer|comandos)\b/i;
        if (padraoAjuda.test(msg)) {
            return 'AJUDA';
        }
        
        // DEFAULT: Conversa geral
        return 'CONVERSA_GERAL';
    }
    
    /**
     * Extrai entidades relacionadas a agendamento da mensagem
     * @param {string} mensagem - Mensagem do usuário
     * @returns {Object} - Objeto com entidades extraídas
     */
    static extrairEntidadesAgendamento(mensagem) {
        const entidades = {};
        const msg = mensagem.toLowerCase();
        
        // 1. EXTRAIR DIA DA SEMANA
        const diasSemana = {
            'segunda': 1,
            'segunda-feira': 1,
            'terça': 2,
            'terca': 2,
            'terça-feira': 2,
            'terca-feira': 2,
            'quarta': 3,
            'quarta-feira': 3,
            'quinta': 4,
            'quinta-feira': 4,
            'sexta': 5,
            'sexta-feira': 5,
            'sábado': 6,
            'sabado': 6
        };
        
        for (const [dia, numero] of Object.entries(diasSemana)) {
            if (msg.includes(dia)) {
                entidades.diaSemana = numero;
                entidades.diaTexto = dia;
                break;
            }
        }
        
        // 2. EXTRAIR HORA
        // Formatos: "14h", "14:00", "14 horas", "às 14"
        const padraoHora = /(?:às?\s*)?(\d{1,2})(?:h|:00|\s*horas?)?/i;
        const matchHora = mensagem.match(padraoHora);
        if (matchHora) {
            const hora = parseInt(matchHora[1]);
            if (hora >= 7 && hora <= 18) { // Horário comercial
                entidades.hora = `${hora.toString().padStart(2, '0')}:00`;
                entidades.horaTexto = `${hora}h`;
            }
        }
        
        // 3. EXTRAIR TIPO DE SERVIÇO
        const servicos = {
            'revisão': ['revisão', 'revisao', 'manutenção', 'manutencao', 'check-up', 'checkup'],
            'troca de óleo': ['óleo', 'oleo', 'troca de óleo', 'troca de oleo'],
            'alinhamento': ['alinhamento', 'alinhar'],
            'balanceamento': ['balanceamento', 'balancear'],
            'freios': ['freio', 'freios', 'pastilha', 'disco'],
            'suspensão': ['suspensão', 'suspensao', 'amortecedor'],
            'ar condicionado': ['ar condicionado', 'ar-condicionado', 'ar', 'climatização'],
            'bateria': ['bateria'],
            'pneus': ['pneu', 'pneus']
        };
        
        for (const [servico, palavrasChave] of Object.entries(servicos)) {
            if (palavrasChave.some(palavra => msg.includes(palavra))) {
                entidades.servico = servico;
                break;
            }
        }
        
        // Se não achou, tenta pegar substantivos após verbos como "fazer", "preciso"
        if (!entidades.servico) {
            const padraoServico = /(?:fazer|preciso|necessito|quero)\s+(?:de\s+)?(?:um[a]?\s+)?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+no|\s+para|\s+do|\s+da|$)/i;
            const matchServico = mensagem.match(padraoServico);
            if (matchServico) {
                entidades.servico = matchServico[1].trim();
            }
        }
        
        // 4. EXTRAIR NOME DO CLIENTE
        // Padrões: "para o João", "do João", "da Maria", "cliente João"
        const padraoNome = /(?:para o?|do|da|cliente|sr\.?|sra\.?)\s+([A-ZÀÁÂÃÄÉÈÊËÍÏÓÔÕÖÚÙÛÜÇ][a-zàáâãäéèêëíïóôõöúùûüç]+(?:\s+[A-ZÀÁÂÃÄÉÈÊËÍÏÓÔÕÖÚÙÛÜÇ][a-zàáâãäéèêëíïóôõöúùûüç]+)*)/;
        const matchNome = mensagem.match(padraoNome);
        if (matchNome) {
            entidades.cliente = matchNome[1].trim();
        }
        
        // 5. EXTRAIR MODELO DE VEÍCULO
        const modelosComuns = [
            'Gol', 'Civic', 'Corolla', 'Uno', 'Palio', 'Fox', 'Fiesta',
            'HB20', 'Onix', 'Voyage', 'Sandero', 'Kicks', 'Compass',
            'Renegade', 'Toro', 'Hilux', 'Ranger', 'Amarok', 'S10',
            'Polo', 'Jetta', 'Fusca', 'Kombi', 'Saveiro', 'Strada'
        ];
        
        for (const modelo of modelosComuns) {
            const regex = new RegExp(`\\b${modelo}\\b`, 'i');
            if (regex.test(mensagem)) {
                entidades.veiculo = modelo;
                break;
            }
        }
        
        // 6. EXTRAIR PLACA (formato: ABC-1234 ou ABC1234)
        const padraoPlaca = /\b([A-Z]{3}-?\d{4})\b/i;
        const matchPlaca = mensagem.match(padraoPlaca);
        if (matchPlaca) {
            entidades.placa = matchPlaca[1].toUpperCase().replace('-', '');
            // Formatar com hífen
            if (entidades.placa.length === 7) {
                entidades.placa = `${entidades.placa.slice(0, 3)}-${entidades.placa.slice(3)}`;
            }
        }
        
        // 7. EXTRAIR DATA ESPECÍFICA (DD/MM ou DD/MM/YYYY)
        const padraoData = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/;
        const matchData = mensagem.match(padraoData);
        if (matchData) {
            const dia = parseInt(matchData[1]);
            const mes = parseInt(matchData[2]) - 1; // JavaScript conta meses de 0-11
            const ano = matchData[3] ? parseInt(matchData[3]) : new Date().getFullYear();
            
            const data = new Date(ano, mes, dia);
            if (!isNaN(data.getTime())) {
                entidades.dataEspecifica = data.toISOString().split('T')[0];
            }
        }
        
        // 8. DETECTAR URGÊNCIA
        const padraoUrgencia = /\b(urgente|emergência|rápido|hoje|agora|imediato)\b/i;
        if (padraoUrgencia.test(msg)) {
            entidades.urgente = true;
        }
        
        return entidades;
    }
    
    /**
     * Calcula a próxima data baseada no dia da semana
     * @param {number} diaSemana - Número do dia (1=segunda, 2=terça, etc)
     * @returns {string} - Data no formato YYYY-MM-DD
     */
    static calcularProximaData(diaSemana) {
        const hoje = new Date();
        const diaAtual = hoje.getDay(); // 0=domingo, 1=segunda, etc
        
        // Calcular dias até o próximo dia da semana desejado
        let diasAte = diaSemana - diaAtual;
        
        // Se o dia já passou esta semana, ir para a próxima
        if (diasAte <= 0) {
            diasAte += 7;
        }
        
        // Criar nova data
        const proximaData = new Date(hoje);
        proximaData.setDate(hoje.getDate() + diasAte);
        
        // Retornar no formato YYYY-MM-DD
        return proximaData.toISOString().split('T')[0];
    }
    
    /**
     * Formata data para exibição amigável em português
     * @param {string} dataISO - Data no formato YYYY-MM-DD
     * @returns {string} - Data formatada (ex: "Segunda, 20/10/2025")
     */
    static formatarDataAmigavel(dataISO) {
        const data = new Date(dataISO + 'T00:00:00');
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        const diaSemana = diasSemana[data.getDay()];
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();
        
        return `${diaSemana}, ${dia}/${mes}/${ano}`;
    }
    
    /**
     * Valida se todos os dados necessários para agendamento estão presentes
     * @param {Object} entidades - Objeto com entidades extraídas
     * @returns {Object} - { valido: boolean, faltando: array }
     */
    static validarDadosAgendamento(entidades) {
        const faltando = [];
        
        if (!entidades.cliente && !entidades.placa) {
            faltando.push('nome do cliente ou placa do veículo');
        }
        
        if (!entidades.veiculo && !entidades.placa) {
            faltando.push('modelo do veículo');
        }
        
        if (!entidades.diaSemana && !entidades.dataEspecifica) {
            faltando.push('dia (ex: segunda, terça, ou data específica)');
        }
        
        if (!entidades.hora) {
            faltando.push('horário (ex: 14h, 16:00)');
        }
        
        if (!entidades.servico) {
            faltando.push('tipo de serviço (ex: revisão, troca de óleo)');
        }
        
        return {
            valido: faltando.length === 0,
            faltando
        };
    }
    
    /**
     * Extrai informações para consulta de OS
     * @param {string} mensagem - Mensagem do usuário
     * @returns {Object} - Dados para consulta
     */
    static extrairDadosConsultaOS(mensagem) {
        const dados = {};
        const msg = mensagem.toLowerCase();
        
        // Extrair número da OS
        const padraoNumeroOS = /\b(?:os|ordem|n[úu]mero)\s*#?(\d+)\b/i;
        const matchOS = mensagem.match(padraoNumeroOS);
        if (matchOS) {
            dados.numeroOS = parseInt(matchOS[1]);
        }
        
        // Extrair placa
        const padraoPlaca = /\b([A-Z]{3}-?\d{4})\b/i;
        const matchPlaca = mensagem.match(padraoPlaca);
        if (matchPlaca) {
            dados.placa = matchPlaca[1].toUpperCase().replace('-', '');
            if (dados.placa.length === 7) {
                dados.placa = `${dados.placa.slice(0, 3)}-${dados.placa.slice(3)}`;
            }
        }
        
        // Extrair nome
        const padraoNome = /(?:do|da|de)\s+([A-ZÀÁÂÃÄÉÈÊËÍÏÓÔÕÖÚÙÛÜÇ][a-zàáâãäéèêëíïóôõöúùûüç]+(?:\s+[A-ZÀÁÂÃÄÉÈÊËÍÏÓÔÕÖÚÙÛÜÇ][a-zàáâãäéèêëíïóôõöúùûüç]+)*)/;
        const matchNome = mensagem.match(padraoNome);
        if (matchNome) {
            dados.cliente = matchNome[1].trim();
        }
        
        // Extrair status desejado
        if (msg.includes('pronto') || msg.includes('concluído') || msg.includes('terminado')) {
            dados.status = 'CONCLUIDO';
        } else if (msg.includes('andamento') || msg.includes('fazendo')) {
            dados.status = 'EM_ANDAMENTO';
        } else if (msg.includes('aguardando') || msg.includes('pendente')) {
            dados.status = 'AGUARDANDO';
        }
        
        return dados;
    }
    
    /**
     * Gera resposta de ajuda com comandos disponíveis
     * @returns {string} - Texto de ajuda
     */
    static gerarMensagemAjuda() {
        return `🤖 **Assistente Matias - Como posso ajudar:**

**📅 AGENDAMENTOS**
• "Agendar revisão para o Gol do João na segunda às 14h"
• "Marcar troca de óleo para terça 16h"
• "Consulta para o Civic na sexta às 10h"

**🔍 CONSULTAR SERVIÇOS**
• "Status da OS do Gol placa ABC-1234"
• "Ordens de serviço do João"
• "Mostrar serviços em andamento"

**📦 CONSULTAR ESTOQUE**
• "Tem filtro de óleo disponível?"
• "Verificar estoque de pastilhas de freio"
• "Peças em falta"

**📊 ESTATÍSTICAS**
• "Quantos carros atendemos hoje?"
• "Resumo do mês"
• "Estatísticas da oficina"

**👤 CLIENTES**
• "Dados do cliente João"
• "Telefone da Maria"
• "Listar clientes"

💡 **Dica:** Quanto mais detalhes você fornecer, melhor consigo ajudar!`;
    }
}

export default NLPService;
