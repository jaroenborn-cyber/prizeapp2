import { useState, useEffect } from 'react';

const CurrencyConverter = ({ cryptoData, fiatRates }) => {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('USD');
  const [result, setResult] = useState(null);

  const currencies = [
    ...cryptoData.map(crypto => ({
      id: crypto.id,
      symbol: crypto.symbol.toUpperCase(),
      name: crypto.name,
      price: crypto.current_price,
      type: 'crypto'
    })),
    { symbol: 'USD', name: 'US Dollar', type: 'fiat' },
    { symbol: 'EUR', name: 'Euro', type: 'fiat' },
    { symbol: 'GBP', name: 'British Pound', type: 'fiat' },
    { symbol: 'JPY', name: 'Japanese Yen', type: 'fiat' }
  ];

  useEffect(() => {
    if (!amount || isNaN(amount)) {
      setResult(null);
      return;
    }

    const convert = () => {
      const fromCurr = currencies.find(c => c.symbol === fromCurrency);
      const toCurr = currencies.find(c => c.symbol === toCurrency);

      if (!fromCurr || !toCurr) return;

      let convertedAmount = 0;

      // Crypto to Crypto
      if (fromCurr.type === 'crypto' && toCurr.type === 'crypto') {
        convertedAmount = (parseFloat(amount) * fromCurr.price) / toCurr.price;
      }
      // Crypto to Fiat
      else if (fromCurr.type === 'crypto' && toCurr.type === 'fiat') {
        const cryptoInUSD = parseFloat(amount) * fromCurr.price;
        if (toCurrency === 'USD') {
          convertedAmount = cryptoInUSD;
        } else {
          convertedAmount = cryptoInUSD * (fiatRates[toCurrency] || 1);
        }
      }
      // Fiat to Crypto
      else if (fromCurr.type === 'fiat' && toCurr.type === 'crypto') {
        let amountInUSD = parseFloat(amount);
        if (fromCurrency !== 'USD') {
          amountInUSD = amountInUSD / (fiatRates[fromCurrency] || 1);
        }
        convertedAmount = amountInUSD / toCurr.price;
      }
      // Fiat to Fiat
      else {
        if (fromCurrency === 'USD') {
          convertedAmount = parseFloat(amount) * (fiatRates[toCurrency] || 1);
        } else if (toCurrency === 'USD') {
          convertedAmount = parseFloat(amount) / (fiatRates[fromCurrency] || 1);
        } else {
          const inUSD = parseFloat(amount) / (fiatRates[fromCurrency] || 1);
          convertedAmount = inUSD * (fiatRates[toCurrency] || 1);
        }
      }

      setResult(convertedAmount);
    };

    convert();
  }, [amount, fromCurrency, toCurrency, cryptoData, fiatRates]);

  return (
    <div className="bg-dark-card dark:bg-dark-card light:bg-white black-white:bg-white white-black:bg-black rounded-xl p-6 shadow-lg border border-slate-700 dark:border-slate-700 light:border-slate-300 black-white:border-black white-black:border-white">
      <h2 className="text-2xl font-bold mb-6 text-neon-cyan dark:text-neon-cyan light:text-neon-purple black-white:text-black white-black:text-white">Valuta Converter</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Bedrag</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-800 dark:bg-slate-800 light:bg-white black-white:bg-white white-black:bg-black border border-slate-600 dark:border-slate-600 light:border-slate-300 black-white:border-black white-black:border-white rounded-lg px-4 py-3 text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan dark:focus:ring-neon-cyan light:focus:ring-neon-purple black-white:focus:ring-black white-black:focus:ring-white"
            placeholder="Voer bedrag in"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Van</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full bg-slate-800 dark:bg-slate-800 light:bg-white black-white:bg-white white-black:bg-black border border-slate-600 dark:border-slate-600 light:border-slate-300 black-white:border-black white-black:border-white rounded-lg px-4 py-3 text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan dark:focus:ring-neon-cyan light:focus:ring-neon-purple black-white:focus:ring-black white-black:focus:ring-white"
          >
            {currencies.map((curr) => (
              <option key={curr.symbol} value={curr.symbol}>
                {curr.symbol} - {curr.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Naar</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full bg-slate-800 dark:bg-slate-800 light:bg-white black-white:bg-white white-black:bg-black border border-slate-600 dark:border-slate-600 light:border-slate-300 black-white:border-black white-black:border-white rounded-lg px-4 py-3 text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan dark:focus:ring-neon-cyan light:focus:ring-neon-purple black-white:focus:ring-black white-black:focus:ring-white"
          >
            {currencies.map((curr) => (
              <option key={curr.symbol} value={curr.symbol}>
                {curr.symbol} - {curr.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {result !== null && (
        <div className="bg-gradient-to-r from-neon-cyan/10 dark:from-neon-cyan/10 light:from-neon-purple/10 black-white:from-gray-100 white-black:from-gray-800 to-neon-purple/10 dark:to-neon-purple/10 light:to-neon-cyan/10 black-white:to-gray-200 white-black:to-gray-900 border border-neon-cyan/30 dark:border-neon-cyan/30 light:border-neon-purple/30 black-white:border-black white-black:border-white rounded-lg p-6 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-500 black-white:text-gray-600 white-black:text-gray-400 mb-2">Omgerekend Bedrag</p>
          <p className="text-3xl font-bold text-neon-cyan dark:text-neon-cyan light:text-neon-purple black-white:text-black white-black:text-white">
            {result.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 8 
            })} {toCurrency}
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrencyConverter;
