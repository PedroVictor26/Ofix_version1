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
        
        // INTENÇÃO: AJUDA (verificar primeiro para não confundir)
        const padraoAjuda = /\b(ajuda|help|o que pode|como funciona|pode fazer|comandos|menu|opções)\b/i;
        if (padraoAjuda.test(msg)) {
            return 'AJUDA';
        }
        
        // INTENÇÃO: AGENDAMENTO (incluir mais variações)
        const padraoAgendamento = /\b(agendar|agendamento|marcar|marca|marcação|reservar|reserva|horário|horario|data|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo|revisão|revisao|troca|manutenção|manutencao|às|as)\b/i;
        if (padraoAgendamento.test(msg)) {
            return 'AGENDAMENTO';
        }
        
        // INTENÇÃO: CONSULTA ORDEM DE SERVIÇO
        const padraoOS = /\b(ordem|serviço|servico|os|status|andamento|pronto|terminado|concluído|concluido|situação|situacao|verificar|consultar os|meu carro|veículo|veiculo)\b/i;
        if (padraoOS.test(msg)) {
            return 'CONSULTA_OS';
        }
        
        // INTENÇÃO: CONSULTA ESTOQUE
        const padraoEstoque = /\b(peça|peca|peças|pecas|estoque|disponível|disponivel|tem em|preciso de|filtro|óleo|oleo|pneu|vela|bateria|pastilha|disco|amortecedor)\b/i;
        if (padraoEstoque.test(msg)) {
            return 'CONSULTA_ESTOQUE';
        }
        
        // INTENÇÃO: ESTATÍSTICAS
        const padraoEstatisticas = /\b(quantos|quanto|total|relatório|relatorio|resumo|hoje|ontem|mês|mes|semana|estatística|estatistica|números|numeros|dados|carros atendidos|faturamento)\b/i;
        if (padraoEstatisticas.test(msg)) {
            return 'ESTATISTICAS';
        }
        
        // INTENÇÃO: CADASTRAR CLIENTE (verificar ANTES de consulta para não confundir)
        // Detecta tanto comandos explícitos quanto dados estruturados
        const padraoCadastro = /\b(cadastrar|cadastro|cadastre|novo cliente|adicionar cliente|criar cliente|incluir cliente|registrar cliente|criar cadastro|fazer cadastro|quero cadastrar)\b/i;
        const formatoDados = /(?:nome|tel|telefone|cpf|cnpj|email):\s*[^,\n]+/i;
        
        console.log('🔍 DEBUG CADASTRO:');
        console.log('   - Teste comando cadastro:', padraoCadastro.test(msg));
        console.log('   - Teste formato dados:', formatoDados.test(msg));
        console.log('   - Mensagem:', msg.substring(0, 100));
        
        if (padraoCadastro.test(msg) || formatoDados.test(msg)) {
            console.log('   ✅ DETECTADO COMO CADASTRAR_CLIENTE');
            return 'CADASTRAR_CLIENTE';
        }
        
        // INTENÇÃO: CONSULTA CLIENTE
        const padraoCliente = /\b(cliente|clientes|telefone|cpf|cnpj|endereço|endereco|contato|dados do cliente)\b/i;
        if (padraoCliente.test(msg)) {
            console.log('   ℹ️ DETECTADO COMO CONSULTA_CLIENTE');
            return 'CONSULTA_CLIENTE';
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
        
        // 4. EXTRAIR MODELO DE VEÍCULO (fazer ANTES do nome para não confundir)
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
        
        // 5. EXTRAIR NOME DO CLIENTE
        // Padrões melhorados: "do João", "da Maria", "para o João", "cliente João", "Nome: João"
        // IMPORTANTE: Ignorar se for um modelo de veículo
        
        console.log('   🔍 Iniciando extração de nome...');
        console.log('   📝 Mensagem original:', mensagem);
        console.log('   🚗 Veículo já detectado:', entidades.veiculo);
        
        // Se já detectamos um veículo, remover ele da mensagem antes de buscar o nome
        let mensagemSemVeiculo = mensagem;
        if (entidades.veiculo) {
            // Remover "para o Gol", "do Gol", etc
            const regexRemoverVeiculo = new RegExp(`\\b(para o|para a|do|da)\\s+${entidades.veiculo}\\b`, 'gi');
            mensagemSemVeiculo = mensagem.replace(regexRemoverVeiculo, '');
            console.log('   📝 Mensagem sem veículo:', mensagemSemVeiculo);
        }
        
        // Tentar padrão explícito primeiro: "Nome: João" ou "Cliente: João"
        const padraoExplicito = /(?:nome|cliente):\s*([A-ZÀ-Üa-zà-ü]+(?:\s+[A-ZÀ-Üa-zà-ü]+)*)/i;
        const matchExplicito = mensagemSemVeiculo.match(padraoExplicito);
        
        console.log('   🔎 Match explícito (Nome:/Cliente:):', matchExplicito);
        
        if (matchExplicito) {
            const nomeExtraido = matchExplicito[1].trim();
            console.log('   ✅ Nome extraído (explícito):', nomeExtraido);
            if (!modelosComuns.some(m => m.toLowerCase() === nomeExtraido.toLowerCase())) {
                entidades.cliente = nomeExtraido;
                console.log('   ✅ Cliente definido:', entidades.cliente);
            } else {
                console.log('   ⚠️ Nome descartado (é modelo de veículo)');
            }
        } else {
            // Tentar padrões contextuais: "do João", "da Maria", etc
            const padraoNome = /(?:do|da|para o|para a|de|cliente)\s+([A-ZÀ-Üa-zà-ü]+(?:\s+[A-ZÀ-Üa-zà-ü]+)*?)(?:\s+na|\s+no|\s+às|\s+as|\s+em|\s+,|\s*$)/i;
            const matchNome = mensagemSemVeiculo.match(padraoNome);
            
            console.log('   🔎 Match contextual (do/da/para):', matchNome);
            
            if (matchNome) {
                const nomeExtraido = matchNome[1].trim();
                console.log('   ✅ Nome extraído (contextual):', nomeExtraido);
                // Verificar se não é um modelo de veículo
                if (!modelosComuns.some(m => m.toLowerCase() === nomeExtraido.toLowerCase())) {
                    entidades.cliente = nomeExtraido;
                    console.log('   ✅ Cliente definido:', entidades.cliente);
                } else {
                    console.log('   ⚠️ Nome descartado (é modelo de veículo):', nomeExtraido);
                }
            } else {
                console.log('   ❌ Nenhum nome detectado');
            }
        }
        
        // 6. EXTRAIR PLACA (formato: ABC-1234 ou ABC1234)
        // Também aceitar formato "Placa: ABC-1234"
        let padraoPlaca = /\b([A-Z]{3}-?\d{4})\b/i;
        let matchPlaca = mensagem.match(padraoPlaca);
        
        // Se não encontrou, tentar formato explícito
        if (!matchPlaca) {
            padraoPlaca = /placa:\s*([A-Z]{3}-?\d{1,4})/i;
            matchPlaca = mensagem.match(padraoPlaca);
        }
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
     * Extrai dados para cadastro de cliente
     * @param {string} mensagem - Mensagem do usuário
     * @returns {Object} - Objeto com dados do cliente
     */
    static extrairDadosCliente(mensagem) {
        const dados = {};
        
        // Extrair nome - FORMATO 1: "Nome: João Silva"
        const padraoNomeFormatado = /(?:nome|cliente):\s*([A-ZÀ-Üa-zà-ü\s]+?)(?:\s*,|\s*tel|\s*cpf|\s*email|\s*$)/i;
        const matchNomeFormatado = mensagem.match(padraoNomeFormatado);
        if (matchNomeFormatado) {
            dados.nome = matchNomeFormatado[1].trim();
        } else {
            // FORMATO 2: "cadastrar o João Silva" ou "novo cliente Maria Costa"
            const padraoNomeComando = /(?:cadastrar|cadastro|cadastre|criar|adicionar|novo cliente|incluir|registrar)\s+(?:o|a|um|uma)?\s*([A-ZÀ-Üa-zà-ü][A-ZÀ-Üa-zà-ü\s]{2,}?)(?:\s*,|\s*tel|\s*cpf|\s*email|\s*na|\s*no|\s*para|\s*$)/i;
            const matchNomeComando = mensagem.match(padraoNomeComando);
            if (matchNomeComando) {
                dados.nome = matchNomeComando[1].trim();
            }
        }
        
        // Extrair telefone (vários formatos)
        const padraoTelefone = /(?:tel|telefone|celular|fone):\s*([0-9\s\(\)-]{10,15})/i;
        const matchTelefone = mensagem.match(padraoTelefone);
        if (matchTelefone) {
            dados.telefone = matchTelefone[1].trim().replace(/\D/g, '');
        }
        
        // Extrair CPF/CNPJ
        const padraoCPF = /(?:cpf|cnpj):\s*([0-9.-]{11,18})/i;
        const matchCPF = mensagem.match(padraoCPF);
        if (matchCPF) {
            dados.cpfCnpj = matchCPF[1].trim().replace(/\D/g, '');
        }
        
        // Extrair email
        const padraoEmail = /(?:email|e-mail):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
        const matchEmail = mensagem.match(padraoEmail);
        if (matchEmail) {
            dados.email = matchEmail[1].trim();
        }
        
        console.log('📋 Dados extraídos do cliente:', dados);
        
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
