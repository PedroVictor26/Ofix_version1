import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Dados de exemplo para popular a base de conhecimento do assistente virtual
 */
const knowledgeBaseData = [
  // Problemas de Motor
  {
    title: "Motor falhando - Análise geral",
    content: "Motor falhando pode indicar diversos problemas. Principais causas: sistema de ignição defeituoso, problemas no sistema de combustível, filtros entupidos, velas de ignição gastas, bobinas de ignição com defeito. Diagnóstico deve começar pela leitura de códigos de erro via scanner. Verificar pressão de combustível, funcionamento das velas e bobinas. Teste de compressão pode ser necessário.",
    category: "diagnostic",
    tags: ["motor", "falha", "ignição", "combustível"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat", "Toyota", "Honda"],
    vehicleModels: ["Fiesta", "Gol", "Onix", "Uno", "Corolla", "Civic"],
    symptoms: ["motor falhando", "perda de potência", "motor irregular", "aceleração ruim"],
    solutions: [
      "Verificar velas de ignição",
      "Testar bobinas de ignição", 
      "Limpar bicos injetores",
      "Trocar filtro de combustível",
      "Verificar pressão de combustível"
    ],
    difficulty: "medium",
    estimatedTime: 60,
    estimatedCost: 200.00
  },
  
  {
    title: "Fumaça azul no escapamento",
    content: "Fumaça azul indica queima de óleo no motor. Principais causas: anéis de pistão desgastados, válvulas ou guias de válvulas gastas, turbo defeituoso (se equipado). Verificar nível de óleo constantemente. Pode ser necessário retífica do motor em casos severos. Teste de compressão e vazamento interno são essenciais para diagnóstico preciso.",
    category: "diagnostic", 
    tags: ["motor", "óleo", "fumaça", "pistão", "válvulas"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat"],
    vehicleModels: [],
    symptoms: ["fumaça azul", "consumo de óleo", "óleo queimando"],
    solutions: [
      "Teste de compressão",
      "Verificar guias de válvulas",
      "Avaliar necessidade de retífica",
      "Trocar anéis de pistão",
      "Verificar turbo (se equipado)"
    ],
    difficulty: "hard",
    estimatedTime: 180,
    estimatedCost: 2500.00
  },

  {
    title: "Superaquecimento do motor",
    content: "Superaquecimento pode causar danos severos ao motor. Principais causas: vazamento no sistema de arrefecimento, termostato defeituoso, radiador entupido, bomba d'água com problemas, ventilador não funcionando, junta do cabeçote queimada. Nunca abrir radiador quente. Verificar nível de água, estado das mangueiras e funcionamento do ventilador.",
    category: "diagnostic",
    tags: ["motor", "superaquecimento", "radiador", "termostato"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat", "Toyota", "Honda", "Nissan"],
    vehicleModels: [],
    symptoms: ["motor quente", "temperatura alta", "vapor", "fervendo"],
    solutions: [
      "Verificar nível de água",
      "Testar termostato",
      "Limpar radiador", 
      "Verificar bomba d'água",
      "Testar ventilador",
      "Verificar junta do cabeçote"
    ],
    difficulty: "medium",
    estimatedTime: 90,
    estimatedCost: 300.00
  },

  // Problemas de Freios
  {
    title: "Ruído nos freios - Diagnóstico",
    content: "Ruídos nos freios podem indicar desgaste das pastilhas, discos empenados, falta de lubrificação ou contaminação. Ruído agudo (guincho) geralmente indica pastilhas gastas. Vibração pode indicar discos empenados. Sempre verificar espessura das pastilhas e estado dos discos. Sistema de freios é item de segurança crítica.",
    category: "diagnostic",
    tags: ["freios", "pastilhas", "discos", "segurança"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat", "Toyota", "Honda"],
    vehicleModels: [],
    symptoms: ["ruído nos freios", "guincho", "freio duro", "vibração no freio"],
    solutions: [
      "Verificar pastilhas de freio",
      "Medir espessura dos discos", 
      "Lubrificar guias de pinça",
      "Verificar fluido de freio",
      "Retificar ou trocar discos"
    ],
    difficulty: "easy",
    estimatedTime: 45,
    estimatedCost: 180.00
  },

  // Problemas Elétricos
  {
    title: "Bateria descarregando rapidamente",
    content: "Descarga rápida da bateria pode indicar alternador defeituoso, fuga de corrente ou bateria no fim da vida útil. Verificar tensão de carga (13.8V a 14.4V com motor ligado). Teste de fuga de corrente com amperímetro. Verificar estado dos terminais e cabos. Bateria com mais de 3 anos pode precisar substituição.",
    category: "diagnostic",
    tags: ["bateria", "alternador", "elétrico", "carga"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat", "Toyota", "Honda"],
    vehicleModels: [],
    symptoms: ["bateria fraca", "não liga", "luzes fracas", "alternador"],
    solutions: [
      "Testar tensão do alternador",
      "Verificar correia do alternador",
      "Teste de fuga de corrente",
      "Limpar terminais da bateria",
      "Substituir bateria se necessário"
    ],
    difficulty: "easy",
    estimatedTime: 30,
    estimatedCost: 400.00
  },

  // Manutenção Preventiva
  {
    title: "Troca de óleo - Procedimento completo",
    content: "Troca de óleo é manutenção essencial. Intervalo varia conforme fabricante (5.000 a 10.000 km). Sempre trocar filtro junto com óleo. Verificar especificação do óleo (viscosidade). Aquecer motor antes da troca. Verificar nível após troca e funcionamento. Descartar óleo usado em local apropriado.",
    category: "maintenance",
    tags: ["óleo", "filtro", "manutenção", "preventiva"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat", "Toyota", "Honda"],
    vehicleModels: [],
    symptoms: ["manutenção", "troca de óleo", "revisão"],
    solutions: [
      "Drenar óleo usado",
      "Trocar filtro de óleo",
      "Adicionar óleo novo",
      "Verificar nível",
      "Testar funcionamento"
    ],
    difficulty: "easy",
    estimatedTime: 20,
    estimatedCost: 80.00
  },

  {
    title: "Revisão dos 10.000 km",
    content: "Revisão importante para manter garantia e desempenho. Inclui: troca de óleo e filtros, verificação de níveis, inspeção de correias, teste de bateria, verificação de freios, alinhamento e balanceamento se necessário. Consultar manual do proprietário para itens específicos do modelo.",
    category: "maintenance",
    tags: ["revisão", "manutenção", "10000km", "preventiva"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat", "Toyota", "Honda"],
    vehicleModels: [],
    symptoms: ["revisão", "manutenção preventiva", "10000"],
    solutions: [
      "Troca de óleo e filtros",
      "Verificar níveis",
      "Inspeção visual geral",
      "Teste de sistemas",
      "Atualizar registro de manutenção"
    ],
    difficulty: "medium",
    estimatedTime: 120,
    estimatedCost: 350.00
  },

  // Ar Condicionado
  {
    title: "Ar condicionado não gela",
    content: "Ar condicionado sem eficiência pode indicar gás insuficiente, compressor defeituoso, filtro sujo ou condensador entupido. Verificar pressão do sistema, funcionamento do compressor e estado do filtro de cabine. Limpeza do condensador pode melhorar eficiência. Vazamentos devem ser localizados e reparados.",
    category: "diagnostic",
    tags: ["ar condicionado", "refrigeração", "compressor", "gás"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat", "Toyota", "Honda"],
    vehicleModels: [],
    symptoms: ["ar condicionado fraco", "não gela", "compressor não funciona"],
    solutions: [
      "Verificar pressão do gás",
      "Testar compressor",
      "Trocar filtro de cabine",
      "Limpar condensador",
      "Localizar vazamentos"
    ],
    difficulty: "medium",
    estimatedTime: 90,
    estimatedCost: 250.00
  },

  // Suspensão
  {
    title: "Barulho na suspensão",
    content: "Ruídos na suspensão podem indicar amortecedores gastos, buchas desgastadas, molas quebradas ou terminais de direção com folga. Barulho de 'toc toc' geralmente indica buchas. Teste dirigindo em lombadas e curvas. Inspeção visual e teste manual necessários para diagnóstico preciso.",
    category: "diagnostic",
    tags: ["suspensão", "amortecedor", "buchas", "molas"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat"],
    vehicleModels: [],
    symptoms: ["barulho suspensão", "toc toc", "carro balançando"],
    solutions: [
      "Verificar amortecedores",
      "Inspecionar buchas",
      "Verificar molas",
      "Testar terminais de direção",
      "Lubrificar se necessário"
    ],
    difficulty: "medium",
    estimatedTime: 60,
    estimatedCost: 200.00
  },

  // Transmissão
  {
    title: "Embreagem patinando",
    content: "Embreagem patinando indica disco desgastado, platô com problemas ou sistema hidráulico com defeito. Sintomas: RPM sobe mas velocidade não acompanha, dificuldade em subir ladeiras, cheiro de queimado. Verificar nível do fluido da embreagem. Pode necessitar troca completa do kit.",
    category: "diagnostic",
    tags: ["embreagem", "transmissão", "disco", "platô"],
    vehicleBrands: ["Ford", "Volkswagen", "Chevrolet", "Fiat"],
    vehicleModels: [],
    symptoms: ["embreagem patinando", "RPM alto", "cheiro queimado"],
    solutions: [
      "Verificar fluido da embreagem",
      "Testar curso do pedal",
      "Avaliar kit de embreagem",
      "Verificar volante",
      "Substituir se necessário"
    ],
    difficulty: "hard",
    estimatedTime: 240,
    estimatedCost: 800.00
  }
];

/**
 * Função para popular a base de conhecimento
 */
export async function seedKnowledgeBase() {
  try {
    console.log('🌱 Iniciando população da base de conhecimento...');

    // Limpar dados existentes (opcional)
    await prisma.knowledgeBase.deleteMany();
    console.log('🗑️ Dados antigos removidos');

    // Inserir novos dados
    for (const item of knowledgeBaseData) {
      await prisma.knowledgeBase.create({
        data: {
          ...item,
          popularity: Math.floor(Math.random() * 50), // Popularidade aleatória inicial
          lastUsed: new Date()
        }
      });
    }

    console.log(`✅ ${knowledgeBaseData.length} itens adicionados à base de conhecimento`);

    // Verificar dados inseridos
    const count = await prisma.knowledgeBase.count();
    console.log(`📊 Total de itens na base: ${count}`);

    return { success: true, count };

  } catch (error) {
    console.error('❌ Erro ao popular base de conhecimento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Função para adicionar templates de prompt
 */
export async function seedPromptTemplates() {
  const templates = [
    {
      name: 'cliente_base',
      description: 'Template base para atendimento ao cliente',
      template: `Você é um assistente virtual especializado em atendimento ao cliente de oficinas mecânicas.

CARACTERÍSTICAS:
- Seja cordial, prestativo e profissional
- Use linguagem clara e acessível
- Forneça informações precisas sobre serviços
- Sempre ofereça próximos passos claros
- Mantenha foco em resolver problemas do cliente

CONTEXTO DA CONVERSA:
{{conversationHistory}}

INFORMAÇÕES DO VEÍCULO:
{{vehicleInfo}}

INSTRUÇÕES:
- Responda sempre em português brasileiro
- Se não souber algo, seja honesto e ofereça alternativas
- Para consultas de status, peça placa ou número da OS
- Para agendamentos, colete informações necessárias`,
      variables: ['conversationHistory', 'vehicleInfo'],
      category: 'customer',
      isActive: true
    },

    {
      name: 'mecanico_diagnostic',
      description: 'Template para diagnósticos técnicos',
      template: `Você é um assistente técnico especializado para mecânicos automotivos.

CARACTERÍSTICAS:
- Use terminologia técnica apropriada
- Forneça diagnósticos baseados em sintomas
- Sugira procedimentos específicos
- Inclua informações de segurança
- Seja preciso e detalhado

BASE DE CONHECIMENTO:
{{knowledgeResults}}

SINTOMAS RELATADOS:
{{symptoms}}

INFORMAÇÕES DO VEÍCULO:
{{vehicleInfo}}

INSTRUÇÕES:
- Priorize segurança em todos os procedimentos
- Forneça estimativas realistas de tempo e custo
- Sugira ferramentas necessárias
- Inclua códigos de peça quando relevante`,
      variables: ['knowledgeResults', 'symptoms', 'vehicleInfo'],
      category: 'diagnostic',
      isActive: true
    },

    {
      name: 'admin_analytics',
      description: 'Template para relatórios administrativos',
      template: `Você é um assistente administrativo para gestores de oficinas.

CARACTERÍSTICAS:
- Forneça informações analíticas
- Use dados e métricas
- Seja objetivo e direto
- Foque em eficiência operacional

DADOS DISPONÍVEIS:
{{analyticsData}}

INSTRUÇÕES:
- Apresente dados de forma clara
- Identifique tendências importantes
- Sugira ações baseadas nos dados
- Use gráficos conceituais quando apropriado`,
      variables: ['analyticsData'],
      category: 'admin',
      isActive: true
    }
  ];

  try {
    console.log('🌱 Criando templates de prompt...');

    for (const template of templates) {
      await prisma.promptTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template
      });
    }

    console.log(`✅ ${templates.length} templates criados`);
    return { success: true, count: templates.length };

  } catch (error) {
    console.error('❌ Erro ao criar templates:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  Promise.all([
    seedKnowledgeBase(),
    seedPromptTemplates()
  ]).then(() => {
    console.log('🎉 Seed completo!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Erro no seed:', error);
    process.exit(1);
  });
}

export default { seedKnowledgeBase, seedPromptTemplates };
