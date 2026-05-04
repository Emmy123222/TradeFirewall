// Clipboard utilities for TradeFirewall
import { RiskReportData } from './pdfGenerator';

class ClipboardManager {
  async copyText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or non-HTTPS
        return this.fallbackCopyText(text);
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  }

  private fallbackCopyText(text: string): boolean {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (error) {
      console.error('Fallback copy failed:', error);
      return false;
    }
  }

  generateRiskSummary(reportData: RiskReportData): string {
    const date = new Date(reportData.timestamp).toLocaleDateString();
    
    // Get main risk factors (scores > 60)
    const mainRisks = Object.entries(reportData.riskFactors)
      .filter(([_, score]) => score > 60)
      .map(([factor, _]) => `- ${factor.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
      .slice(0, 5); // Limit to top 5 risks

    return `TradeFirewall Risk Summary

Asset: ${reportData.symbol}
Action: ${reportData.action.toUpperCase()}
Amount: $${reportData.amount.toLocaleString()}
Holding Period: ${this.formatHoldingPeriod(reportData.holdingPeriod)}
Risk Profile: ${reportData.riskProfile.charAt(0).toUpperCase() + reportData.riskProfile.slice(1)}

Risk Score: ${reportData.riskScore}/100
Decision: ${reportData.decision.replace(/_/g, ' ')}

${mainRisks.length > 0 ? `Main Risks:
${mainRisks.join('\n')}` : 'No significant risk factors identified.'}

Recommended Action:
${reportData.recommendedAction}

Generated: ${date}

Disclaimer:
This analysis is for informational purposes only and does not constitute financial advice. All trading involves risk of loss.`;
  }

  private formatHoldingPeriod(period: string): string {
    const periodMap: Record<string, string> = {
      'intraday': 'Intraday',
      '1day': '1 Day',
      '7days': '1 Week',
      '30days': '1 Month'
    };
    return periodMap[period] || period;
  }

  async copyRiskSummary(reportData: RiskReportData): Promise<boolean> {
    const summary = this.generateRiskSummary(reportData);
    return await this.copyText(summary);
  }

  async copyShareLink(reportId: string, baseUrl: string = window.location.origin): Promise<boolean> {
    const shareLink = `${baseUrl}/reports/${reportId}`;
    return await this.copyText(shareLink);
  }

  async copyCodeExample(code: string): Promise<boolean> {
    return await this.copyText(code);
  }
}

export const clipboardManager = new ClipboardManager();