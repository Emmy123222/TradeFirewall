// PDF generation utility for TradeFirewall risk reports
import { SavedReport } from './storage';

export interface RiskReportData {
  symbol: string;
  action: string;
  amount: number;
  holdingPeriod: string;
  riskProfile: string;
  riskScore: number;
  decision: string;
  riskFactors: any;
  explanation: string;
  recommendedAction: string;
  suggestedPositionSize: string;
  dataSourcesUsed: string[];
  timestamp: number;
}

class PDFGenerator {
  generateRiskReportPDF(reportData: RiskReportData): void {
    try {
      // Create PDF content as HTML string
      const htmlContent = this.generateHTMLContent(reportData);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups.');
      }

      // Write HTML content to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        // Close window after printing (optional)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Unable to generate PDF. Please try again.');
    }
  }

  private generateHTMLContent(data: RiskReportData): string {
    const date = new Date(data.timestamp).toLocaleDateString();
    const fileName = `tradefirewall-risk-report-${data.symbol}-${new Date().toISOString().split('T')[0]}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${fileName}</title>
    <style>
        @media print {
            @page {
                margin: 1in;
                size: A4;
            }
            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .report-title {
            font-size: 20px;
            color: #374151;
            margin: 0;
        }
        
        .report-date {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
            border-left: 4px solid #3b82f6;
            padding-left: 12px;
        }
        
        .trade-details {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .detail-label {
            font-weight: 500;
            color: #374151;
        }
        
        .detail-value {
            color: #1f2937;
        }
        
        .risk-score {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .risk-score.low {
            background: #dcfce7;
            border: 2px solid #16a34a;
        }
        
        .risk-score.medium {
            background: #fef3c7;
            border: 2px solid #d97706;
        }
        
        .risk-score.high {
            background: #fee2e2;
            border: 2px solid #dc2626;
        }
        
        .risk-score-number {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .risk-decision {
            font-size: 18px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .risk-factors {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
        }
        
        .factor-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .factor-item:last-child {
            border-bottom: none;
        }
        
        .explanation {
            background: #eff6ff;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .recommended-action {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #16a34a;
        }
        
        .data-sources {
            font-size: 14px;
            color: #6b7280;
            margin-top: 20px;
        }
        
        .disclaimer {
            background: #fef2f2;
            border: 1px solid #fecaca;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
            font-size: 14px;
            color: #991b1b;
        }
        
        .disclaimer-title {
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">TradeFirewall</div>
        <h1 class="report-title">Trade Risk Statement</h1>
        <div class="report-date">Generated on ${date}</div>
    </div>

    <div class="section">
        <h2 class="section-title">Trade Details</h2>
        <div class="trade-details">
            <div class="detail-row">
                <span class="detail-label">Asset:</span>
                <span class="detail-value">${data.symbol}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Action:</span>
                <span class="detail-value">${data.action.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">$${data.amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Holding Period:</span>
                <span class="detail-value">${data.holdingPeriod}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Risk Profile:</span>
                <span class="detail-value">${data.riskProfile}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Risk Assessment</h2>
        <div class="risk-score ${this.getRiskScoreClass(data.riskScore)}">
            <div class="risk-score-number">${data.riskScore}/100</div>
            <div class="risk-decision">${data.decision.replace('_', ' ')}</div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Risk Factors Breakdown</h2>
        <div class="risk-factors">
            ${this.generateRiskFactorsHTML(data.riskFactors)}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Risk Explanation</h2>
        <div class="explanation">
            ${data.explanation}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Recommended Action</h2>
        <div class="recommended-action">
            <strong>${data.recommendedAction}</strong>
            ${data.suggestedPositionSize ? `<br><br>Suggested Position Size: ${data.suggestedPositionSize}` : ''}
        </div>
    </div>

    <div class="data-sources">
        <strong>Data Sources:</strong> ${data.dataSourcesUsed.join(', ')}
    </div>

    <div class="disclaimer">
        <div class="disclaimer-title">Important Disclaimer</div>
        This risk assessment is for informational purposes only and does not constitute financial advice. 
        Trading involves substantial risk of loss and is not suitable for all investors. 
        Past performance does not guarantee future results. 
        Please consult with a qualified financial advisor before making investment decisions.
    </div>

    <div class="footer">
        TradeFirewall Risk Report • ${fileName} • Generated ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
  }

  private getRiskScoreClass(score: number): string {
    if (score <= 35) return 'low';
    if (score <= 65) return 'medium';
    return 'high';
  }

  private generateRiskFactorsHTML(riskFactors: any): string {
    if (!riskFactors || typeof riskFactors !== 'object') {
      return '<div class="factor-item"><span>Risk factors data not available</span></div>';
    }

    return Object.entries(riskFactors)
      .map(([factor, value]) => {
        const displayName = factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const riskLevel = this.getRiskLevel(Number(value));
        return `
          <div class="factor-item">
            <span class="detail-label">${displayName}:</span>
            <span class="detail-value">${riskLevel} (${value})</span>
          </div>
        `;
      })
      .join('');
  }

  private getRiskLevel(score: number): string {
    if (score <= 25) return 'Low Risk';
    if (score <= 50) return 'Medium Risk';
    if (score <= 75) return 'High Risk';
    return 'Extreme Risk';
  }

  // Generate summary text for copying
  generateSummaryText(data: RiskReportData): string {
    const date = new Date(data.timestamp).toLocaleDateString();
    
    return `TradeFirewall Risk Summary

Asset: ${data.symbol}
Action: ${data.action.toUpperCase()}
Amount: $${data.amount.toLocaleString()}
Holding Period: ${data.holdingPeriod}
Risk Profile: ${data.riskProfile}

Risk Score: ${data.riskScore}/100
Decision: ${data.decision.replace('_', ' ')}

Risk Explanation:
${data.explanation}

Recommended Action:
${data.recommendedAction}

${data.suggestedPositionSize ? `Suggested Position Size: ${data.suggestedPositionSize}\n` : ''}
Data Sources: ${data.dataSourcesUsed.join(', ')}
Generated: ${date}

Disclaimer:
This analysis is for informational purposes only and does not constitute financial advice. Trading involves substantial risk of loss.`;
  }

  // Copy text to clipboard
  async copyToClipboard(text: string): Promise<{ success: boolean; message: string }> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return { success: true, message: 'Risk summary copied.' };
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          return { success: true, message: 'Risk summary copied.' };
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return { success: false, message: 'Unable to copy summary. Please try again.' };
    }
  }
}

export const pdfGenerator = new PDFGenerator();