// Risk scoring engine for trade analysis - Real data integration
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
  };
  dataSourcesUsed: string[];
}

class RiskEngine {
  async analyzeTradeRisk(input: TradeInput): Promise<RiskAnalysis> {
    const dataSourcesUsed: string[] = [];
    
    try {
      // Validate symbol exists on SoDEX first
      const symbolExists = await sodexAPI.validateSymbolExists(input.symbol);
      if (!symbolExists) {
        throw new Error(`Symbol ${input.symbol} not found on SoDEX exchange`);
      }

      // Fetch SoSoValue market intelligence data
      let sosoData: any = {};
      let sosoError: string | null = null;
      
      try {
        const [marketSummary, assetTrend, sentiment, volumeData, sectorData, riskContext] = await Promise.all([
          sosoValueAPI.getSoSoMarketSummary(input.symbol),
          sosoValueAPI.getSoSoAssetTrend(input.symbol),
          sosoValueAPI.getSoSoNewsSentiment(input.symbol),
          sosoValueAPI.getSoSoVolumeData(input.symbol),
          sosoValueAPI.getSoSoSectorData(input.symbol),
          sosoValueAPI.getSoSoRiskContext(input.symbol)
        ]);
        
        sosoData = { marketSummary, assetTrend, sentiment, volumeData, sectorData, riskContext };
        dataSourcesUsed.push('SoSoValue Market Intelligence');
      } catch (error) {
        if (error instanceof APIConnectionError) {
          sosoError = error.message;
        } else {
          sosoError = 'SoSoValue market intelligence temporarily unavailable';
        }
      }

      // Fetch SoDEX market microstructure data
      let sodexData: any = {};
      let sodexError: string | null = null;
      
      try {
        const [ticker, orderbook, klines, recentTrades, executionPreview, liquidityAnalysis] = await Promise.all([
          sodexAPI.getSpotTicker(input.symbol),
          sodexAPI.getSpotOrderbook(input.symbol, 100),
          sodexAPI.getSpotKlines(input.symbol, '1h', 24),
          sodexAPI.getSpotTrades(input.symbol, 100),
          sodexAPI.prepareExecutionPreview(input),
          sodexAPI.analyzeLiquidity(input.symbol)
        ]);
        
        sodexData = { ticker, orderbook, klines, recentTrades, executionPreview, liquidityAnalysis };
        dataSourcesUsed.push('SoDEX Market Data');
      } catch (error) {
        sodexError = 'Unable to fetch SoDEX market data';
      }

      // If both APIs fail, we cannot calculate risk
      if (sosoError && sodexError) {
        throw new Error(`Cannot calculate risk score: ${sosoError}. ${sodexError}`);
      }

      // Calculate risk factors using available data
      const riskFactors = this.calculateRiskFactors(input, sosoData, sodexData);
      
      // Combine risk factors with weights
      const riskScore = this.combineRiskFactors(riskFactors);
      
      // Determine decision based on risk score and profile
      const decision = this.determineDecision(riskScore, input.riskProfile);
      
      // Generate reasons and recommendations
      const reasons = this.generateReasons(riskFactors, input, sosoData, sodexData);
      const saferAction = this.generateSaferAction(decision, riskScore, input);
      const suggestedPositionSize = this.calculateSaferPositionSize(input.amount, riskScore, input.riskProfile);
      
      // Calculate confidence based on data availability and quality
      const confidence = this.calculateConfidence(dataSourcesUsed, sosoData, sodexData);

      return {
        riskScore,
        decision,
        reasons,
        saferAction,
        suggestedPositionSize,
        confidence,
        marketFactors: riskFactors,
        dataSourcesUsed
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

  private calculateHoldingPeriodRisk(holdingPeriod: HoldingPeriod, volatilityData: any): number {
    // Shorter periods with high volatility = higher risk
    const periodRiskMap = {
      'intraday': 80,
      '1day': 60,
      '7days': 40,
      '30days': 20
    };

    const baseRisk = periodRiskMap[holdingPeriod];
    const volatilityMultiplier = volatilityData.riskLevel === 'extreme' ? 1.5 :
                                volatilityData.riskLevel === 'high' ? 1.2 :
                                volatilityData.riskLevel === 'medium' ? 1.0 : 0.8;

    return Math.min(100, baseRisk * volatilityMultiplier);
  }

  private combineRiskFactors(factors: Record<string, number>): number {
    // Weighted combination of risk factors
    const weights = {
      volatility: 0.25,
      sentiment: 0.15,
      volume: 0.15,
      trend: 0.20,
      liquidity: 0.10,
      positionSize: 0.10,
      holdingPeriod: 0.05
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(factors).forEach(([factor, value]) => {
      const weight = weights[factor as keyof typeof weights] || 0;
      weightedSum += value * weight;
      totalWeight += weight;
    });

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

  private calculateConfidence(dataSourcesUsed: string[], sosoData?: any, sodexData?: any): number {
    // Base confidence starts at 0.5
    let confidence = 0.5;
    
    // Increase confidence based on available data sources
    if (dataSourcesUsed.includes('SoSoValue Market Intelligence')) {
      confidence += 0.2;
    }
    
    if (dataSourcesUsed.includes('SoDEX Market Data')) {
      confidence += 0.2;
    }
    
    // Increase confidence based on data quality
    if (sodexData?.liquidityAnalysis?.marketDepth > 0) {
      confidence += 0.1;
    }
    
    if (sosoData?.sentiment?.newsCount > 10) {
      confidence += 0.05;
    }
    
    if (sodexData?.ticker?.volume && parseFloat(sodexData.ticker.volume) > 1000) {
      confidence += 0.05;
    }
    
    // Decrease confidence for warnings
    if (sodexData?.executionPreview?.warnings?.length > 0) {
      confidence -= sodexData.executionPreview.warnings.length * 0.05;
    }
    
    return Math.max(0.3, Math.min(1.0, confidence));
  }
}

export const riskEngine = new RiskEngine();