// src/utils/dateUtils.js - Utilitários para cálculo de prazos

/**
 * Calcula o status do prazo baseado nas datas
 * @param {string} dataEntrada - Data de entrada do serviço
 * @param {string} dataPrevisaoEntrega - Data prevista para entrega
 * @returns {'ok' | 'alerta' | 'atrasado'} Status do prazo
 */
export function calcularStatusPrazo(dataEntrada, dataPrevisaoEntrega) {
    if (!dataPrevisaoEntrega) return 'ok';
    
    const hoje = new Date();
    const previsao = new Date(dataPrevisaoEntrega);
    
    // Remove horário para comparar apenas datas
    hoje.setHours(0, 0, 0, 0);
    previsao.setHours(0, 0, 0, 0);
    
    const diffDias = Math.ceil((previsao - hoje) / (1000 * 60 * 60 * 24));
    
    if (diffDias < 0) return 'atrasado';     // Atrasado
    if (diffDias === 0) return 'alerta';     // Vence hoje
    return 'ok';                             // Dentro do prazo
}

/**
 * Retorna as classes CSS para o indicador de prazo
 * @param {'ok' | 'alerta' | 'atrasado'} statusPrazo 
 * @returns {object} Classes CSS para background e texto
 */
export function getClassesPrazo(statusPrazo) {
    const classes = {
        ok: {
            bg: 'bg-green-100',
            text: 'text-green-800',
            border: 'border-green-200',
            indicator: 'bg-green-500'
        },
        alerta: {
            bg: 'bg-yellow-100', 
            text: 'text-yellow-800',
            border: 'border-yellow-200',
            indicator: 'bg-yellow-500'
        },
        atrasado: {
            bg: 'bg-red-100',
            text: 'text-red-800', 
            border: 'border-red-200',
            indicator: 'bg-red-500'
        }
    };
    
    return classes[statusPrazo] || classes.ok;
}
