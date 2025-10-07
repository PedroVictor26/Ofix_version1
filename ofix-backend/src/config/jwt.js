import 'dotenv/config';

// As configurações de JWT (secret, expiration) são primariamente gerenciadas
// através de variáveis de ambiente (process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN)
// e usadas diretamente onde necessário (ex: no auth.controller ou auth.service).

// Este arquivo existe para centralizar qualquer lógica ou configuração relacionada ao JWT
// que possa surgir no futuro, ou simplesmente para garantir que o dotenv seja carregado
// se este módulo for importado antes de outros que dependam das variáveis de ambiente de JWT.

// Exemplo de como você poderia exportar as configurações se quisesse:
// export const jwtSecret = process.env.JWT_SECRET;
// export const jwtExpiresIn = process.env.JWT_EXPIRES_IN;

// Se não houver lógica específica aqui, ele pode não precisar exportar nada.
// O import 'dotenv/config' no topo é a parte mais importante por agora.

export {}; // Para evitar erro de módulo vazio se não houver exports ainda.
