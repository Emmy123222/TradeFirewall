// SoSoValue API integration layer - Real market intelligence data
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
  score: number; // -1 to 1
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
  liquidityScore: number; // 0-100
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

export class APIConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIConnectionError';
  }
}

class SoSoValueAPI {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.sosovalue.com/v1';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_SOSOVALUE_API_KEY;
  }

  private checkAPIConnection(): void {
    if (!this.apiKey) {
      throw new APIConnectionError('Live SoSoValue market data is not connected. Please configure SOSOVALUE_API_KEY.');
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    this.checkAPIConnection();

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`SoSoValue API request failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIConnectionError) {
        throw error;
      }
      throw new Error('SoSoValue market data is temporarily unavailable. Please try again later.');
    }
  }

  async getSoSoMarketSummary(symbol: string): Promise<SoSoMarketSummary> {
    const data = await this.makeRequest(`/market/summary/${symbol}`);
    return {
      symbol: data.symbol,
      price: data.price,
      change24h: data.change24h,
      volume24h: data.volume24h,
      marketCap: data.marketCap,
      trend: data.trend,
      timestamp: data.timestamp || Date.now()
    };
  }

  async getSoSoAssetTrend(symbol: string): Promise<SoSoAssetTrend> {
    const data = await this.makeRequest(`/trend/analysis/${symbol}`);
    return {
      symbol: data.symbol,
      trend: data.trend,
      momentum: data.momentum,
      support: data.support,
      resistance: data.resistance,
      trendStrength: data.trendStrength,
      timeframe: data.timeframe
    };
  }

  async getSoSoNewsSentiment(symbol: string): Promise<SoSoNewsSentiment> {
    const data = await this.makeRequest(`/sentiment/news/${symbol}`);
    return {
      symbol: data.symbol,
      sentiment: data.sentiment,
      score: data.score,
      newsCount: data.newsCount,
      recentHeadlines: data.recentHeadlines || [],
      sentimentSources: data.sentimentSources || []
    };
  }

  async getSoSoVolumeData(symbol: string): Promise<SoSoVolumeData> {
    const data = await this.makeRequest(`/volume/analysis/${symbol}`);
    return {
      symbol: data.symbol,
      volume24h: data.volume24h,
      volumeChange: data.volumeChange,
      avgVolume7d: data.avgVolume7d,
      avgVolume30d: data.avgVolume30d,
      liquidityScore: data.liquidityScore,
      volumeProfile: data.volumeProfile
    };
  }

  async getSoSoSectorData(symbol: string): Promise<SoSoSectorData> {
    const data = await this.makeRequest(`/sector/analysis/${symbol}`);
    return {
      symbol: data.symbol,
      sector: data.sector,
      sectorPerformance: data.sectorPerformance,
      sectorTrend: data.sectorTrend,
      relativeStrength: data.relativeStrength,
      sectorLeaders: data.sectorLeaders || []
    };
  }

  async getSoSoETFOrMacroData(symbol: string): Promise<SoSoETFOrMacroData> {
    const data = await this.makeRequest(`/macro/analysis/${symbol}`);
    return {
      symbol: data.symbol,
      etfExposure: data.etfExposure,
      macroFactors: {
        btcCorrelation: data.macroFactors.btcCorrelation,
        ethCorrelation: data.macroFactors.ethCorrelation,
        marketCorrelation: data.macroFactors.marketCorrelation,
        riskOnOff: data.macroFactors.riskOnOff
      }
    };
  }

  async getSoSoRiskContext(symbol: string): Promise<SoSoRiskContext> {
    const data = await this.makeRequest(`/risk/context/${symbol}`);
    return {
      symbol: data.symbol,
      riskFactors: data.riskFactors || [],
      opportunities: data.opportunities || [],
      marketNarrative: data.marketNarrative,
      riskLevel: data.riskLevel,
      contextualWarnings: data.contextualWarnings || []
    };
  }
}

export const sosoValueAPI = new SoSoValueAPI();