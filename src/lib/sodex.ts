// SoDEX public REST — https://testnet-gw.sodex.dev/api/v1/spot (default)
// Responses use `code` + `data`; tickers/orderbooks use exchange-native field names.

export interface SodexSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  baseAssetPrecision: number;
  quotePrecision: number;
  orderTypes: string[];
  filters: unknown[];
  permissions: string[];
  /** Present on SoDEX market rows */
  name?: string;
  makerFee?: string;
  takerFee?: string;
}

export interface SodexCoin {
  coin: string;
  name: string;
  networkList: unknown[];
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
  mode: 'preview';
  liquidityAnalysis: {
    totalBidLiquidity: number;
    totalAskLiquidity: number;
    spreadPercent: number;
    marketDepth: number;
  };
}

export interface SodexFetchMeta {
  endpoints: string[];
  network: 'testnet' | 'mainnet';
  fetchedAtMs: number;
}

export interface SodexMarketMicrostructure {
  ticker: SodexTicker;
  orderbook: SodexOrderbook;
  klines: SodexKline[];
  recentTrades: SodexTrade[];
  executionPreview: SodexExecutionPreview;
  liquidityAnalysis: SodexExecutionPreview['liquidityAnalysis'] & {
    bidLevels: number;
    askLevels: number;
  };
  meta: SodexFetchMeta;
}

class SoDEXAPI {
  private readonly spotBaseUrl: string;
  private readonly network: 'testnet' | 'mainnet';
  private symbolsCache: { at: number; rows: Record<string, unknown>[] } | null = null;
  private static readonly SYMBOLS_TTL_MS = 5 * 60 * 1000;

  constructor() {
    const useTestnet = (process.env.SODEX_USE_TESTNET ?? 'true').toLowerCase() !== 'false';
    this.network = useTestnet ? 'testnet' : 'mainnet';
    this.spotBaseUrl = (
      useTestnet
        ? process.env.SODEX_TESTNET_SPOT_URL || 'https://testnet-gw.sodex.dev/api/v1/spot'
        : process.env.SODEX_MAINNET_SPOT_URL || 'https://mainnet-gw.sodex.dev/api/v1/spot'
    ).replace(/\/$/, '');
  }

  private unwrap(payload: unknown): unknown {
    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      typeof (payload as { code: unknown }).code === 'number'
    ) {
      const p = payload as { code: number; message?: string; data?: unknown };
      if (p.code !== 0) {
        throw new Error(`SoDEX error ${p.code}: ${p.message || 'request failed'}`);
      }
      return p.data;
    }
    return payload;
  }

  private async fetchSpot(path: string): Promise<unknown> {
    const url = `${this.spotBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TradeFirewall/1.1',
      },
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      throw new Error(`SoDEX HTTP ${response.status}: ${response.statusText}`);
    }
    return this.unwrap(await response.json());
  }

  private mapSymbolToSodexFormat(symbol: string): string {
    const symbolMap: Record<string, string> = {
      BTC: 'vBTC_vUSDC',
      ETH: 'vETH_vUSDC',
      SOL: 'vSOL_vUSDC',
      ADA: 'vADA_vUSDC',
      AVAX: 'vAVAX_vUSDC',
      DOGE: 'vDOGE_vUSDC',
      XRP: 'vXRP_vUSDC',
      BNB: 'vBNB_vUSDC',
      LINK: 'vLINK_vUSDC',
      UNI: 'vUNI_vUSDC',
      AAVE: 'vAAVE_vUSDC',
      LTC: 'vLTC_vUSDC',
      SHIB: 'vSHIB_vUSDC',
      ZEC: 'vZEC_vUSDC',
      USDT: 'vUSDT_vUSDC',
      SOSO: 'WSOSO_vUSDC',
      HYPE: 'vHYPE_vUSDC',
      AAPL: 'vAAPL_vUSDC',
      TSLA: 'vTSLA_vUSDC',
      NVDA: 'vNVDA_vUSDC',
      MSFT: 'vMSFT_vUSDC',
      GOOGL: 'vGOOGL_vUSDC',
      AMZN: 'vAMZN_vUSDC',
      META: 'vMETA_vUSDC',
      TESTBTC: 'TESTBTC_vUSDC',
      TESTSOSO: 'TESTSOSO_vUSDC',
      TESTSHIB: 'TESTSHIB_vUSDC',
    };
    const u = symbol.toUpperCase();
    return symbolMap[u] || symbol;
  }

  private normalizeTickerRow(raw: Record<string, unknown>, sodexSymbol: string): SodexTicker {
    const lastPx = String(raw.lastPx ?? raw.lastPrice ?? '0');
    const openPx = String(raw.openPx ?? raw.openPrice ?? '0');
    const vol = String(raw.volume ?? '0');
    const qVol = String(raw.quoteVolume ?? '0');
    const bidPx = String(raw.bidPx ?? raw.bidPrice ?? '0');
    const bidSz = String(raw.bidSz ?? raw.bidQty ?? '0');
    const askPx = String(raw.askPx ?? raw.askPrice ?? '0');
    const askSz = String(raw.askSz ?? raw.askQty ?? '0');
    return {
      symbol: String(raw.symbol ?? sodexSymbol),
      priceChange: String(raw.change ?? raw.priceChange ?? '0'),
      priceChangePercent: String(raw.changePct ?? raw.priceChangePercent ?? '0'),
      weightedAvgPrice: lastPx,
      prevClosePrice: openPx,
      lastPrice: lastPx,
      lastQty: '0',
      bidPrice: bidPx,
      bidQty: bidSz,
      askPrice: askPx,
      askQty: askSz,
      openPrice: openPx,
      highPrice: String(raw.highPx ?? raw.highPrice ?? lastPx),
      lowPrice: String(raw.lowPx ?? raw.lowPrice ?? lastPx),
      volume: vol,
      quoteVolume: qVol,
      openTime: Number(raw.openTime ?? 0),
      closeTime: Number(raw.closeTime ?? 0),
      firstId: 0,
      lastId: 0,
      count: Number(raw.count ?? 0),
    };
  }

  private normalizeOrderbook(data: Record<string, unknown>): SodexOrderbook {
    const bidsRaw = (data.bids as unknown[]) || [];
    const asksRaw = (data.asks as unknown[]) || [];
    const toRow = (row: unknown): SodexOrderbookEntry => {
      if (Array.isArray(row) && row.length >= 2) {
        return { price: String(row[0]), quantity: String(row[1]) };
      }
      if (row && typeof row === 'object') {
        const o = row as { price?: string; quantity?: string; qty?: string };
        return { price: String(o.price ?? '0'), quantity: String(o.quantity ?? o.qty ?? '0') };
      }
      return { price: '0', quantity: '0' };
    };
    return {
      lastUpdateId: Number(data.updateID ?? data.lastUpdateId ?? 0),
      bids: bidsRaw.map(toRow),
      asks: asksRaw.map(toRow),
    };
  }

  private normalizeKline(row: Record<string, unknown>): SodexKline {
    const t = Number(row.t ?? row.openTime ?? 0);
    const cT = Number(row.T ?? row.closeTime ?? t);
    return {
      openTime: t,
      open: String(row.o ?? row.open ?? '0'),
      high: String(row.h ?? row.high ?? '0'),
      low: String(row.l ?? row.low ?? '0'),
      close: String(row.c ?? row.close ?? '0'),
      volume: String(row.v ?? row.volume ?? '0'),
      closeTime: cT,
      quoteAssetVolume: String(row.q ?? row.quoteAssetVolume ?? '0'),
      numberOfTrades: Number(row.n ?? row.numberOfTrades ?? 0),
      takerBuyBaseAssetVolume: '0',
      takerBuyQuoteAssetVolume: '0',
    };
  }

  private normalizeTrade(row: Record<string, unknown>, idx: number): SodexTrade {
    const side = String(row.S ?? '');
    return {
      id: Number(row.t ?? row.id ?? idx),
      price: String(row.p ?? row.price ?? '0'),
      qty: String(row.q ?? row.qty ?? '0'),
      quoteQty: '0',
      time: Number(row.T ?? row.time ?? 0),
      isBuyerMaker: side.toUpperCase() === 'SELL',
    };
  }

  async getSpotSymbols(): Promise<SodexSymbol[]> {
    const rows = (await this.fetchSpot('/markets/symbols')) as Record<string, unknown>[];
    if (!Array.isArray(rows)) throw new Error('SoDEX /markets/symbols: unexpected shape');
    this.symbolsCache = { at: Date.now(), rows };
    return rows as unknown as SodexSymbol[];
  }

  private async getSymbolsRowsCached(): Promise<Record<string, unknown>[]> {
    if (this.symbolsCache && Date.now() - this.symbolsCache.at < SoDEXAPI.SYMBOLS_TTL_MS) {
      return this.symbolsCache.rows;
    }
    await this.getSpotSymbols();
    return this.symbolsCache!.rows;
  }

  async getSpotTickers(): Promise<SodexTicker[]> {
    const rows = (await this.fetchSpot('/markets/tickers')) as Record<string, unknown>[];
    if (!Array.isArray(rows)) throw new Error('SoDEX /markets/tickers: unexpected shape');
    return rows.map((r) => this.normalizeTickerRow(r, String(r.symbol ?? '')));
  }

  async getSpotTicker(symbol: string): Promise<SodexTicker> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const tickers = await this.getSpotTickers();
    const hit = tickers.find((t) => t.symbol === sodexSymbol);
    if (!hit) {
      throw new Error(`Ticker for ${symbol} (${sodexSymbol}) not found on SoDEX`);
    }
    return hit;
  }

  async getSpotBookTickers(): Promise<SodexBookTicker[]> {
    const rows = (await this.fetchSpot('/markets/bookTickers')) as Record<string, unknown>[];
    if (!Array.isArray(rows)) throw new Error('SoDEX /markets/bookTickers: unexpected shape');
    return rows.map((r) => ({
      symbol: String(r.symbol ?? ''),
      bidPrice: String(r.bidPx ?? r.bidPrice ?? '0'),
      bidQty: String(r.bidSz ?? r.bidQty ?? '0'),
      askPrice: String(r.askPx ?? r.askPrice ?? '0'),
      askQty: String(r.askSz ?? r.askQty ?? '0'),
    }));
  }

  async getSpotBookTicker(symbol: string): Promise<SodexBookTicker> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const all = await this.getSpotBookTickers();
    const hit = all.find((b) => b.symbol === sodexSymbol);
    if (!hit) throw new Error(`Book ticker for ${symbol} (${sodexSymbol}) not found on SoDEX`);
    return hit;
  }

  async getSpotOrderbook(symbol: string, limit = 100): Promise<SodexOrderbook> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const raw = (await this.fetchSpot(
      `/markets/${encodeURIComponent(sodexSymbol)}/orderbook?limit=${limit}`
    )) as Record<string, unknown>;
    return this.normalizeOrderbook(raw);
  }

  async getSpotKlines(symbol: string, interval: string, limit = 100): Promise<SodexKline[]> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const rows = (await this.fetchSpot(
      `/markets/${encodeURIComponent(sodexSymbol)}/klines?interval=${encodeURIComponent(
        interval
      )}&limit=${limit}`
    )) as Record<string, unknown>[];
    if (!Array.isArray(rows)) throw new Error('SoDEX klines: unexpected shape');
    return rows.map((r) => this.normalizeKline(r));
  }

  async getSpotTrades(symbol: string, limit = 100): Promise<SodexTrade[]> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const rows = (await this.fetchSpot(
      `/markets/${encodeURIComponent(sodexSymbol)}/trades?limit=${limit}`
    )) as Record<string, unknown>[];
    if (!Array.isArray(rows)) throw new Error('SoDEX trades: unexpected shape');
    return rows.map((r, i) => this.normalizeTrade(r, i));
  }

  async validateSymbolExists(symbol: string): Promise<boolean> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const rows = await this.getSymbolsRowsCached();
    return rows.some((s) => String(s.name ?? s.symbol ?? '') === sodexSymbol);
  }

  /**
   * Walk the book in **base asset units**. `notionalUsd` is the trade size in USD;
   * `referencePriceUsdPerBase` is a mid/last price in USD per 1 base (e.g. BTC).
   */
  async estimateSlippageFromOrderbook(
    symbol: string,
    side: 'BUY' | 'SELL',
    notionalUsd: number,
    referencePriceUsdPerBase: number
  ): Promise<number> {
    if (!Number.isFinite(notionalUsd) || notionalUsd <= 0) {
      throw new Error('Invalid trade notional for slippage estimate');
    }
    if (!Number.isFinite(referencePriceUsdPerBase) || referencePriceUsdPerBase <= 0) {
      throw new Error('Invalid reference price for slippage estimate');
    }
    const targetBaseQty = notionalUsd / referencePriceUsdPerBase;

    const orderbook = await this.getSpotOrderbook(symbol, 100);
    const orders = side === 'BUY' ? orderbook.asks : orderbook.bids;
    if (!orders.length) {
      throw new Error('SoDEX orderbook side is empty; cannot estimate slippage');
    }
    let totalBaseFilled = 0;
    let weightedPrice = 0;
    let firstPrice = 0;
    for (const order of orders) {
      const price = parseFloat(order.price);
      const quantity = parseFloat(order.quantity);
      if (!Number.isFinite(price) || !Number.isFinite(quantity) || price <= 0) continue;
      if (firstPrice === 0) firstPrice = price;
      if (totalBaseFilled + quantity >= targetBaseQty) {
        const remaining = targetBaseQty - totalBaseFilled;
        weightedPrice += price * remaining;
        totalBaseFilled = targetBaseQty;
        break;
      }
      weightedPrice += price * quantity;
      totalBaseFilled += quantity;
    }
    if (totalBaseFilled < targetBaseQty) {
      throw new Error('Insufficient visible book depth to estimate slippage for this size');
    }
    if (firstPrice <= 0 || totalBaseFilled <= 0) {
      throw new Error('Invalid SoDEX book data for slippage');
    }
    const avgPrice = weightedPrice / totalBaseFilled;
    return Math.min(Math.abs(avgPrice - firstPrice) / firstPrice, 0.5);
  }

  async analyzeLiquidity(symbol: string): Promise<{
    totalBidLiquidity: number;
    totalAskLiquidity: number;
    spreadPercent: number;
    marketDepth: number;
    bidLevels: number;
    askLevels: number;
  }> {
    const orderbook = await this.getSpotOrderbook(symbol);
    const bookTicker = await this.getSpotBookTicker(symbol);
    const bidPrice = parseFloat(bookTicker.bidPrice);
    const askPrice = parseFloat(bookTicker.askPrice);
    if (!Number.isFinite(bidPrice) || !Number.isFinite(askPrice) || bidPrice <= 0 || askPrice <= 0) {
      throw new Error('SoDEX bid/ask unavailable — cannot analyze liquidity');
    }
    const spread = askPrice - bidPrice;
    const mid = (bidPrice + askPrice) / 2;
    const spreadPercent = mid > 0 ? (spread / mid) * 100 : 0;
    const threshold = mid * 0.02;
    let totalBidLiquidity = 0;
    let totalAskLiquidity = 0;
    for (const bid of orderbook.bids) {
      const p = parseFloat(bid.price);
      const q = parseFloat(bid.quantity);
      if (mid - p <= threshold) totalBidLiquidity += q * p;
    }
    for (const ask of orderbook.asks) {
      const p = parseFloat(ask.price);
      const q = parseFloat(ask.quantity);
      if (p - mid <= threshold) totalAskLiquidity += q * p;
    }
    return {
      totalBidLiquidity,
      totalAskLiquidity,
      spreadPercent,
      marketDepth: totalBidLiquidity + totalAskLiquidity,
      bidLevels: orderbook.bids.length,
      askLevels: orderbook.asks.length,
    };
  }

  private async getMarketFees(symbol: string): Promise<number> {
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const rows = await this.getSymbolsRowsCached();
    const row = rows.find((s) => String(s.name ?? '') === sodexSymbol);
    if (row) {
      const maker = parseFloat(String(row.makerFee ?? '0'));
      const taker = parseFloat(String(row.takerFee ?? '0'));
      if (Number.isFinite(taker) && taker > 0) return taker;
      if (Number.isFinite(maker) && maker > 0) return maker;
    }
    throw new Error('SoDEX fee schedule unavailable for this market');
  }

  async estimateFeesIfAvailable(symbol: string): Promise<number> {
    return this.getMarketFees(symbol);
  }

  async prepareExecutionPreview(tradeInput: {
    symbol: string;
    action: string;
    amount: number;
  }): Promise<SodexExecutionPreview> {
    const { symbol, action, amount } = tradeInput;
    const side = action.toUpperCase() as 'BUY' | 'SELL';
    const exists = await this.validateSymbolExists(symbol);
    if (!exists) {
      throw new Error(`Symbol ${symbol} not found on SoDEX markets`);
    }
    const ticker = await this.getSpotTicker(symbol);
    const currentPrice = parseFloat(ticker.lastPrice);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      throw new Error('SoDEX ticker price invalid for execution preview');
    }
    const liquidityAnalysis = await this.analyzeLiquidity(symbol);
    const slippage = await this.estimateSlippageFromOrderbook(symbol, side, amount, currentPrice);
    const fees = await this.estimateFeesIfAvailable(symbol);
    const priceImpact = slippage * 0.5;
    const volume24hBase = parseFloat(ticker.volume);
    const quoteVol24h = parseFloat(ticker.quoteVolume);
    const liquidityRatio =
      amount > 0 && Number.isFinite(liquidityAnalysis.marketDepth)
        ? liquidityAnalysis.marketDepth / amount
        : 0;
    const volumeRatio =
      amount > 0 && Number.isFinite(quoteVol24h) && quoteVol24h > 0
        ? amount / quoteVol24h
        : amount > 0 && Number.isFinite(volume24hBase) && volume24hBase > 0
          ? amount / (volume24hBase * currentPrice)
          : 0;
    const executionProbability = Math.min(
      0.95,
      Math.max(0, (liquidityRatio * 0.3 + volumeRatio * 0.7) * 0.1)
    );
    const warnings: string[] = [];
    if (slippage > 0.02) warnings.push('High slippage expected');
    if (executionProbability < 0.8) warnings.push('Low execution probability');
    if (Number.isFinite(quoteVol24h) && quoteVol24h > 0 && amount > quoteVol24h * 0.1) {
      warnings.push('Large order relative to 24h quote volume');
    }
    if (liquidityAnalysis.spreadPercent > 0.5) warnings.push('Wide bid-ask spread');
    if (liquidityAnalysis.marketDepth < amount * 2) warnings.push('Thin depth near mid price');
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
      canExecute: false,
      mode: 'preview',
      liquidityAnalysis: {
        totalBidLiquidity: liquidityAnalysis.totalBidLiquidity,
        totalAskLiquidity: liquidityAnalysis.totalAskLiquidity,
        spreadPercent: liquidityAnalysis.spreadPercent,
        marketDepth: liquidityAnalysis.marketDepth,
      },
    };
  }

  /** One coordinated fetch for the risk engine + UI proof. */
  async fetchMarketMicrostructure(
    symbol: string,
    tradeInput: { symbol: string; action: string; amount: number }
  ): Promise<SodexMarketMicrostructure> {
    const t0 = Date.now();
    const sodexSymbol = this.mapSymbolToSodexFormat(symbol);
    const basePath = `/markets/${encodeURIComponent(sodexSymbol)}`;
    const endpoints = [
      `${this.spotBaseUrl}/markets/tickers`,
      `${this.spotBaseUrl}/markets/bookTickers`,
      `${this.spotBaseUrl}${basePath}/orderbook`,
      `${this.spotBaseUrl}${basePath}/klines`,
      `${this.spotBaseUrl}${basePath}/trades`,
    ];
    const [ticker, orderbook, klines, recentTrades] = await Promise.all([
      this.getSpotTicker(symbol),
      this.getSpotOrderbook(symbol, 100),
      this.getSpotKlines(symbol, '1h', 48),
      this.getSpotTrades(symbol, 100),
    ]);
    const executionPreview = await this.prepareExecutionPreview(tradeInput);
    const liquidityAnalysis = await this.analyzeLiquidity(symbol);
    return {
      ticker,
      orderbook,
      klines,
      recentTrades,
      executionPreview,
      liquidityAnalysis: {
        ...liquidityAnalysis,
      },
      meta: {
        endpoints,
        network: this.network,
        fetchedAtMs: t0,
      },
    };
  }
}

export const sodexAPI = new SoDEXAPI();
