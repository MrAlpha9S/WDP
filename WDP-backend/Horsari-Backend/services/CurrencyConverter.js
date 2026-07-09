// Static currency-conversion table — no external API, no network call. The
// payment-verification wallets are a statistic (not real money processing),
// so a deterministic offline rate is preferred over a live exchange-rate
// dependency inside AdminService.confirmRaceResult.
const RATES_TO_VND = {
    VND: 1,
    USD: 25000,
    // extend here as needed — any currencyType not listed falls back to
    // identity conversion (treated as already VND), logged as a warning.
};

function convertToVnd(amount, fromCurrency) {
    const code = (fromCurrency || 'VND').toUpperCase();
    const rate = RATES_TO_VND[code];
    if (rate == null) {
        console.warn(`[CurrencyConverter] Unknown currency "${code}" — treating amount as already VND.`);
        return amount;
    }
    return Math.round(amount * rate);
}

module.exports = { convertToVnd, RATES_TO_VND };
