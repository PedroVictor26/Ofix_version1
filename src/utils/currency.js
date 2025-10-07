// Utilitário para lidar com valores Decimal do Prisma
export const formatDecimal = (value) => {
    if (!value) return '0.00';
    
    // Se é um objeto Decimal do Prisma
    if (typeof value === 'object' && value.toNumber) {
        return value.toNumber().toFixed(2);
    }
    
    // Se é string
    if (typeof value === 'string') {
        return Number(value).toFixed(2);
    }
    
    // Se é number
    if (typeof value === 'number') {
        return value.toFixed(2);
    }
    
    return '0.00';
};

export const formatCurrency = (value) => {
    return `R$ ${formatDecimal(value)}`;
};
