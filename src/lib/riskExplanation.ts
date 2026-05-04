// Risk intelligence explanation generator for risk analysis
import { RiskAnalysis, TradeInput } from './riskEngine';

export interface RiskExplanation {
  summary: string;
  riskBreakdown: string;
  marketContext: string;
  recommendation: string;
  alternatives: string[];
  disclaimer: string;
}

class RiskExplanationGenerator {
  generateExplanation(riskAnalysis: RiskAnalysis, tradeInput: TradeInput): RiskExplanation {
    const summary = this.generateSummary(riskAnalysis, tradeInput);
    const riskBreakdown = this.generateRiskBreakdown(riskAnalysis);
    const marketContext = this.generateMarketContext(riskAnalysis, tradeInput);
    const recommendation = this.generateRecommendation(riskAnalysis, tradeInput);
    const alternatives = this.generateAlternatives(riskAnalysis, tradeInput);
    const disclaimer = this.generateDisclaimer();

    return {
      summary,
      riskBreakdown,
      marketContext,
      recommendation,
      alternatives,
      disclaimer
    };
  }

  private generateSummary(riskAnalysis: RiskAnalysis, tradeInput: TradeInput): string {
    const { riskScore, decision } = riskAnalysis;
    const { symbol, action, amount } = tradeInput;

    const riskLevel = this.getRiskLevelText(riskScore);
    const actionText = action === 'buy' ? 'buying' : 'selling';
    
    switch (decision) {
      case 'APPROVE':
        return `Your proposed trade of ${actionText} $${amount.toLocaleString()} worth of ${symbol} shows ${riskLevel} risk (${riskScore}/100). Market conditions appear favorable for this position.`;
      
      case 'CAUTION':
        return `Your ${symbol} trade carries ${riskLevel} risk (${riskScore}/100). While not immediately dangerous, several factors suggest proceeding with reduced size or waiting for better conditions.`;
      
      case 'REDUCE_OR_WAIT':
        return `This ${symbol} trade shows ${riskLevel} risk (${riskScore}/100). Multiple risk factors are working against you - consider significantly reducing position size or waiting.`;
      
      case 'BLOCK':
        return `Your proposed ${symbol} trade presents ${riskLevel} risk (${riskScore}/100). Current market conditions strongly suggest avoiding this trade entirely.`;
      
      default:
        return `Unable to fully assess this ${symbol} trade due to data limitations. Proceeding with high caution is recommended.`;
    }
  }

  private generateRiskBreakdown(riskAnalysis: RiskAnalysis): string {
    const { marketFactors } = riskAnalysis;
    const factors: string[] = [];

    if (marketFactors.volatility > 60) {
      factors.push(`High volatility (${marketFactors.volatility}/100) increases potential for sudden price swings`);
    }
    
    if (marketFactors.sentiment > 60) {
      factors.push(`Negative sentiment (${marketFactors.sentiment}/100) suggests bearish market mood`);
    }
    
    if (marketFactors.volume > 60) {
      factors.push(`Weak volume (${marketFactors.volume}/100) indicates reduced market participation`);
    }
    
    if (marketFactors.trend > 60) {
      factors.push(`Unfavorable trend (${marketFactors.trend}/100) works against your position direction`);
    }
    
    if (marketFactors.liquidity > 60) {
      factors.push(`Low liquidity (${marketFactors.liquidity}/100) may cause execution difficulties`);
    }

    if (factors.length === 0) {
      return "Market factors are generally supportive of this trade with manageable risk levels across volatility, sentiment, volume, and liquidity metrics.";
    }

    return `Key risk factors: ${factors.join('; ')}.`;
  }

  private generateMarketContext(riskAnalysis: RiskAnalysis, tradeInput: TradeInput): string {
    const { symbol, holdingPeriod } = tradeInput;
    const { marketFactors } = riskAnalysis;

    const timeframeText = {
      'intraday': 'very short-term',
      '1day': 'short-term',
      '7days': 'medium-term',
      '30days': 'longer-term'
    }[holdingPeriod];

    let context = `For your ${timeframeText} ${symbol} position, `;

    if (marketFactors.volatility > 70) {
      context += "the market is experiencing elevated volatility which amplifies both profit potential and loss risk. ";
    } else if (marketFactors.volatility < 30) {
      context += "market volatility is relatively contained, providing a more stable trading environment. ";
    }

    if (marketFactors.trend > 60) {
      context += "Current price trends are working against your intended position direction. ";
    } else if (marketFactors.trend < 40) {
      context += "Price momentum appears supportive of your trade direction. ";
    }

    if (marketFactors.liquidity > 60) {
      context += "Liquidity concerns may impact your ability to enter or exit at desired prices.";
    } else {
      context += "Market liquidity appears adequate for smooth execution.";
    }

    return context;
  }

  private generateRecommendation(riskAnalysis: RiskAnalysis, tradeInput: TradeInput): string {
    const { decision, saferAction, suggestedPositionSize } = riskAnalysis;
    const { riskProfile } = tradeInput;

    let recommendation = `Based on your ${riskProfile} risk profile, our recommendation is to ${saferAction.toLowerCase()}. `;

    if (decision === 'APPROVE') {
      recommendation += "The trade aligns well with current market conditions and your risk tolerance.";
    } else if (decision === 'CAUTION') {
      recommendation += `${suggestedPositionSize} to better match the current risk environment.`;
    } else if (decision === 'REDUCE_OR_WAIT') {
      recommendation += `${suggestedPositionSize} or wait for more favorable market conditions to develop.`;
    } else {
      recommendation += "Waiting for better market alignment will likely provide superior risk-adjusted opportunities.";
    }

    return recommendation;
  }

  private generateAlternatives(riskAnalysis: RiskAnalysis, tradeInput: TradeInput): string[] {
    const { decision, riskScore } = riskAnalysis;
    const { symbol, action, holdingPeriod } = tradeInput;
    const alternatives: string[] = [];

    if (decision !== 'APPROVE') {
      if (riskScore > 50) {
        alternatives.push("Wait for market volatility to decrease before entering");
        alternatives.push("Consider dollar-cost averaging with smaller, regular purchases");
      }
      
      if (action === 'buy') {
        alternatives.push("Set limit orders below current market price");
        alternatives.push("Consider more established assets like BTC or ETH if trading altcoins");
      }
      
      if (holdingPeriod === 'intraday') {
        alternatives.push("Extend holding period to reduce timing risk");
      }
      
      alternatives.push("Diversify across multiple assets instead of concentrating in one");
      alternatives.push("Use stop-loss orders to limit downside risk");
    } else {
      alternatives.push("Consider taking partial profits if the trade moves in your favor");
      alternatives.push("Set trailing stops to protect gains while allowing for upside");
    }

    return alternatives.slice(0, 3); // Limit to top 3 alternatives
  }

  private generateDisclaimer(): string {
    return "This analysis is for informational purposes only and does not constitute financial advice. Cryptocurrency trading involves substantial risk of loss. Past performance does not guarantee future results. Always conduct your own research and consider consulting with a qualified financial advisor before making investment decisions.";
  }

  private getRiskLevelText(riskScore: number): string {
    if (riskScore >= 76) return "very high";
    if (riskScore >= 51) return "high";
    if (riskScore >= 26) return "moderate";
    return "low";
  }
}

export const riskExplanationGenerator = new RiskExplanationGenerator();