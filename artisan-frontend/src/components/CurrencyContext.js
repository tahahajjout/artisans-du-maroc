import React, { createContext, useContext, useState } from 'react';

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

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState('MAD');

    const convert = (priceInMAD) => {
        const converted = Number(priceInMAD) * RATES[currency];
        return `${converted.toFixed(2)} ${SYMBOLS[currency]}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convert }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}