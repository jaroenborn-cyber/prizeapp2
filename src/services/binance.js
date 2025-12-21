// Binance WebSocket service for live price updates

// Map CoinGecko IDs to Binance trading pairs
const COINGECKO_TO_BINANCE = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'binancecoin': 'BNBUSDT',
  'ripple': 'XRPUSDT',
  'cardano': 'ADAUSDT',
  'solana': 'SOLUSDT',
  'polkadot': 'DOTUSDT',
  'dogecoin': 'DOGEUSDT',
  'avalanche-2': 'AVAXUSDT',
  'polygon': 'MATICUSDT',
  'chainlink': 'LINKUSDT',
  'litecoin': 'LTCUSDT',
  'uniswap': 'UNIUSDT',
  'stellar': 'XLMUSDT',
  'monero': 'XMRUSDT',
  'ethereum-classic': 'ETCUSDT',
  'filecoin': 'FILUSDT',
  'cosmos': 'ATOMUSDT',
  'tron': 'TRXUSDT',
  'vechain': 'VETUSDT',
  'theta-token': 'THETAUSDT',
  'algorand': 'ALGOUSDT',
  'eos': 'EOSUSDT',
  'aave': 'AAVEUSDT',
  'shiba-inu': 'SHIBUSDT',
  'near': 'NEARUSDT',
  'sandbox': 'SANDUSDT',
  'decentraland': 'MANAUSDT',
  'axie-infinity': 'AXSUSDT',
  'pancakeswap-token': 'CAKEUSDT',
  'ftx-token': 'FTTUSDT',
  'hedera-hashgraph': 'HBARUSDT',
  'elrond-erd-2': 'EGLDUSDT',
  'tezos': 'XTZUSDT',
  'the-graph': 'GRTUSDT',
  'fantom': 'FTMUSDT',
  'curve-dao-token': 'CRVUSDT',
  'maker': 'MKRUSDT',
  'compound-ether': 'CETHUSDT',
  'neo': 'NEOUSDT',
  'kusama': 'KSMUSDT',
  'dash': 'DASHUSDT',
  'zcash': 'ZECUSDT',
  'compound-governance-token': 'COMPUSDT',
  'wrapped-bitcoin': 'WBTCUSDT',
  'bitcoin-cash': 'BCHUSDT',
  'chiliz': 'CHZUSDT',
  'enjincoin': 'ENJUSDT',
  'matic-network': 'MATICUSDT',
  'harmony': 'ONEUSDT',
  'sushi': 'SUSHIUSDT',
  'celo': 'CELOUSDT',
  'terra-luna': 'LUNAUSDT',
  'bitcoin-cash-sv': 'BSVUSDT',
  'iota': 'IOTAUSDT',
  'yearn-finance': 'YFIUSDT',
  '1inch': '1INCHUSDT',
  'ravencoin': 'RVNUSDT',
  'qtum': 'QTUMUSDT',
  'basic-attention-token': 'BATUSDT',
  'zilliqa': 'ZILUSDT',
  'omisego': 'OMGUSDT',
  'ocean-protocol': 'OCEANUSDT',
  'energy-web-token': 'EWTUSDT',
  'nano': 'NANOUSDT',
  'waves': 'WAVESUSDT',
  'icon': 'ICXUSDT',
  'ontology': 'ONTUSDT',
  'ren': 'RENUSDT',
  'kava': 'KAVAUSDT',
  'nervos-network': 'CKBUSDT',
  'arweave': 'ARUSDT',
  'injective-protocol': 'INJUSDT',
  'flow': 'FLOWUSDT',
  'apecoin': 'APEUSDT',
  'gala': 'GALAUSDT',
  'immutable-x': 'IMXUSDT',
  'optimism': 'OPUSDT',
  'arbitrum': 'ARBUSDT',
  'sui': 'SUIUSDT',
  'pepe': 'PEPEUSDT',
  'stacks': 'STXUSDT',
  'render-token': 'RNDERUSDT',
  'sei-network': 'SEIUSDT',
};

class BinanceWebSocketService {
  constructor() {
    this.ws = null;
    this.priceCallbacks = new Map();
    this.subscribedPairs = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  // Check if a coin is available on Binance
  isBinanceListed(coinId) {
    return COINGECKO_TO_BINANCE.hasOwnProperty(coinId);
  }

  // Get Binance symbol from CoinGecko ID
  getBinanceSymbol(coinId) {
    return COINGECKO_TO_BINANCE[coinId];
  }

  // Connect to Binance WebSocket
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Use !miniTicker@arr stream for all symbols at once
      const wsUrl = `wss://stream.binance.com:9443/ws/!miniTicker@arr`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Binance WebSocket connected (All Market Mini Tickers)');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const tickers = JSON.parse(event.data);
          
          // Process each ticker
          if (Array.isArray(tickers)) {
            tickers.forEach(ticker => {
              const symbol = ticker.s; // e.g., BTCUSDT
              
              // Only process if we have callbacks for this symbol
              if (this.priceCallbacks.has(symbol)) {
                const price = parseFloat(ticker.c); // Current price
                const priceChange24h = parseFloat(ticker.P); // 24h price change percentage

                // Call all registered callbacks for this symbol
                const callbacks = this.priceCallbacks.get(symbol) || [];
                callbacks.forEach(callback => {
                  callback({
                    symbol,
                    price,
                    priceChange24h,
                    timestamp: Date.now()
                  });
                });
              }
            });
          }
        } catch (error) {
          console.error('Error parsing Binance message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('Binance WebSocket closed');
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('Error connecting to Binance WebSocket:', error);
    }
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }

  // Subscribe to price updates for a coin
  subscribe(coinId, callback) {
    const symbol = this.getBinanceSymbol(coinId);
    if (!symbol) return false;

    // Add callback
    if (!this.priceCallbacks.has(symbol)) {
      this.priceCallbacks.set(symbol, []);
    }
    this.priceCallbacks.get(symbol).push(callback);

    // Add to subscribed pairs
    const wasEmpty = this.subscribedPairs.size === 0;
    this.subscribedPairs.add(symbol);

    // Connect if not already connected
    if (wasEmpty) {
      this.connect();
    }

    return true;
  }

  // Unsubscribe from price updates
  unsubscribe(coinId, callback) {
    const symbol = this.getBinanceSymbol(coinId);
    if (!symbol) return;

    const callbacks = this.priceCallbacks.get(symbol);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // Remove symbol if no more callbacks
      if (callbacks.length === 0) {
        this.priceCallbacks.delete(symbol);
        this.subscribedPairs.delete(symbol);
      }
    }

    // Disconnect if no more subscribers
    if (this.subscribedPairs.size === 0) {
      this.disconnect();
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Get all Binance-supported coins from a list
  getBinanceSupportedCoins(coins) {
    return coins.filter(coin => this.isBinanceListed(coin.id));
  }
}

// Export singleton instance
export const binanceService = new BinanceWebSocketService();
export default binanceService;
