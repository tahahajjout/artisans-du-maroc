import { useState } from 'react';

const RATES = {
    MAD: 1,
    EUR: 0.092,
    USD: 0.099,
    GBP: 0.079
};

const SYMBOLS = {
    MAD: 'DH',
    EUR: '€',
    USD: '$',
    GBP: '£'
};

export function useCurrency() {
    const [currency, setCurrency] = useState('MAD');

    const convert = (priceInMAD) => {
        const converted = Number(priceInMAD) * RATES[currency];
        return `${converted.toFixed(2)} ${SYMBOLS[currency]}`;
    };

    return { currency, setCurrency, convert };
}