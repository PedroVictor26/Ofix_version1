import { createClient } from 'redis';
import crypto from 'crypto';

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionPromise = this.init();
    }

    async init() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        console.log('🔌 [CACHE] Inicializando serviço de cache...');
        console.log(`🔌 [CACHE] URL: ${redisUrl.substring(0, 30)}...`);

        this.client = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        console.warn('⚠️ [CACHE] Máximo de tentativas de reconexão atingido. Cache desativado.');
                        return new Error('Redis connection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        this.client.on('error', (err) => {
            console.error('❌ [CACHE] Erro na conexão Redis:', err.message);
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            console.log('✅ [CACHE] Conectado ao Redis com sucesso!');
            this.isConnected = true;
        });

        this.client.on('ready', () => {
            console.log('🚀 [CACHE] Redis pronto para uso!');
        });

        try {
            await this.client.connect();
            this.isConnected = true;
            console.log('✅ [CACHE] Conexão estabelecida e verificada.');
            return true;
        } catch (error) {
            console.warn('⚠️ [CACHE] Falha ao conectar na inicialização. Cache funcionará em modo offline (bypass).');
            console.error('⚠️ [CACHE] Detalhes:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Aguarda a conexão estar pronta
     */
    async waitForConnection() {
        await this.connectionPromise;
    }

    /**
     * Gera um hash SHA-256 para a query
     */
    hash(query) {
        return crypto.createHash('sha256').update(query).digest('hex');
    }

    /**
     * Recupera um valor do cache
     */
    async get(key) {
        await this.waitForConnection();

        if (!this.isConnected || !this.client) {
            console.log('⚠️ [CACHE] Cliente não conectado, retornando null');
            return null;
        }

        try {
            const value = await this.client.get(key);
            if (value) {
                console.log(`✅[CACHE] HIT para chave: ${key.substring(0, 30)}...`);
            }
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`❌[CACHE] Erro ao buscar chave ${key}: `, error.message);
            return null;
        }
    }

    /**
     * Salva um valor no cache com TTL
     * @param {string} key Chave
     * @param {any} value Valor (será stringify)
     * @param {number} ttlSeconds Tempo de vida em segundos (default: 24h)
     */
    async set(key, value, ttlSeconds = 86400) {
        await this.waitForConnection();

        if (!this.isConnected || !this.client) {
            console.log('⚠️ [CACHE] Cliente não conectado, não salvando');
            return false;
        }

        try {
            await this.client.set(key, JSON.stringify(value), {
                EX: ttlSeconds
            });
            console.log(`💾[CACHE] Salvo com sucesso: ${key.substring(0, 30)}... (TTL: ${ttlSeconds}s)`);
            return true;
        } catch (error) {
            console.error(`❌[CACHE] Erro ao salvar chave ${key}: `, error.message);
            return false;
        }
    }

    /**
     * Remove uma chave do cache
     * @param {string} key Chave para remover
     */
    async delete(key) {
        await this.waitForConnection();

        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            await this.client.del(key);
            console.log(`🗑️[CACHE] Removido com sucesso: ${key.substring(0, 30)}...`);
            return true;
        } catch (error) {
            console.error(`❌[CACHE] Erro ao remover chave ${key}: `, error.message);
            return false;
        }
    }

    /**
     * Verifica se o serviço está saudável
     */
    isHealthy() {
        return this.isConnected;
    }
}

// Singleton instance
const cacheService = new CacheService();
export default cacheService;
