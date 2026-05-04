// SoDEX API integration layer - Real market microstructure and execution data
export interface SodexSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  baseAssetPrecision: number;
  quotePrecision: number;
  orderTypes: string[];
  filters: any[];
  permissions: string[];
}

export interface SodexCoin {
  coin: string;
  name: string;
  networkList: any[];
}

export interface SodexTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface SodexMiniTicker {
  symbol: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface SodexBookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

export interface SodexOrderbookEntry {
  price: string;
  quantity: string;
}

export interface SodexOrderbook {
  lastUpdateId: number;
  bids: SodexOrderbookEntry[];
  asks: SodexOrderbookEntry[];
}

export interface SodexKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface SodexTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
}

export interface SodexMarkPrice {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

export interface SodexExecutionPreview {
  symbol: string;
  side: 'BUY' | 'SELL';
  amount: number;
  estimatedPrice: number;
  estimatedSlippage: number;
  estimatedFees: number;
  priceImpact: number;
  executionProbability: number;
  warnings: string[];
  canExecute: boolean;
  mode: 'testnet' | 'preview';
  liquidityAnalysis: {
    totalBidLiquidity: number;
    totalAskLiquidity: number;
    spreadPercent: number;
    marketDepth: number;
  };
}

class SoDEXAPI {
  private testnetSpotUrl: string;
  private testnetPerpsUrl: string;
  private mainnetSpotUrl: string;
  private mainnetPerpsUrl: string;
  private useTestnet: boolean;

  constructor() {
    this.testnetSpotUrl = 'https://testnet-gw.sodex.dev/api/v1/spot';
    this.testnetPerpsUrl = 'https://testnet-gw.sodex.dev/api/v1/perps';
    this.mainnetSpotUrl = 'https://mainnet-gw.sodex.dev/api/v1/spot';
    this.mainnetPerpsUrl = 'https://mainnet-gw.sodex.dev/api/v1/perps';
    this.useTestnet = process.env.NODE_ENV !== 'production'; // Use testnet by default
  }

  private getSpotBaseUrl(): string {
    return this.useTestnet ? this.testnetSpotUrl : this.mainnetSpotUrl;
  }

  private getPerpsBaseUrl(): string {
    return this.useTestnet ? this.testnetPerpsUrl : this.mainnetPerpsUrl;
  }

  // Symbol mapping for SoDEX testnet
  private mapSymbolToSodexFormat(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'BTC': 'vBTC_vUSDC',
      'ETH': 'vETH_vUSDC', 
      'SOL': 'vSOL_vUSDC',
      'ADA': 'vADA_vUSDC',
      'AVAX': 'vAVAX_vUSDC',
      'DOGE': 'vDOGE_vUSDC',
      'XRP': 'vXRP_vUSDC',
      'BNB': 'vBNB_vUSDC',
      'LINK': 'vLINK_vUSDC',
      'UNI': 'vUNI_vUSDC',
      'AAVE': 'vAAVE_vUSDC',
      'LTC': 'vLTC_vUSDC',
      'SHIB': 'vSHIB_vUSDC',
      'ZEC': 'vZEC_vUSDC',
      'USDT': 'vUSDT_vUSDC',
      'SOSO': 'WSOSO_vUSDC',
      'HYPE': 'vHYPE_vUSDC',
      // Stock symbols
      'AAPL': 'vAAPL_vUSDC',
      'TSLA': 'vTSLA_vUSDC',
      'NVDA': 'vNVDA_vUSDC',
      'MSFT': 'vMSFT_vUSDC',
      'GOOGL': 'vGOOGL_vUSDC',
      'AMZN': 'vAMZN_vUSDC',
      'META': 'vMETA_vUSDC',
      // Test tokens
      'TESTBTC': 'TESTBTC_vUSDC',
      'TESTSOSO': 'TESTSOSO_vUSDC',
      'TESTSHIB': 'TESTSHIB_vUSDC'
    };
    
    return symbolMap[symbol.toUpperCase()] || symbol;
  }

  private async makeRequest(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TradeFirewall/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`SoDEX API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || data; // Handle SoDEX response format
    } catch (error) {
      if (error instanceof Error && error.message.includes('SoDEX API request failed')) {
        throw error;
      }
      throw new Error('Unable to fetch SoDEX market data. Please check network connection.');
    }
  }

  // Spot Market Data Functions - Using correct SoDEX endpoints
  async getSpotSymbols(): Promise<SodexSymbol[]> {
    return await this.makeRequest(`${this.getSpotBaseUrl()}/markets/symbols`);
  }

  async getSpotTickers(): Promise<SodexTicker[]> {
    return await this.makeRequest(`${this.getSpotBaseUrl()}/markets/tickers`);
  }

  async getSpotTicker(symbol: string): Promise<SodexTicker> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const tickers = await this.getSpotTickers();
    const ticker = tickers.find(t => t.symbol === sodexSymbol);
    if (!ticker) {
      throw new Error(`Ticker for symbol ${symbol} (${sodexSymbol}) not found on SoDEX`);
    }
    return ticker;
  }

  async getSpotBookTickers(): Promise<SodexBookTicker[]> {
    return await this.makeRequest(`${this.getSpotBaseUrl()}/markets/bookTickers`);
  }

  async getSpotBookTicker(symbol: string): Promise<SodexBookTicker> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const bookTickers = await this.getSpotBookTickers();
    const bookTicker = bookTickers.find(bt => bt.symbol === sodexSymbol);
    if (!bookTicker) {
      throw new Error(`Book ticker for symbol ${symbol} (${sodexSymbol}) not found on SoDEX`);
    }
    return bookTicker;
  }

  async getSpotOrderbook(symbol: string, limit: number = 100): Promise<SodexOrderbook> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    return await this.makeRequest(`${this.getSpotBaseUrl()}/markets/${sodexSymbol}/orderbook?limit=${limit}`);
  }

  async getSpotKlines(symbol: string, interval: string, limit: number = 100): Promise<SodexKline[]> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    return await this.makeRequest(`${this.getSpotBaseUrl()}/markets/${sodexSymbol}/klines?interval=${interval}&limit=${limit}`);
  }

  async getSpotTrades(symbol: string, limit: number = 100): Promise<SodexTrade[]> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    return await this.makeRequest(`${this.getSpotBaseUrl()}/markets/${sodexSymbol}/trades?limit=${limit}`);
  }

  // Execution Analysis Functions
  async validateSymbolExists(symbol: string): Promise<boolean> {
    try {
      const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
      console.log(`Validating symbol: ${symbol} -> ${sodexSymbol}`);
      
      const symbols = await this.getSpotSymbols();
      console.log(`Found ${symbols.length} symbols on SoDEX`);
      
      const exists = symbols.some((s: any) => s.name === sodexSymbol);
      console.log(`Symbol ${sodexSymbol} exists: ${exists}`);
      
      if (!exists) {
        // Log available symbols for debugging
        const availableSymbols = symbols.map((s: any) => s.name).slice(0, 10);
        console.log('Available symbols (first 10):', availableSymbols);
      }
      
      return exists;
    } catch (error) {
      console.error('Error validating symbol:', error);
      return false;
    }
  }

  async estimateSlippageFromOrderbook(symbol: string, side: 'BUY' | 'SELL', amount: number): Promise<number> {
    try {
      const orderbook = await this.getSpotOrderbook(symbol, 100);
      const orders = side === 'BUY' ? orderbook.asks : orderbook.bids;
      
      let totalVolume = 0;
      let weightedPrice = 0;
      let firstPrice = 0;
      
      for (const order of orders) {
        const price = parseFloat(order.price);
        const quantity = parseFloat(order.quantity);
        
        if (firstPrice === 0) firstPrice = price;
        
        if (totalVolume + quantity >= amount) {
          const remainingAmount = amount - totalVolume;
          weightedPrice += price * remainingAmount;
          totalVolume = amount;
          break;
        } else {
          weightedPrice += price * quantity;
          totalVolume += quantity;
        }
      }
      
      if (totalVolume === 0) return 0.05; // 5% if no liquidity
      
      const avgPrice = weightedPrice / totalVolume;
      const slippage = Math.abs(avgPrice - firstPrice) / firstPrice;
      
      return Math.min(slippage, 0.1); // Cap at 10%
    } catch (error) {
      return 0.02; // Default 2% slippage estimate
    }
  }

  async analyzeLiquidity(symbol: string): Promise<any> {
    try {
      const orderbook = await this.getSpotOrderbook(symbol);
      const bookTicker = await this.getSpotBookTicker(symbol);
      
      const bidPrice = parseFloat(bookTicker.bidPrice);
      const askPrice = parseFloat(bookTicker.askPrice);
      const spread = askPrice - bidPrice;
      const spreadPercent = (spread / ((bidPrice + askPrice) / 2)) * 100;
      
      // Calculate total liquidity within 2% of mid price
      const midPrice = (bidPrice + askPrice) / 2;
      const threshold = midPrice * 0.02;
      
      let totalBidLiquidity = 0;
      let totalAskLiquidity = 0;
      
      for (const bid of orderbook.bids) {
        if (midPrice - parseFloat(bid.price) <= threshold) {
          totalBidLiquidity += parseFloat(bid.quantity) * parseFloat(bid.price);
        }
      }
      
      for (const ask of orderbook.asks) {
        if (parseFloat(ask.price) - midPrice <= threshold) {
          totalAskLiquidity += parseFloat(ask.quantity) * parseFloat(ask.price);
        }
      }
      
      return {
        totalBidLiquidity,
        totalAskLiquidity,
        spreadPercent,
        marketDepth: totalBidLiquidity + totalAskLiquidity,
        bidLevels: orderbook.bids.length,
        askLevels: orderbook.asks.length
      };
    } catch (error) {
      return {
        totalBidLiquidity: 0,
        totalAskLiquidity: 0,
        spreadPercent: 1.0,
        marketDepth: 0,
        bidLevels: 0,
        askLevels: 0
      };
    }
  }

  async estimateFeesIfAvailable(symbol: string, userAddress?: string): Promise<number> {
    // SoDEX fee structure - this would come from API in production
    // For now, use standard maker/taker fees
    return 0.001; // 0.1% default fee
  }

  async prepareExecutionPreview(tradeInput: any): Promise<SodexExecutionPreview> {
    try {
      const { symbol, action, amount } = tradeInput;
      const side = action.toUpperCase() as 'BUY' | 'SELL';
      
      // Validate symbol exists
      const symbolExists = await this.validateSymbolExists(symbol);
      if (!symbolExists) {
        return {
          symbol,
          side,
          amount,
          estimatedPrice: 0,
          estimatedSlippage: 0,
          estimatedFees: 0,
          priceImpact: 0,
          executionProbability: 0,
          warnings: [`Symbol ${symbol} not found on SoDEX`],
          canExecute: false,
          mode: 'preview',
          liquidityAnalysis: {
            totalBidLiquidity: 0,
            totalAskLiquidity: 0,
            spreadPercent: 0,
            marketDepth: 0
          }
        };
      }

      // Get current market data
      const ticker = await this.getSpotTicker(symbol);
      const currentPrice = parseFloat(ticker.lastPrice);
      
      // Analyze liquidity
      const liquidityAnalysis = await this.analyzeLiquidity(symbol);
      
      // Estimate slippage
      const slippage = await this.estimateSlippageFromOrderbook(symbol, side, amount);
      
      // Estimate fees
      const fees = await this.estimateFeesIfAvailable(symbol);
      
      // Calculate price impact
      const priceImpact = slippage * 0.5; // Rough estimate
      
      // Calculate execution probability based on volume and liquidity
      const volume24h = parseFloat(ticker.volume);
      const liquidityRatio = liquidityAnalysis.marketDepth / amount;
      const volumeRatio = volume24h / amount;
      
      const executionProbability = Math.min(0.95, 
        (liquidityRatio * 0.3 + volumeRatio * 0.7) * 0.1
      );
      
      const warnings: string[] = [];
      if (slippage > 0.02) warnings.push('High slippage expected');
      if (executionProbability < 0.8) warnings.push('Low execution probability');
      if (amount > volume24h * 0.1) warnings.push('Large order relative to daily volume');
      if (liquidityAnalysis.spreadPercent > 0.5) warnings.push('Wide bid-ask spread');
      if (liquidityAnalysis.marketDepth < amount * 2) warnings.push('Insufficient market depth');

      return {
        symbol,
        side,
        amount,
        estimatedPrice: currentPrice,
        estimatedSlippage: slippage,
        estimatedFees: fees,
        priceImpact,
        executionProbability,
        warnings,
        canExecute: warnings.length === 0,
        mode: 'testnet',
        liquidityAnalysis
      };
    } catch (error) {
      return {
        symbol: tradeInput.symbol,
        side: tradeInput.action.toUpperCase(),
        amount: tradeInput.amount,
        estimatedPrice: 0,
        estimatedSlippage: 0,
        estimatedFees: 0,
        priceImpact: 0,
        executionProbability: 0,
        warnings: ['Unable to fetch execution data from SoDEX'],
        canExecute: false,
        mode: 'preview',
        liquidityAnalysis: {
          totalBidLiquidity: 0,
          totalAskLiquidity: 0,
          spreadPercent: 0,
          marketDepth: 0
        }
      };
    }
  }
}

export const sodexAPI = new SoDEXAPI();