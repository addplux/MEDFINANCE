export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZM', {
        style: 'currency',
        currency: 'ZMW',
    }).format(amount || 0).replace('ZMW', 'K');
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

export const formatPercent = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);
};
