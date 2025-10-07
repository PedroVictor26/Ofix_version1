/**
 * Provedor para modelos customizados/treinados localmente
 * Suporta modelos próprios treinados com dados específicos da oficina
 */

// import * as tf from '@tensorflow/tfjs-node'; // Comentado temporariamente - instalar tensorflow se necessário
import fs from "fs/promises";
import path from "path";

class CustomModelProvider {
  constructor() {
    this.modelsPath = process.env.CUSTOM_MODELS_PATH || "./models";
    this.loadedModels = new Map();
    this.trainingData = new Map();
  }

  async isAvailable() {
    try {
      // Verificar se há modelos customizados disponíveis
      const modelsExist = await fs
        .access(this.modelsPath)
        .then(() => true)
        .catch(() => false);
      return modelsExist;
    } catch (error) {
      return false;
    }
  }

  async loadModel(modelName) {
    if (this.loadedModels.has(modelName)) {
      return this.loadedModels.get(modelName);
    }

    try {
      const modelPath = path.join(this.modelsPath, modelName);
      // const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      throw new Error(
        "TensorFlow não está disponível. Instale @tensorflow/tfjs-node se necessário."
      );

      // Carregar metadados do modelo
      const metadataPath = path.join(modelPath, "metadata.json");
      const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));

      const modelWrapper = {
        model,
        metadata,
        predict: async (input) => {
          const prediction = model.predict(input);
          return prediction;
        },
      };

      this.loadedModels.set(modelName, modelWrapper);
      console.log(`✅ Modelo customizado '${modelName}' carregado`);

      return modelWrapper;
    } catch (error) {
      console.error(
        `❌ Erro ao carregar modelo '${modelName}':`,
        error.message
      );
      throw error;
    }
  }

  async generateText(prompt, options = {}) {
    const modelName = options.model || "ofix-chat-v1";

    try {
      const model = await this.loadModel(modelName);

      // Para modelos de texto, converter prompt para tokens
      const tokenizedInput = await this.tokenizeText(prompt, model.metadata);
      const prediction = await model.predict(tokenizedInput);
      const response = await this.detokenizeText(prediction, model.metadata);

      return {
        text: response,
        model: modelName,
        usage: {
          promptTokens: prompt.length / 4,
          completionTokens: response.length / 4,
          totalTokens: (prompt.length + response.length) / 4,
        },
      };
    } catch (error) {
      console.error("❌ Erro na geração de texto customizada:", error.message);
      throw error;
    }
  }

  async analisarTriagemVeiculo(transcricao, options = {}) {
    try {
      // Usar modelo específico para triagem automotiva
      const model = await this.loadModel("ofix-triagem-v1");

      // Preparar entrada para o modelo de classificação
      const features = await this.extractTriagemFeatures(transcricao);
      // const input = tf.tensor2d([features]);
      throw new Error(
        "TensorFlow não está disponível. Usando análise baseada em palavras-chave."
      );

      const prediction = model.model.predict(input);
      const probabilities = await prediction.data();

      // Mapear predições para categorias
      const categories = model.metadata.categories || [
        "motor",
        "freios",
        "suspensao",
        "eletrica",
        "transmissao",
        "ar_condicionado",
      ];

      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      const confidence = Math.round(probabilities[maxIndex] * 100);

      // Usar regras de negócio para completar a análise
      const analysis = this.buildTriagemAnalysis(
        categories[maxIndex],
        confidence,
        transcricao,
        probabilities
      );

      return analysis;
    } catch (error) {
      console.warn(
        "⚠️ Modelo customizado não disponível, usando regras baseadas em palavras-chave"
      );
      return await this.analyzeWithKeywords(transcricao);
    }
  }

  extractTriagemFeatures(transcricao) {
    const text = transcricao.toLowerCase();

    // Features baseadas em palavras-chave (exemplo simplificado)
    const features = [
      // Motor features
      +(
        text.includes("motor") ||
        text.includes("barulho") ||
        text.includes("vibra")
      ),
      +(
        text.includes("óleo") ||
        text.includes("fumaça") ||
        text.includes("esquenta")
      ),

      // Freios features
      +(
        text.includes("freio") ||
        text.includes("para") ||
        text.includes("pedal")
      ),
      +(text.includes("rangendo") || text.includes("chiando")),

      // Suspensão features
      +(
        text.includes("amortecedor") ||
        text.includes("mola") ||
        text.includes("balança")
      ),
      +(text.includes("buraco") || text.includes("solavanco")),

      // Elétrica features
      +(
        text.includes("luz") ||
        text.includes("bateria") ||
        text.includes("elétric")
      ),
      +(text.includes("não liga") || text.includes("pifa")),

      // Transmissão features
      +(
        text.includes("marcha") ||
        text.includes("câmbio") ||
        text.includes("engata")
      ),
      +(text.includes("embreagem") || text.includes("acelera")),

      // Urgência indicators
      +(
        text.includes("urgente") ||
        text.includes("parou") ||
        text.includes("não anda")
      ),
      +(
        text.includes("vazando") ||
        text.includes("fumaça") ||
        text.includes("cheiro")
      ),
    ];

    return features;
  }

  buildTriagemAnalysis(categoria, confidence, transcricao, probabilities) {
    const urgencyKeywords = [
      "parou",
      "não anda",
      "vazando",
      "fumaça",
      "urgente",
    ];
    const hasUrgency = urgencyKeywords.some((keyword) =>
      transcricao.toLowerCase().includes(keyword)
    );

    const complexityMap = {
      motor: "alta",
      transmissao: "alta",
      freios: "media",
      suspensao: "media",
      eletrica: "media",
      ar_condicionado: "baixa",
    };

    const timeMap = {
      motor: 8,
      transmissao: 6,
      freios: 3,
      suspensao: 4,
      eletrica: 2,
      ar_condicionado: 2,
    };

    return {
      categoria_principal: categoria,
      categoria_secundaria: this.getSubcategory(categoria, transcricao),
      tempo_estimado_horas: timeMap[categoria] || 3,
      complexidade: complexityMap[categoria] || "media",
      urgencia: hasUrgency ? "alta" : "media",
      pecas_provaveis: this.suggestParts(categoria, transcricao),
      proximos_passos: this.getNextSteps(categoria),
      confianca_analise: confidence,
      sintomas_identificados: this.extractSymptoms(transcricao),
      diagnostico_preliminar: `Problema identificado na categoria ${categoria} com ${confidence}% de confiança`,
    };
  }

  getSubcategory(categoria, transcricao) {
    const subcategoryMap = {
      motor:
        ["vela", "óleo", "arrefecimento", "combustível"].find((sub) =>
          transcricao.toLowerCase().includes(sub)
        ) || "geral",
      freios:
        ["pastilha", "disco", "fluido", "servo"].find((sub) =>
          transcricao.toLowerCase().includes(sub)
        ) || "sistema",
      suspensao:
        ["amortecedor", "mola", "batente"].find((sub) =>
          transcricao.toLowerCase().includes(sub)
        ) || "conjunto",
      eletrica:
        ["bateria", "alternador", "motor de partida"].find((sub) =>
          transcricao.toLowerCase().includes(sub)
        ) || "sistema",
      transmissao:
        ["embreagem", "câmbio", "diferencial"].find((sub) =>
          transcricao.toLowerCase().includes(sub)
        ) || "conjunto",
    };

    return subcategoryMap[categoria] || "geral";
  }

  suggestParts(categoria, transcricao) {
    const partsMap = {
      motor: ["Vela de ignição", "Filtro de óleo", "Filtro de ar"],
      freios: ["Pastilha de freio", "Disco de freio", "Fluido de freio"],
      suspensao: ["Amortecedor", "Mola", "Batente"],
      eletrica: ["Bateria", "Alternador", "Fusível"],
      transmissao: ["Óleo de câmbio", "Disco de embreagem"],
    };

    return partsMap[categoria] || ["Diagnóstico necessário"];
  }

  getNextSteps(categoria) {
    const stepsMap = {
      motor:
        "Realizar diagnóstico completo do motor, verificar códigos de erro",
      freios: "Inspeção visual do sistema de freios, teste de frenagem",
      suspensao: "Teste de dirigibilidade e inspeção dos componentes",
      eletrica: "Diagnóstico elétrico com scanner automotivo",
      transmissao: "Teste de estrada e verificação dos fluidos",
    };

    return stepsMap[categoria] || "Diagnóstico geral necessário";
  }

  extractSymptoms(transcricao) {
    const symptoms = [];
    const symptomKeywords = {
      ruído: ["barulho", "rangendo", "chiando", "batendo"],
      vibração: ["vibra", "trepida", "balança"],
      vazamento: ["vazando", "pingando", "gotejando"],
      superaquecimento: ["esquenta", "fervendo", "vapor"],
      dificuldade: ["não liga", "difícil", "engasga"],
    };

    for (const [symptom, keywords] of Object.entries(symptomKeywords)) {
      if (
        keywords.some((keyword) => transcricao.toLowerCase().includes(keyword))
      ) {
        symptoms.push(symptom);
      }
    }

    return symptoms.length > 0 ? symptoms : ["Sintoma não específico"];
  }

  async analyzeWithKeywords(transcricao) {
    // Fallback usando análise baseada em palavras-chave
    const features = this.extractTriagemFeatures(transcricao);
    const motorScore = features[0] + features[1];
    const freiosScore = features[2] + features[3];
    const suspensaoScore = features[4] + features[5];
    const eletricaScore = features[6] + features[7];
    const transmissaoScore = features[8] + features[9];

    const scores = {
      motor: motorScore,
      freios: freiosScore,
      suspensao: suspensaoScore,
      eletrica: eletricaScore,
      transmissao: transmissaoScore,
    };

    const categoria = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    );

    const confidence = Math.min(90, 60 + scores[categoria] * 15);

    return this.buildTriagemAnalysis(categoria, confidence, transcricao, []);
  }

  async tokenizeText(text, metadata) {
    // Implementação simples de tokenização
    // Em produção, usar tokenizer específico do modelo
    const tokens = text
      .toLowerCase()
      .split(" ")
      .map((word) => metadata.vocabulary?.[word] || metadata.unk_token_id || 0);

    // return tf.tensor2d([tokens.slice(0, metadata.max_length || 512)]);
    throw new Error("TensorFlow não está disponível.");
  }

  async detokenizeText(tensor, metadata) {
    // Converter tensor de volta para texto
    const tokenIds = await tensor.data();
    const words = Array.from(tokenIds).map(
      (id) => metadata.reverse_vocabulary?.[id] || "<unk>"
    );

    return words.join(" ").replace(/<[^>]+>/g, "");
  }

  // Método para treinar modelo customizado
  async trainModel(trainingData, modelConfig) {
    console.log("🔄 Iniciando treinamento de modelo customizado...");

    try {
      // Preparar dados de treinamento
      const { inputs, outputs } = this.prepareTrainingData(trainingData);

      // Criar arquitetura do modelo
      const model = this.createModelArchitecture(modelConfig);

      // Treinar modelo
      await model.fit(inputs, outputs, {
        epochs: modelConfig.epochs || 50,
        batchSize: modelConfig.batchSize || 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(
              `Época ${epoch + 1}: loss = ${logs.loss.toFixed(
                4
              )}, accuracy = ${logs.acc.toFixed(4)}`
            );
          },
        },
      });

      // Salvar modelo treinado
      const modelPath = path.join(this.modelsPath, modelConfig.name);
      await fs.mkdir(modelPath, { recursive: true });
      await model.save(`file://${modelPath}`);

      // Salvar metadados
      const metadata = {
        name: modelConfig.name,
        version: "1.0",
        trained_at: new Date().toISOString(),
        categories: modelConfig.categories,
        vocabulary: modelConfig.vocabulary,
      };

      await fs.writeFile(
        path.join(modelPath, "metadata.json"),
        JSON.stringify(metadata, null, 2)
      );

      console.log(
        `✅ Modelo '${modelConfig.name}' treinado e salvo com sucesso`
      );
      return true;
    } catch (error) {
      console.error("❌ Erro no treinamento:", error.message);
      return false;
    }
  }

  prepareTrainingData(trainingData) {
    // Converter dados de texto para tensores
    const inputs = [];
    const outputs = [];

    for (const sample of trainingData) {
      const features = this.extractTriagemFeatures(sample.input);
      const categoryIndex = sample.categories.indexOf(sample.output);

      inputs.push(features);
      outputs.push(categoryIndex);
    }

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.oneHot(outputs, trainingData[0].categories.length),
    };
  }

  createModelArchitecture(config) {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [config.inputSize || 12],
          units: 64,
          activation: "relu",
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: "relu",
        }),
        tf.layers.dense({
          units: config.numCategories || 6,
          activation: "softmax",
        }),
      ],
    });

    model.compile({
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }
}

export default CustomModelProvider;
