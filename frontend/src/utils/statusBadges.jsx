import React from 'react';

export const getPaymentStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
        case 'paid':
            return <span className="badge badge-success px-2 py-1 text-xs">Paid</span>;
        case 'claimed':
            return <span className="badge badge-info px-2 py-1 text-xs">Claimed</span>;
        case 'voided':
            return <span className="badge badge-neutral px-2 py-1 text-xs">Voided</span>;
        case 'unpaid':
        default:
            return <span className="badge badge-danger px-2 py-1 text-xs animate-pulse">Unpaid</span>;
    }
};
