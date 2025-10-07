/**
 * Middleware de validação de entrada de dados
 */

// Função para sanitizar strings
export function sanitizeString(str) {
  if (typeof str !== "string") return str;

  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
    .replace(/javascript:/gi, "") // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, ""); // Remove event handlers
}

// Middleware para sanitizar dados de entrada
export function sanitizeInput(req, res, next) {
  // Sanitiza body
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  // Sanitiza query parameters
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }

  // Sanitiza params
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }

  next();
}

function sanitizeObject(obj) {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" && item !== null
          ? sanitizeObject(item)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Validadores específicos
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  cpfCnpj: (doc) => {
    if (!doc) return true; // Campo opcional
    const cleaned = doc.replace(/\D/g, "");
    return cleaned.length === 11 || cleaned.length === 14;
  },

  telefone: (phone) => {
    if (!phone) return true; // Campo opcional
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

  placa: (placa) => {
    if (!placa) return false;
    const placaLimpa = placa.replace(/[-\s]/g, "").toUpperCase();
    console.log("Validando placa:", placa, "Placa limpa:", placaLimpa); // Debug log

    // Formato brasileiro: ABC1234 ou ABC-1234 ou ABC1D23 (Mercosul)
    const placaRegex = /^[A-Z]{3}[\d]{4}$|^[A-Z]{3}[\d][A-Z][\d]{2}$/;
    const isValid = placaRegex.test(placaLimpa);
    console.log("Placa válida:", isValid); // Debug log
    return isValid;
  },

  uuid: (id) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  },
};

// Middleware de validação para criação de cliente
export function validateClienteData(req, res, next) {
  const { nomeCompleto, cpfCnpj, telefone, email } = req.body;
  const errors = [];

  if (!nomeCompleto || nomeCompleto.trim().length < 2) {
    errors.push(
      "Nome completo é obrigatório e deve ter pelo menos 2 caracteres"
    );
  }

  if (!telefone || !validators.telefone(telefone)) {
    errors.push("Telefone é obrigatório e deve ter formato válido");
  }

  if (cpfCnpj && !validators.cpfCnpj(cpfCnpj)) {
    errors.push("CPF/CNPJ deve ter formato válido");
  }

  if (email && !validators.email(email)) {
    errors.push("Email deve ter formato válido");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Dados inválidos",
      details: errors,
    });
  }

  next();
}

// Middleware de validação para criação de veículo
export function validateVeiculoData(req, res, next) {
  const { placa, marca, modelo, anoFabricacao } = req.body;
  const errors = [];

  console.log("Validando dados do veículo:", {
    placa,
    marca,
    modelo,
    anoFabricacao,
  }); // Debug log

  if (!placa || !validators.placa(placa)) {
    console.log("Erro na validação da placa:", placa); // Debug log
    errors.push(
      "Placa é obrigatória e deve ter formato válido (ABC-1234 ou ABC1D23)"
    );
  }

  if (!marca || marca.trim().length < 2) {
    console.log("Erro na validação da marca:", marca); // Debug log
    errors.push("Marca é obrigatória e deve ter pelo menos 2 caracteres");
  }

  if (!modelo || modelo.trim().length < 2) {
    console.log("Erro na validação do modelo:", modelo); // Debug log
    errors.push("Modelo é obrigatório e deve ter pelo menos 2 caracteres");
  }

  if (
    anoFabricacao &&
    (anoFabricacao < 1900 || anoFabricacao > new Date().getFullYear() + 1)
  ) {
    console.log("Erro na validação do ano:", anoFabricacao); // Debug log
    errors.push("Ano de fabricação deve estar entre 1900 e o próximo ano");
  }

  if (errors.length > 0) {
    console.log("Erros de validação encontrados:", errors); // Debug log
    return res.status(400).json({
      error: "Dados inválidos",
      details: errors,
    });
  }

  console.log("Validação passou com sucesso"); // Debug log
  next();
}

// Middleware de validação para IDs UUID
export function validateUUID(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !validators.uuid(id)) {
      return res.status(400).json({
        error: `${paramName} deve ser um UUID válido`,
      });
    }

    next();
  };
}
