// Risk scoring engine for trade analysis — live SoSoValue + SoDEX only (no mock payloads)
import { sosoValueAPI, APIConnectionError } from './sosovalue';
import { sodexAPI } from './sodex';

export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';
export type HoldingPeriod = 'intraday' | '1day' | '7days' | '30days';
export type TradeAction = 'buy' | 'sell';
export type Decision = 'APPROVE' | 'CAUTION' | 'REDUCE_OR_WAIT' | 'BLOCK';

export interface TradeInput {
  symbol: string;
  action: TradeAction;
  amount: number;
  holdingPeriod: HoldingPeriod;
  riskProfile: RiskProfile;
  notes?: string;
}

export interface DataSourcesReport {
  /** Human-readable lines for PDF/UI */
  lines: string[];
  lastUpdatedDisplay: string;
  lastUpdatedIso: string;
  sosoValue: {
    status: 'connected' | 'error';
    live: boolean;
    lastUpdatedIso: string;
    categories: string[];
    endpoints: string[];
    errorMessage?: string;
  };
  sodex: {
    status: 'connected' | 'error';
    live: boolean;
    lastUpdatedIso: string;
    network: 'testnet' | 'mainnet';
    categories: string[];
    endpoints: string[];
    errorMessage?: string;
  };
}

export interface RiskAnalysis {
  riskScore: number; // 0-100
  decision: Decision;
  reasons: string[];
  saferAction: string;
  suggestedPositionSize: string;
  confidence: number; // 0-1
  marketFactors: {
    volatility: number;
    sentiment: number;
    volume: number;
    trend: number;
    liquidity: number;
    execution: number;
    sector: number;
    macro: number;
    positionSize: number;
    holdingPeriod: number;
  };
  dataSourcesUsed: string[];
  dataSourcesReport: DataSourcesReport;
  /** Values shown in UI as proof of live fetches */
  liveSnapshot: {
    sosoPrice: number;
    sosoChange24hPct: number;
    sodexLast: string;
    sodexBid: string;
    sodexAsk: string;
    sodexVolume: string;
    sodexSymbol: string;
    spreadPercent: number;
  };
}

class RiskEngine {
  async analyzeTradeRisk(input: TradeInput): Promise<RiskAnalysis> {
    const dataSourcesUsed: string[] = [
      'SoSoValue: market snapshot, daily klines, sector spotlight, news search, risk context',
      'SoDEX: ticker, orderbook, klines, trades, liquidity, execution preview (public REST)',
    ];

    try {
      const symbolExists = await sodexAPI.validateSymbolExists(input.symbol);
      if (!symbolExists) {
        throw new Error(`Symbol ${input.symbol} not found on SoDEX exchange`);
      }

      const finishedAt = Date.now();
      const [sosoMI, sodexMS] = await Promise.all([
        sosoValueAPI.fetchMarketIntelligence(input.symbol),
        sodexAPI.fetchMarketMicrostructure(input.symbol, input),
      ]);

      const sosoData = {
        marketSummary: sosoMI.marketSummary,
        assetTrend: sosoMI.assetTrend,
        sentiment: sosoMI.sentiment,
        volumeData: sosoMI.volumeData,
        sectorData: sosoMI.sectorData,
        riskContext: sosoMI.riskContext,
      };

      const sodexData = {
        ticker: sodexMS.ticker,
        orderbook: sodexMS.orderbook,
        klines: sodexMS.klines,
        recentTrades: sodexMS.recentTrades,
        executionPreview: sodexMS.executionPreview,
        liquidityAnalysis: sodexMS.liquidityAnalysis,
      };

      const lastUpdatedIso = new Date(finishedAt).toISOString();
      const lastUpdatedDisplay = new Date(finishedAt).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      });

      const dataSourcesReport: DataSourcesReport = {
        lines: [
          'SoSoValue: market intelligence (snapshot, trend/volume from daily klines), sentiment (news search), sector, risk context',
          'SoDEX: ticker, orderbook, klines, recent trades, liquidity/spread, execution preview (slippage from book walk)',
          `Last updated: ${lastUpdatedDisplay}`,
        ],
        lastUpdatedDisplay,
        lastUpdatedIso,
        sosoValue: {
          status: 'connected',
          live: true,
          lastUpdatedIso,
          categories: [
            'Market snapshot',
            'Trend & momentum (1d klines)',
            'Volume context',
            'News sentiment',
            'Sector',
            'Risk context',
          ],
          endpoints: sosoMI.meta.endpoints,
        },
        sodex: {
          status: 'connected',
          live: true,
          lastUpdatedIso,
          network: sodexMS.meta.network,
          categories: ['Ticker', 'Orderbook', 'Klines', 'Trades', 'Liquidity', 'Execution preview'],
          endpoints: sodexMS.meta.endpoints,
        },
      };

      const riskFactors = this.calculateRiskFactors(input, sosoData, sodexData);
      const riskScore = this.combineRiskFactors(riskFactors);
      const decision = this.determineDecision(riskScore, input.riskProfile);
      const reasons = this.generateReasons(riskFactors, input, sosoData, sodexData);
      const saferAction = this.generateSaferAction(decision, riskScore, input);
      const suggestedPositionSize = this.calculateSaferPositionSize(input.amount, riskScore, input.riskProfile);
      const confidence = this.calculateConfidence(dataSourcesUsed, sosoData, sodexData);

      const bid = parseFloat(sodexMS.ticker.bidPrice);
      const ask = parseFloat(sodexMS.ticker.askPrice);
      const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : 0;
      const spreadPercent = mid > 0 && ask >= bid ? ((ask - bid) / mid) * 100 : 0;

      return {
        riskScore,
        decision,
        reasons,
        saferAction,
        suggestedPositionSize,
        confidence,
        marketFactors: riskFactors,
        dataSourcesUsed,
        dataSourcesReport,
        liveSnapshot: {
          sosoPrice: sosoMI.marketSummary.price,
          sosoChange24hPct: sosoMI.marketSummary.change24h,
          sodexLast: sodexMS.ticker.lastPrice,
          sodexBid: sodexMS.ticker.bidPrice,
          sodexAsk: sodexMS.ticker.askPrice,
          sodexVolume: sodexMS.ticker.volume,
          sodexSymbol: sodexMS.ticker.symbol,
          spreadPercent,
        },
      };
    } catch (error) {
      // Re-throw API connection errors to be handled by the UI
      if (error instanceof APIConnectionError) {
        throw error;
      }
      
      // For other errors, throw a descriptive error
      throw new Error(error instanceof Error ? error.message : 'Risk analysis failed');
    }
  }

  private calculateRiskFactors(input: TradeInput, sosoData: any, sodexData: any): any {
    const factors: any = {
      volatility: 50,
      sentiment: 50,
      volume: 50,
      trend: 50,
      liquidity: 50,
      execution: 50,
      sector: 50,
      macro: 50
    };

    // Calculate volatility risk from SoDEX klines
    if (sodexData.klines) {
      factors.volatility = this.calculateVolatilityFromKlines(sodexData.klines, input.holdingPeriod);
    }

    // Calculate sentiment risk from SoSoValue
    if (sosoData.sentiment) {
      factors.sentiment = this.calculateSentimentRisk(sosoData.sentiment);
    }

    // Calculate volume risk from SoSoValue and SoDEX
    if (sosoData.volumeData || sodexData.ticker) {
      factors.volume = this.calculateVolumeRisk(sosoData.volumeData, sodexData.ticker);
    }

    // Calculate trend risk from SoSoValue
    if (sosoData.assetTrend) {
      factors.trend = this.calculateTrendRisk(sosoData.assetTrend, input.action);
    }

    // Calculate liquidity risk from SoDEX orderbook
    if (sodexData.orderbook) {
      factors.liquidity = this.calculateLiquidityRisk(sodexData.orderbook, input.amount);
    }

    // Calculate execution risk from SoDEX execution preview
    if (sodexData.executionPreview) {
      factors.execution = this.calculateExecutionRisk(sodexData.executionPreview);
    }

    // Calculate sector risk from SoSoValue
    if (sosoData.sectorData) {
      factors.sector = this.calculateSectorRisk(sosoData.sectorData);
    }

    // Calculate macro risk from SoSoValue
    if (sosoData.riskContext) {
      factors.macro = this.calculateMacroRisk(sosoData.riskContext);
    }

    // Add position size risk
    factors.positionSize = this.calculatePositionSizeRisk(input.amount, input.riskProfile);
    
    // Add holding period risk
    factors.holdingPeriod = this.calculateHoldingPeriodRisk(input.holdingPeriod, factors.volatility);

    return factors;
  }

  private calculateVolatilityFromKlines(klines: any[], holdingPeriod: HoldingPeriod): number {
    if (!klines || klines.length < 2) return 70; // High risk if no data
    
    // Calculate price volatility from klines
    const prices = klines.map(k => parseFloat(k.close));
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const variance = returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(24); // Annualized
    
    // Convert to risk score
    if (volatility > 0.15) return 90; // Extreme
    if (volatility > 0.10) return 70; // High
    if (volatility > 0.05) return 40; // Medium
    return 20; // Low
  }

  private calculateSentimentRisk(sentiment: any): number {
    if (!sentiment) return 50; // Neutral if no data
    
    // Convert sentiment score (-1 to 1) to risk score (0-100)
    if (sentiment.score < -0.5) return 80;
    if (sentiment.score < -0.2) return 60;
    if (sentiment.score < 0.2) return 40;
    if (sentiment.score < 0.5) return 20;
    return 10;
  }

  private calculateVolumeRisk(sosoVolumeData: any, sodexTicker: any): number {
    let volumeRisk = 50; // Default
    
    if (sosoVolumeData) {
      // Use SoSoValue volume analysis
      if (sosoVolumeData.volumeChange < -30) volumeRisk = 80;
      else if (sosoVolumeData.volumeChange < -15) volumeRisk = 60;
      else if (sosoVolumeData.volumeChange < 0) volumeRisk = 40;
      else volumeRisk = 20;
    } else if (sodexTicker) {
      // Fallback to SoDEX volume data
      const volume = parseFloat(sodexTicker.volume);
      if (volume < 1000) volumeRisk = 80; // Very low volume
      else if (volume < 10000) volumeRisk = 60;
      else if (volume < 100000) volumeRisk = 40;
      else volumeRisk = 20;
    }
    
    return volumeRisk;
  }

  private calculateTrendRisk(assetTrend: any, action: TradeAction): number {
    if (!assetTrend) return 50; // Neutral if no data
    
    const trendRiskMap = {
      'strong_bearish': action === 'buy' ? 90 : 20,
      'bearish': action === 'buy' ? 70 : 30,
      'neutral': 50,
      'bullish': action === 'buy' ? 30 : 70,
      'strong_bullish': action === 'buy' ? 20 : 90
    };

    return trendRiskMap[assetTrend.trend as keyof typeof trendRiskMap] || 50;
  }

  private calculateLiquidityRisk(orderbook: any, amount: number): number {
    if (!orderbook) return 70; // High risk if no orderbook data
    
    // Calculate total liquidity within 2% of mid price
    const bids = orderbook.bids || [];
    const asks = orderbook.asks || [];
    
    if (bids.length === 0 || asks.length === 0) return 90;
    
    const bestBid = parseFloat(bids[0].price);
    const bestAsk = parseFloat(asks[0].price);
    const midPrice = (bestBid + bestAsk) / 2;
    
    let totalLiquidity = 0;
    const threshold = midPrice * 0.02; // 2% from mid
    
    // Sum liquidity within threshold
    for (const bid of bids) {
      if (midPrice - parseFloat(bid.price) <= threshold) {
        totalLiquidity += parseFloat(bid.quantity) * parseFloat(bid.price);
      }
    }
    
    for (const ask of asks) {
      if (parseFloat(ask.price) - midPrice <= threshold) {
        totalLiquidity += parseFloat(ask.quantity) * parseFloat(ask.price);
      }
    }
    
    // Compare to trade size
    const liquidityRatio = totalLiquidity / amount;
    
    if (liquidityRatio < 2) return 90; // Very low liquidity
    if (liquidityRatio < 5) return 70;
    if (liquidityRatio < 10) return 50;
    if (liquidityRatio < 20) return 30;
    return 10;
  }

  private calculateExecutionRisk(executionPreview: any): number {
    if (!executionPreview) return 70; // High risk if no execution data
    
    let risk = 0;
    
    // Slippage risk
    if (executionPreview.estimatedSlippage > 0.05) risk += 30;
    else if (executionPreview.estimatedSlippage > 0.02) risk += 20;
    else if (executionPreview.estimatedSlippage > 0.01) risk += 10;
    
    // Price impact risk
    if (executionPreview.priceImpact > 0.03) risk += 25;
    else if (executionPreview.priceImpact > 0.01) risk += 15;
    else if (executionPreview.priceImpact > 0.005) risk += 5;
    
    // Execution probability risk
    if (executionPreview.executionProbability < 0.7) risk += 30;
    else if (executionPreview.executionProbability < 0.8) risk += 20;
    else if (executionPreview.executionProbability < 0.9) risk += 10;
    
    // Warnings
    risk += executionPreview.warnings.length * 10;
    
    return Math.min(risk, 100);
  }

  private calculateSectorRisk(sectorData: any): number {
    if (!sectorData) return 50; // Neutral if no data
    
    let risk = 50;
    
    // Sector performance risk
    if (sectorData.sectorPerformance < -10) risk += 20;
    else if (sectorData.sectorPerformance < -5) risk += 10;
    else if (sectorData.sectorPerformance > 10) risk -= 10;
    else if (sectorData.sectorPerformance > 5) risk -= 5;
    
    // Sector trend risk
    if (sectorData.sectorTrend === 'bearish') risk += 15;
    else if (sectorData.sectorTrend === 'bullish') risk -= 10;
    
    // Relative strength
    if (sectorData.relativeStrength < 30) risk += 15;
    else if (sectorData.relativeStrength > 70) risk -= 10;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateMacroRisk(riskContext: any): number {
    if (!riskContext) return 50; // Neutral if no data
    
    let risk = 50;
    
    // Risk level adjustment
    const riskLevelMap = {
      'low': -20,
      'medium': 0,
      'high': 20,
      'extreme': 40
    };
    
    risk += riskLevelMap[riskContext.riskLevel as keyof typeof riskLevelMap] || 0;
    
    // Risk factors count
    risk += riskContext.riskFactors.length * 5;
    
    // Contextual warnings
    risk += riskContext.contextualWarnings.length * 10;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculatePositionSizeRisk(amount: number, riskProfile: RiskProfile): number {
    const riskToleranceMap = {
      'conservative': 1000,
      'balanced': 5000,
      'aggressive': 20000
    };

    const tolerance = riskToleranceMap[riskProfile];
    const ratio = amount / tolerance;

    if (ratio > 5) return 90;
    if (ratio > 3) return 70;
    if (ratio > 2) return 50;
    if (ratio > 1) return 30;
    return 10;
  }

  private calculateHoldingPeriodRisk(holdingPeriod: HoldingPeriod, volatilityRiskScore: number): number {
    const periodRiskMap: Record<HoldingPeriod, number> = {
      intraday: 80,
      '1day': 60,
      '7days': 40,
      '30days': 20,
    };

    const baseRisk = periodRiskMap[holdingPeriod];
    const volatilityMultiplier =
      volatilityRiskScore > 75 ? 1.45 : volatilityRiskScore > 55 ? 1.2 : volatilityRiskScore > 40 ? 1.0 : 0.85;

    return Math.min(100, Math.round(baseRisk * volatilityMultiplier));
  }

  private combineRiskFactors(factors: Record<string, number>): number {
    const weights: Record<string, number> = {
      volatility: 0.18,
      sentiment: 0.1,
      volume: 0.1,
      trend: 0.15,
      liquidity: 0.1,
      execution: 0.1,
      sector: 0.07,
      macro: 0.05,
      positionSize: 0.1,
      holdingPeriod: 0.05,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(factors).forEach(([factor, value]) => {
      const weight = weights[factor] ?? 0;
      if (weight <= 0) return;
      weightedSum += value * weight;
      totalWeight += weight;
    });

    if (totalWeight <= 0) {
      throw new Error('Risk engine has no weighted factors to combine');
    }

    return Math.round(weightedSum / totalWeight);
  }

  private determineDecision(riskScore: number, riskProfile: RiskProfile): Decision {
    // Adjust thresholds based on risk profile
    const thresholds = {
      'conservative': { approve: 25, caution: 40, reduce: 60 },
      'balanced': { approve: 35, caution: 50, reduce: 70 },
      'aggressive': { approve: 45, caution: 60, reduce: 80 }
    };

    const { approve, caution, reduce } = thresholds[riskProfile];

    if (riskScore <= approve) return 'APPROVE';
    if (riskScore <= caution) return 'CAUTION';
    if (riskScore <= reduce) return 'REDUCE_OR_WAIT';
    return 'BLOCK';
  }

  private generateReasons(risks: Record<string, number>, input: TradeInput, sosoData?: any, sodexData?: any): string[] {
    const reasons: string[] = [];

    if (risks.volatility > 60) {
      reasons.push('High market volatility increases potential losses');
    }
    if (risks.sentiment > 60) {
      reasons.push('Negative market sentiment suggests bearish pressure');
    }
    if (risks.volume > 60) {
      reasons.push('Declining trading volume indicates weak market interest');
    }
    if (risks.trend > 60) {
      reasons.push(`Current trend works against your ${input.action} position`);
    }
    if (risks.liquidity > 60) {
      reasons.push('Low liquidity may cause execution difficulties');
    }
    if (risks.execution > 60) {
      reasons.push('High execution risk due to market conditions');
    }
    if (risks.sector > 60) {
      reasons.push('Sector weakness adds to overall risk');
    }
    if (risks.macro > 60) {
      reasons.push('Macro market conditions are unfavorable');
    }
    if (risks.positionSize > 60) {
      reasons.push('Position size is too large for your risk profile');
    }
    if (risks.holdingPeriod > 60) {
      reasons.push('Short holding period increases timing risk');
    }

    // Add specific warnings from SoDEX execution preview
    if (sodexData?.executionPreview?.warnings) {
      reasons.push(...sodexData.executionPreview.warnings.map((w: string) => `Execution warning: ${w}`));
    }

    // Add specific warnings from SoSoValue risk context
    if (sosoData?.riskContext?.contextualWarnings) {
      reasons.push(...sosoData.riskContext.contextualWarnings.map((w: string) => `Market warning: ${w}`));
    }

    if (reasons.length === 0) {
      reasons.push('Market conditions appear favorable for this trade');
    }

    return reasons;
  }

  private generateSaferAction(decision: Decision, riskScore: number, input: TradeInput): string {
    switch (decision) {
      case 'APPROVE':
        return 'Proceed with the trade as planned';
      case 'CAUTION':
        return 'Consider reducing position size by 25-50% or wait for better entry';
      case 'REDUCE_OR_WAIT':
        return 'Reduce position size by 50-75% or wait for market confirmation';
      case 'BLOCK':
        return 'Avoid this trade - wait for better market conditions';
      default:
        return 'Review market conditions before proceeding';
    }
  }

  private calculateSaferPositionSize(amount: number, riskScore: number, riskProfile: RiskProfile): string {
    if (riskScore <= 25) return 'Current size is appropriate';
    
    const reductionFactor = Math.min(0.8, (riskScore - 25) / 100);
    const saferAmount = amount * (1 - reductionFactor);
    
    return `Consider reducing to $${Math.round(saferAmount).toLocaleString()}`;
  }

  private calculateConfidence(_dataSourcesUsed: string[], sosoData?: any, sodexData?: any): number {
    let confidence = 0.55;

    if (sodexData?.liquidityAnalysis?.marketDepth > 0) {
      confidence += 0.12;
    }

    if (sosoData?.sentiment && sosoData.sentiment.newsCount > 0) {
      confidence += 0.08;
    }

    if (sodexData?.ticker?.volume && parseFloat(sodexData.ticker.volume) > 0) {
      confidence += 0.05;
    }

    if (sodexData?.executionPreview?.warnings?.length > 0) {
      confidence -= sodexData.executionPreview.warnings.length * 0.04;
    }

    return Math.max(0.35, Math.min(1.0, confidence));
  }
}

export const riskEngine = new RiskEngine();