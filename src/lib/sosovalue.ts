// SoSoValue OpenAPI integration — https://openapi.sosovalue.com/openapi/v1
// Auth: header `x-soso-api-key` (see https://sosovalue.gitbook.io/soso-value-api-doc )

export interface SoSoMarketSummary {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  timestamp: number;
}

export interface SoSoAssetTrend {
  symbol: string;
  trend: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
  momentum: number;
  support: number;
  resistance: number;
  trendStrength: number;
  timeframe: string;
}

export interface SoSoNewsSentiment {
  symbol: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  newsCount: number;
  recentHeadlines: string[];
  sentimentSources: string[];
}

export interface SoSoVolumeData {
  symbol: string;
  volume24h: number;
  volumeChange: number;
  avgVolume7d: number;
  avgVolume30d: number;
  liquidityScore: number;
  volumeProfile: string;
}

export interface SoSoSectorData {
  symbol: string;
  sector: string;
  sectorPerformance: number;
  sectorTrend: 'bullish' | 'bearish' | 'neutral';
  relativeStrength: number;
  sectorLeaders: string[];
}

export interface SoSoETFOrMacroData {
  symbol: string;
  etfExposure?: number;
  macroFactors: {
    btcCorrelation: number;
    ethCorrelation: number;
    marketCorrelation: number;
    riskOnOff: 'risk_on' | 'risk_off' | 'neutral';
  };
}

export interface SoSoRiskContext {
  symbol: string;
  riskFactors: string[];
  opportunities: string[];
  marketNarrative: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  contextualWarnings: string[];
}

export interface SoSoFetchMeta {
  endpoints: string[];
  fetchedAtMs: number;
}

export interface SoSoMarketIntelligence {
  marketSummary: SoSoMarketSummary;
  assetTrend: SoSoAssetTrend;
  sentiment: SoSoNewsSentiment;
  volumeData: SoSoVolumeData;
  sectorData: SoSoSectorData;
  riskContext: SoSoRiskContext;
  meta: SoSoFetchMeta;
}

export class APIConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIConnectionError';
  }
}

type CurrencyRow = { currency_id: string; symbol: string; name: string };

type MarketSnapshot = {
  price: number | string;
  change_pct_24h?: number | string;
  turnover_24h?: number | string;
  marketcap?: number | string;
  high_24h?: number | string;
  low_24h?: number | string;
  turnover_rate?: number | string;
};

type KlineRow = { timestamp: number; open: number; high: number; low: number; close: number; volume: number };

type NewsItem = { title?: string };

class SoSoValueAPI {
  private readonly baseUrl: string;
  private currencyCache: { at: number; rows: CurrencyRow[] } | null = null;
  private static readonly LIST_TTL_MS = 60 * 60 * 1000;

  constructor() {
    this.baseUrl =
      process.env.SOSOVALUE_API_BASE_URL?.replace(/\/$/, '') ||
      'https://openapi.sosovalue.com/openapi/v1';
  }

  private getApiKey(): string | undefined {
    return process.env.SOSOVALUE_API_KEY || process.env.NEXT_PUBLIC_SOSOVALUE_API_KEY;
  }

  private requireKey(): string {
    const key = this.getApiKey();
    if (!key) {
      throw new APIConnectionError(
        'Live SoSoValue market data is not connected. Set SOSOVALUE_API_KEY in .env.local (server-side).'
      );
    }
    return key;
  }

  private unwrap<T>(body: unknown): T {
    if (
      body &&
      typeof body === 'object' &&
      'code' in body &&
      typeof (body as { code: unknown }).code === 'number'
    ) {
      const b = body as { code: number; message?: string; data?: unknown };
      if (b.code !== 0) {
        throw new Error(`SoSoValue API error ${b.code}: ${b.message || 'unknown'}`);
      }
      return b.data as T;
    }
    return body as T;
  }

  private async fetchJson(path: string, query?: Record<string, string>): Promise<unknown> {
    const key = this.requireKey();
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const response = await fetch(url.toString(), {
      headers: {
        'x-soso-api-key': key,
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      throw new Error(`SoSoValue HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  private async getCurrencyRows(): Promise<CurrencyRow[]> {
    if (this.currencyCache && Date.now() - this.currencyCache.at < SoSoValueAPI.LIST_TTL_MS) {
      return this.currencyCache.rows;
    }
    const raw = await this.fetchJson('/currencies');
    const data = this.unwrap<unknown>(raw);
    const rows = Array.isArray(data) ? data : (data as { list?: CurrencyRow[] })?.list;
    if (!Array.isArray(rows)) {
      throw new Error('SoSoValue /currencies returned an unexpected payload');
    }
    this.currencyCache = { at: Date.now(), rows };
    return rows;
  }

  async resolveCurrencyId(symbol: string): Promise<string> {
    const rows = await this.getCurrencyRows();
    const u = symbol.toUpperCase();
    const hit = rows.find((r) => r.symbol?.toUpperCase() === u);
    if (!hit) {
      throw new Error(`Currency ${symbol} not found in SoSoValue currency list`);
    }
    return hit.currency_id;
  }

  private num(v: unknown, fallback = 0): number {
    if (v === null || v === undefined) return fallback;
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  private sentimentFromHeadlines(headlines: string[]): Pick<SoSoNewsSentiment, 'sentiment' | 'score'> {
    if (headlines.length === 0) {
      return { sentiment: 'neutral', score: 0 };
    }
    const pos = /surge|rally|gain|soar|bull|growth|positive|upgrade|record|breakout/i;
    const neg = /crash|plunge|drop|bear|hack|fraud|sec|lawsuit|liquidat|loss|ban|downgrade/i;
    let p = 0;
    let n = 0;
    for (const h of headlines) {
      if (pos.test(h)) p++;
      if (neg.test(h)) n++;
    }
    const raw = (p - n) / headlines.length;
    const score = Math.max(-1, Math.min(1, raw));
    const sentiment: SoSoNewsSentiment['sentiment'] =
      score > 0.08 ? 'positive' : score < -0.08 ? 'negative' : 'neutral';
    return { sentiment, score };
  }

  private buildRiskContext(symbol: string, snap: MarketSnapshot, klines: KlineRow[]): SoSoRiskContext {
    const change = this.num(snap.change_pct_24h);
    const turnoverRate = this.num(snap.turnover_rate);
    const downAth = snap && typeof snap === 'object' && 'down_from_ath' in snap ? String((snap as { down_from_ath?: string }).down_from_ath || '') : '';
    const factors: string[] = [];
    const warnings: string[] = [];
    if (Math.abs(change) >= 8) factors.push(`Large 24h move: ${change.toFixed(2)}%`);
    if (Math.abs(change) >= 4 && Math.abs(change) < 8) factors.push(`Elevated 24h move: ${change.toFixed(2)}%`);
    if (turnoverRate > 0.25) factors.push(`High 24h turnover rate (${(turnoverRate * 100).toFixed(1)}%)`);
    if (downAth && downAth.length > 0 && downAth !== 'null') {
      factors.push(`Distance from ATH context available (${downAth})`);
    }
    if (klines.length >= 2) {
      const last = klines[klines.length - 1].close;
      const first = klines[0].close;
      if (first > 0) {
        const span = ((last - first) / first) * 100;
        if (Math.abs(span) >= 15) warnings.push(`~${klines.length}d price window moved ${span.toFixed(1)}%`);
      }
    }
    let riskLevel: SoSoRiskContext['riskLevel'] = 'medium';
    if (Math.abs(change) >= 12 || turnoverRate > 0.4) riskLevel = 'high';
    if (Math.abs(change) >= 20 || turnoverRate > 0.55) riskLevel = 'extreme';
    if (Math.abs(change) < 3 && turnoverRate < 0.12) riskLevel = 'low';

    const narrativeParts = [
      `Spot reference price ~${this.num(snap.price).toFixed(4)} USD.`,
      `24h change ${change.toFixed(2)}%.`,
      klines.length ? `Using ${klines.length} daily candles from SoSoValue.` : '',
    ].filter(Boolean);

    return {
      symbol,
      riskFactors: factors,
      opportunities: change < -5 ? ['Asset is materially down 24h; mean-reversion traders may see opportunity (not a recommendation).'] : [],
      marketNarrative: narrativeParts.join(' '),
      riskLevel,
      contextualWarnings: warnings,
    };
  }

  /** Single coordinated fetch: one currency resolve, real endpoints only, no mock payloads. */
  async fetchMarketIntelligence(symbol: string): Promise<SoSoMarketIntelligence> {
    const endpoints: string[] = [];
    const t0 = Date.now();
    const currencyId = await this.resolveCurrencyId(symbol);
    endpoints.push('GET /currencies', `GET /currencies/{id}/market-snapshot`);

    const [snapRaw, klinesRaw, infoRaw, sectorRaw, newsRaw] = await Promise.all([
      this.fetchJson(`/currencies/${currencyId}/market-snapshot`),
      this.fetchJson(`/currencies/${currencyId}/klines`, { interval: '1d', limit: '90' }),
      this.fetchJson(`/currencies/${currencyId}`),
      this.fetchJson('/currencies/sector-spotlight'),
      this.fetchJson('/news/search', { keyword: symbol.toUpperCase(), page_size: '20' }),
    ]);
    endpoints.push(
      'GET /currencies/{id}/klines?interval=1d',
      'GET /currencies/{id}',
      'GET /currencies/sector-spotlight',
      'GET /news/search'
    );

    const snap = this.unwrap<MarketSnapshot>(snapRaw);
    const klinesUnwrapped = this.unwrap<KlineRow[] | { list?: KlineRow[] }>(klinesRaw);
    const klineList: KlineRow[] = Array.isArray(klinesUnwrapped)
      ? klinesUnwrapped
      : Array.isArray((klinesUnwrapped as { list?: KlineRow[] }).list)
        ? (klinesUnwrapped as { list: KlineRow[] }).list
        : [];

    const info = this.unwrap<{
      symbol?: string;
      sector?: { id?: string; name?: string }[];
    }>(infoRaw);

    const sectorSpot = this.unwrap<{ sector?: { name: string; '24h_change_pct'?: number; marketcap_dom?: number }[] }>(
      sectorRaw
    );

    const newsWrapped = this.unwrap<{ list?: NewsItem[]; total?: number }>(newsRaw);
    const newsList = newsWrapped?.list || [];

    const price = this.num(snap.price);
    const change24h = this.num(snap.change_pct_24h);
    const volume24h = this.num(snap.turnover_24h);
    const marketCap = this.num(snap.marketcap);
    const trend: SoSoMarketSummary['trend'] =
      change24h > 1 ? 'bullish' : change24h < -1 ? 'bearish' : 'neutral';

    const marketSummary: SoSoMarketSummary = {
      symbol: symbol.toUpperCase(),
      price,
      change24h,
      volume24h,
      marketCap,
      trend,
      timestamp: Date.now(),
    };

    const closes = klineList.map((k) => this.num(k.close)).filter((c) => c > 0);
    let momentum = 0;
    let support = price * 0.97;
    let resistance = price * 1.03;
    let trendStrength = 0;
    if (closes.length >= 8) {
      const recent = closes[closes.length - 1];
      const prevWeek = closes[Math.max(0, closes.length - 8)];
      momentum = prevWeek > 0 ? (recent - prevWeek) / prevWeek : 0;
      support = Math.min(...closes.slice(-14));
      resistance = Math.max(...closes.slice(-14));
      trendStrength = Math.min(100, Math.abs(momentum) * 400);
    }
    let tr: SoSoAssetTrend['trend'] = 'neutral';
    if (momentum > 0.06) tr = 'strong_bullish';
    else if (momentum > 0.02) tr = 'bullish';
    else if (momentum < -0.06) tr = 'strong_bearish';
    else if (momentum < -0.02) tr = 'bearish';

    const assetTrend: SoSoAssetTrend = {
      symbol: symbol.toUpperCase(),
      trend: tr,
      momentum,
      support,
      resistance,
      trendStrength,
      timeframe: '1d',
    };

    const headlines = newsList
      .map((n) => (n.title || '').replace(/<[^>]+>/g, ''))
      .filter(Boolean)
      .slice(0, 8);
    const { sentiment, score } = this.sentimentFromHeadlines(headlines);

    const sentimentBlock: SoSoNewsSentiment = {
      symbol: symbol.toUpperCase(),
      sentiment,
      score,
      newsCount: newsWrapped?.total ?? newsList.length,
      recentHeadlines: headlines,
      sentimentSources: ['GET /news/search'],
    };

    const vols = klineList.map((k) => this.num(k.volume));
    const avg7 =
      vols.length >= 7 ? vols.slice(-7).reduce((a, b) => a + b, 0) / 7 : volume24h;
    const avg30 =
      vols.length >= 30 ? vols.slice(-30).reduce((a, b) => a + b, 0) / 30 : avg7;
    let volumeChange = 0;
    if (vols.length >= 2) {
      const lastV = vols[vols.length - 1];
      const prevV = vols[vols.length - 2];
      if (prevV > 0) volumeChange = ((lastV - prevV) / prevV) * 100;
    }
    const liqScore = Math.max(0, Math.min(100, 100 - Math.min(80, Math.abs(volumeChange))));

    const volumeData: SoSoVolumeData = {
      symbol: symbol.toUpperCase(),
      volume24h,
      volumeChange,
      avgVolume7d: avg7,
      avgVolume30d: avg30,
      liquidityScore: liqScore,
      volumeProfile: vols.length ? 'From SoSoValue daily klines + 24h turnover' : 'From 24h turnover only',
    };

    const primarySector = info.sector?.[0]?.name || 'unknown';
    const sectorMatch = (sectorSpot.sector || []).find(
      (s) => s.name?.toLowerCase() === primarySector.toLowerCase()
    );
    const sectorPerformance = this.num(sectorMatch?.['24h_change_pct']) * 100;
    const sectorTrend: SoSoSectorData['sectorTrend'] =
      sectorPerformance > 0.5 ? 'bullish' : sectorPerformance < -0.5 ? 'bearish' : 'neutral';

    const sectorData: SoSoSectorData = {
      symbol: symbol.toUpperCase(),
      sector: primarySector,
      sectorPerformance,
      sectorTrend,
      relativeStrength: Math.max(0, Math.min(100, 50 + sectorPerformance * 5)),
      sectorLeaders: (sectorSpot.sector || [])
        .slice(0, 5)
        .map((s) => s.name)
        .filter(Boolean),
    };

    const riskContext = this.buildRiskContext(symbol.toUpperCase(), snap, klineList);

    return {
      marketSummary,
      assetTrend,
      sentiment: sentimentBlock,
      volumeData,
      sectorData,
      riskContext,
      meta: { endpoints, fetchedAtMs: t0 },
    };
  }

  // Backwards-compatible single-method accessors — all delegate to fetchMarketIntelligence
  async getSoSoMarketSummary(symbol: string): Promise<SoSoMarketSummary> {
    return (await this.fetchMarketIntelligence(symbol)).marketSummary;
  }
  async getSoSoAssetTrend(symbol: string): Promise<SoSoAssetTrend> {
    return (await this.fetchMarketIntelligence(symbol)).assetTrend;
  }
  async getSoSoNewsSentiment(symbol: string): Promise<SoSoNewsSentiment> {
    return (await this.fetchMarketIntelligence(symbol)).sentiment;
  }
  async getSoSoVolumeData(symbol: string): Promise<SoSoVolumeData> {
    return (await this.fetchMarketIntelligence(symbol)).volumeData;
  }
  async getSoSoSectorData(symbol: string): Promise<SoSoSectorData> {
    return (await this.fetchMarketIntelligence(symbol)).sectorData;
  }
  async getSoSoRiskContext(symbol: string): Promise<SoSoRiskContext> {
    return (await this.fetchMarketIntelligence(symbol)).riskContext;
  }
}

export const sosoValueAPI = new SoSoValueAPI();
