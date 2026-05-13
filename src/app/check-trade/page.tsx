'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TradeInputForm } from '@/components/TradeInputForm';
import { RiskScoreCard } from '@/components/RiskScoreCard';
import { RiskFactorsList } from '@/components/RiskFactorsList';
import { RiskExplanationBox } from '@/components/RiskExplanationBox';
import { ConfirmationGate } from '@/components/ConfirmationGate';
import { TradeInput, RiskAnalysis } from '@/lib/riskEngine';
import { RiskExplanation } from '@/lib/riskExplanation';
import { storageManager, WatchlistItem, SavedReport } from '@/lib/storage';
import { pdfGenerator, RiskReportData } from '@/lib/pdfGenerator';
import { toast } from '@/lib/toast';

interface AnalysisResult {
  tradeInput: TradeInput;
  riskAnalysis: RiskAnalysis;
  riskExplanation: RiskExplanation;
  timestamp: number;
  apiStatus?: {
    sosoValueConnected: boolean;
    sodexConnected: boolean;
    sosoValueLabel: string;
    sodexLabel: string;
    lastUpdatedIso: string;
    lastUpdatedDisplay: string;
    dataSourcesUsed: string[];
  };
  dataSourcesReport?: RiskAnalysis['dataSourcesReport'];
}

export default function CheckTradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [currentTrade, setCurrentTrade] = useState<TradeInput | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recentReports, setRecentReports] = useState<SavedReport[]>([]);

  // Load saved data on component mount
  useEffect(() => {
    setWatchlist(storageManager.getWatchlist());
    setRecentReports(storageManager.getReports().slice(0, 5));
  }, []);

  // Refresh data when window gains focus (in case data was changed in another tab)
  useEffect(() => {
    const handleFocus = () => {
      setWatchlist(storageManager.getWatchlist());
      setRecentReports(storageManager.getReports().slice(0, 5));
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleTradeSubmit = async (tradeInput: TradeInput) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setShowConfirmation(false);
    setExecutionResult(null);
    setCurrentTrade(tradeInput);

    try {
      const response = await fetch('/api/analyze-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze trade');
      }

      const result = await response.json();
      setAnalysisResult(result);

      // Show confirmation gate for high-risk trades
      if (result.riskAnalysis.riskScore >= 51) {
        setShowConfirmation(true);
      }

    } catch (error) {
      console.error('Analysis error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Symbol') && error.message.includes('not found')) {
          toast.error('Symbol not found on SoDEX exchange. Please verify the symbol exists.');
        } else if (
          error.message.includes('SOSOVALUE_API_KEY') ||
          error.message.includes('SoSoValue') ||
          error.message.includes('API Key')
        ) {
          toast.error(
            'Live SoSoValue data is not configured. Add SOSOVALUE_API_KEY to .env.local and restart the dev server.'
          );
        } else if (error.message.includes('SoDEX') || error.message.includes('orderbook')) {
          toast.error(`SoDEX data error: ${error.message}`);
        } else if (error.message.includes('Market data is temporarily unavailable')) {
          toast.error('Market data is temporarily unavailable. Please try again later.');
        } else {
          toast.error(`Analysis failed: ${error.message}`);
        }
      } else {
        toast.error('Failed to analyze trade. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTrade = async () => {
    if (!analysisResult) return;

    try {
      const response = await fetch('/api/execute-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: analysisResult.tradeInput.symbol,
          action: analysisResult.tradeInput.action,
          amount: analysisResult.tradeInput.amount,
          confirmed: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute trade');
      }

      const result = await response.json();
      setExecutionResult(result);
      setShowConfirmation(false);
      toast.success('Trade executed successfully in preview mode.');
    } catch (error) {
      console.error('Execution error:', error);
      toast.error('Failed to execute trade. Please try again.');
    }
  };

  const handleReduceSize = () => {
    if (!analysisResult) return;
    
    const reducedAmount = Math.round(analysisResult.tradeInput.amount * 0.5);
    const reducedInput = {
      ...analysisResult.tradeInput,
      amount: reducedAmount,
    };
    
    toast.info(`Trade amount reduced to ${reducedAmount.toLocaleString()} based on risk recommendation.`);
    handleTradeSubmit(reducedInput);
  };

  const handleCancelTrade = () => {
    setShowConfirmation(false);
    toast.info('Trade cancelled.');
    
    // Mark report as cancelled if it was saved
    if (analysisResult) {
      const reports = storageManager.getReports();
      const latestReport = reports[0];
      if (latestReport && latestReport.symbol === analysisResult.tradeInput.symbol) {
        storageManager.updateReportStatus(latestReport.id, 'cancelled');
        // Refresh recent reports state after updating status
        setRecentReports(storageManager.getReports().slice(0, 5));
      }
    }
  };

  // Button functionality implementations
  const handleAddToWatchlist = () => {
    if (!analysisResult) {
      toast.error('Analyze a trade before adding to watchlist.');
      return;
    }
    
    const result = storageManager.addToWatchlist({
      symbol: analysisResult.tradeInput.symbol,
      source: 'risk-report',
      latestRiskScore: analysisResult.riskAnalysis.riskScore,
      latestDecision: analysisResult.riskAnalysis.decision
    });
    
    if (result.success) {
      toast.success(result.message);
      setWatchlist(storageManager.getWatchlist());
    } else {
      toast.info(result.message);
    }
  };

  const handleSaveReport = () => {
    if (!analysisResult) {
      toast.error('Analyze a trade before saving a report.');
      return;
    }
    
    const result = storageManager.saveReport({
      symbol: analysisResult.tradeInput.symbol,
      action: analysisResult.tradeInput.action,
      amount: analysisResult.tradeInput.amount,
      holdingPeriod: analysisResult.tradeInput.holdingPeriod,
      riskProfile: analysisResult.tradeInput.riskProfile,
      riskScore: analysisResult.riskAnalysis.riskScore,
      decision: analysisResult.riskAnalysis.decision,
      riskFactors: analysisResult.riskAnalysis.marketFactors,
      explanation: analysisResult.riskExplanation.summary,
      recommendedAction: analysisResult.riskAnalysis.saferAction,
      suggestedPositionSize: analysisResult.riskAnalysis.suggestedPositionSize,
      dataSourcesUsed: analysisResult.riskAnalysis.dataSourcesUsed,
      dataSourcesReport: analysisResult.riskAnalysis.dataSourcesReport,
    });
    
    if (result.success) {
      toast.success(result.message);
      // Refresh recent reports state immediately after saving
      setRecentReports(storageManager.getReports().slice(0, 5));
    } else {
      toast.error(result.message);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setShowConfirmation(false);
    setExecutionResult(null);
    setCurrentTrade(null);
    toast.info('New analysis started.');
    
    // Focus on the symbol input field
    setTimeout(() => {
      const symbolInput = document.querySelector('input[name="symbol"]') as HTMLInputElement;
      if (symbolInput) {
        symbolInput.focus();
      }
    }, 100);
  };

  const handleViewPreviousReports = () => {
    const reports = storageManager.getReports();
    if (reports.length === 0) {
      toast.info('No saved reports yet. Analyze and save your first trade report.');
    } else {
      router.push('/dashboard#reports');
    }
  };

  const handleDownloadPDF = () => {
    if (!analysisResult) {
      toast.error('Analyze a trade before downloading a PDF.');
      return;
    }
    
    try {
      const reportData: RiskReportData = {
        symbol: analysisResult.tradeInput.symbol,
        action: analysisResult.tradeInput.action,
        amount: analysisResult.tradeInput.amount,
        holdingPeriod: analysisResult.tradeInput.holdingPeriod,
        riskProfile: analysisResult.tradeInput.riskProfile,
        riskScore: analysisResult.riskAnalysis.riskScore,
        decision: analysisResult.riskAnalysis.decision,
        riskFactors: analysisResult.riskAnalysis.marketFactors,
        explanation: analysisResult.riskExplanation.summary,
        recommendedAction: analysisResult.riskAnalysis.saferAction,
        suggestedPositionSize: analysisResult.riskAnalysis.suggestedPositionSize,
        dataSourcesUsed: analysisResult.riskAnalysis.dataSourcesUsed,
        dataSourcesReport: analysisResult.riskAnalysis.dataSourcesReport,
        timestamp: analysisResult.timestamp
      };
      
      pdfGenerator.generateRiskReportPDF(reportData);
      toast.success('PDF report generated. Check your browser for the print dialog.');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Unable to generate PDF. Please try again.');
    }
  };

  const handleCopySummary = async () => {
    if (!analysisResult) {
      toast.error('Analyze a trade before copying summary.');
      return;
    }
    
    try {
      const reportData: RiskReportData = {
        symbol: analysisResult.tradeInput.symbol,
        action: analysisResult.tradeInput.action,
        amount: analysisResult.tradeInput.amount,
        holdingPeriod: analysisResult.tradeInput.holdingPeriod,
        riskProfile: analysisResult.tradeInput.riskProfile,
        riskScore: analysisResult.riskAnalysis.riskScore,
        decision: analysisResult.riskAnalysis.decision,
        riskFactors: analysisResult.riskAnalysis.marketFactors,
        explanation: analysisResult.riskExplanation.summary,
        recommendedAction: analysisResult.riskAnalysis.saferAction,
        suggestedPositionSize: analysisResult.riskAnalysis.suggestedPositionSize,
        dataSourcesUsed: analysisResult.riskAnalysis.dataSourcesUsed,
        dataSourcesReport: analysisResult.riskAnalysis.dataSourcesReport,
        timestamp: analysisResult.timestamp
      };
      
      const summaryText = pdfGenerator.generateSummaryText(reportData);
      const result = await pdfGenerator.copyToClipboard(summaryText);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Unable to copy summary. Please try again.');
    }
  };

  const handleAddAssetToWatchlist = () => {
    const symbol = prompt('Enter asset symbol (e.g., BTC, ETH, SOL):');
    if (symbol && symbol.trim()) {
      const upperSymbol = symbol.trim().toUpperCase();
      
      // Validate symbol format
      if (!/^[A-Z]{2,10}$/.test(upperSymbol)) {
        toast.error('Invalid symbol format. Use uppercase letters only (e.g., BTC, ETH, SOL).');
        return;
      }
      
      const result = storageManager.addToWatchlist({
        symbol: upperSymbol,
        source: 'manual'
      });
      
      if (result.success) {
        toast.success(result.message);
        setWatchlist(storageManager.getWatchlist());
      } else {
        toast.info(result.message);
      }
    }
  };

  const handleRemoveFromWatchlist = (symbolToRemove: string) => {
    const result = storageManager.removeFromWatchlist(symbolToRemove);
    
    if (result.success) {
      toast.success(result.message);
      setWatchlist(storageManager.getWatchlist());
    } else {
      toast.error(result.message);
    }
  };

  const getDecisionBadge = (decision: string) => {
    const variants = {
      'APPROVE': 'bg-success/10 text-success border-success/30',
      'CAUTION': 'bg-warning/10 text-warning border-warning/30',
      'REDUCE_OR_WAIT': 'bg-orange-risk/10 text-orange-risk border-orange-risk/30',
      'BLOCK': 'bg-danger/10 text-danger border-danger/30'
    };
    return variants[decision as keyof typeof variants] || 'bg-surface text-text-primary border-border';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="terminal-navbar sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="logo-text text-xl">
            tradefirewall<span className="logo-underscore">_</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button className="btn-secondary px-4 py-2 text-sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Page Header - Full Width */}
          <div className="col-span-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Trade Risk Engine</h1>
                <p className="text-text-secondary max-w-2xl">
                  Analyze any proposed crypto trade before execution using market data, risk intelligence scoring, and pre-trade safety controls.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleNewAnalysis} className="btn-primary px-6 py-2">New Analysis</Button>
                <Button onClick={handleViewPreviousReports} className="btn-secondary px-6 py-2">View Previous Reports</Button>
              </div>
            </div>
          </div>

          {/* Trade Input Form - Left Column */}
          <div className="col-span-12 lg:col-span-7">
            <TradeInputForm onSubmit={handleTradeSubmit} isLoading={isLoading} />
          </div>

          {/* Live Trade Preview - Right Column */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {currentTrade && (
              <Card className="terminal-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Proposed Trade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-text-secondary">Asset</div>
                      <div className="text-text-primary font-medium">{currentTrade.symbol}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">Action</div>
                      <div className="text-text-primary font-medium capitalize">{currentTrade.action}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">Amount</div>
                      <div className="text-text-primary font-medium">${currentTrade.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">Period</div>
                      <div className="text-text-primary font-medium">{currentTrade.holdingPeriod}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="text-text-secondary">Risk Profile</div>
                    <div className="text-text-primary font-medium capitalize">{currentTrade.riskProfile}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Live integrations proof */}
          {analysisResult && (
            <div className="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="terminal-card border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">API status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={
                        analysisResult.apiStatus?.sosoValueConnected
                          ? 'bg-success/15 text-success border border-success/30'
                          : 'bg-danger/15 text-danger border border-danger/30'
                      }
                    >
                      {analysisResult.apiStatus?.sosoValueLabel || 'SoSoValue'}
                    </Badge>
                    <Badge
                      className={
                        analysisResult.apiStatus?.sodexConnected
                          ? 'bg-success/15 text-success border border-success/30'
                          : 'bg-danger/15 text-danger border border-danger/30'
                      }
                    >
                      {analysisResult.apiStatus?.sodexLabel || 'SoDEX'}
                    </Badge>
                  </div>
                  <div className="text-text-secondary">
                    Last updated:{' '}
                    <span className="text-text-primary font-medium">
                      {analysisResult.apiStatus?.lastUpdatedDisplay ||
                        analysisResult.riskAnalysis.dataSourcesReport.lastUpdatedDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Risk score is computed only after both providers return live payloads for this symbol.
                  </p>
                </CardContent>
              </Card>

              <Card className="terminal-card lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Live market snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-text-secondary text-xs uppercase tracking-wide">SoSoValue price</div>
                      <div className="text-text-primary font-mono text-lg">
                        ${Number(analysisResult.riskAnalysis.liveSnapshot.sosoPrice).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </div>
                      <div className="text-xs text-text-secondary">
                        24h: {Number(analysisResult.riskAnalysis.liveSnapshot.sosoChange24hPct).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs uppercase tracking-wide">SoDEX last</div>
                      <div className="text-text-primary font-mono text-lg">
                        {analysisResult.riskAnalysis.liveSnapshot.sodexLast}
                      </div>
                      <div className="text-xs text-text-secondary">{analysisResult.riskAnalysis.liveSnapshot.sodexSymbol}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs uppercase tracking-wide">Bid / Ask</div>
                      <div className="text-text-primary font-mono">
                        {analysisResult.riskAnalysis.liveSnapshot.sodexBid} / {analysisResult.riskAnalysis.liveSnapshot.sodexAsk}
                      </div>
                      <div className="text-xs text-text-secondary">
                        Spread: {analysisResult.riskAnalysis.liveSnapshot.spreadPercent.toFixed(3)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs uppercase tracking-wide">24h volume (base)</div>
                      <div className="text-text-primary font-mono">{analysisResult.riskAnalysis.liveSnapshot.sodexVolume}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1 lg:col-span-3 terminal-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Data sources used</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-text-secondary">
                  <ul className="list-disc pl-5 space-y-1">
                    {analysisResult.riskAnalysis.dataSourcesReport.lines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                  <div className="grid md:grid-cols-2 gap-4 text-xs font-mono bg-surface/50 p-3 rounded-lg border border-border">
                    <div>
                      <div className="text-text-primary font-sans font-semibold mb-1">SoSoValue endpoints</div>
                      {analysisResult.riskAnalysis.dataSourcesReport.sosoValue.endpoints.map((e) => (
                        <div key={e}>{e}</div>
                      ))}
                    </div>
                    <div>
                      <div className="text-text-primary font-sans font-semibold mb-1">SoDEX endpoints ({analysisResult.riskAnalysis.dataSourcesReport.sodex.network})</div>
                      {analysisResult.riskAnalysis.dataSourcesReport.sodex.endpoints.map((e) => (
                        <div key={e}>{e}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading State - Full Width */}
          {isLoading && (
            <div className="col-span-12">
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-lg text-text-primary">Fetching live market data...</span>
                </div>
                <div className="text-sm text-text-secondary">Calculating risk score...</div>
                <div className="text-sm text-text-secondary">Generating risk explanation...</div>
              </div>
            </div>
          )}

          {/* Risk Score Card - Left */}
          {analysisResult && !showConfirmation && (
            <div className="col-span-12 lg:col-span-4">
              <RiskScoreCard
                riskScore={analysisResult.riskAnalysis.riskScore}
                decision={analysisResult.riskAnalysis.decision}
                confidence={analysisResult.riskAnalysis.confidence}
              />
            </div>
          )}

          {/* Recommended Action - Right */}
          {analysisResult && !showConfirmation && (
            <div className="col-span-12 lg:col-span-8">
              <Card className="terminal-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recommended Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="text-sm font-medium text-text-primary mb-2">
                      {analysisResult.riskAnalysis.saferAction}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {analysisResult.riskAnalysis.suggestedPositionSize}
                    </div>
                  </div>
                  
                  {analysisResult.riskAnalysis.decision === 'APPROVE' && (
                    <Button onClick={handleExecuteTrade} className="w-full btn-primary">
                      Execute Trade
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleAddToWatchlist} className="btn-secondary text-sm">Add to Watchlist</Button>
                    <Button onClick={handleSaveReport} className="btn-secondary text-sm">Save Report</Button>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Dashboard history only includes runs you <strong className="text-text-primary">save</strong> here
                    (stored in this browser). Analyze alone does not add a row to the Dashboard.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleDownloadPDF} className="btn-secondary text-sm">Download PDF</Button>
                    <Button onClick={handleCopySummary} className="btn-secondary text-sm">Copy Summary</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Risk Breakdown - Full Width */}
          {analysisResult && !showConfirmation && (
            <div className="col-span-12">
              <RiskFactorsList
                reasons={analysisResult.riskAnalysis.reasons}
                marketFactors={analysisResult.riskAnalysis.marketFactors}
              />
            </div>
          )}

          {/* Risk Intelligence Explanation - Full Width */}
          {analysisResult && !showConfirmation && (
            <div className="col-span-12">
              <RiskExplanationBox explanation={analysisResult.riskExplanation} />
            </div>
          )}

          {/* Confirmation Gate - Full Width */}
          {showConfirmation && analysisResult && (
            <div className="col-span-12">
              <ConfirmationGate
                tradeInput={analysisResult.tradeInput}
                riskScore={analysisResult.riskAnalysis.riskScore}
                onConfirm={handleExecuteTrade}
                onCancel={handleCancelTrade}
                onReduceSize={handleReduceSize}
              />
            </div>
          )}

          {/* Execution Preview */}
          {executionResult && (
            <div className="col-span-12 lg:col-span-6">
              <Card className="border-success/30 bg-success/5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-success">Execution Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Mode:</span>
                      <span className="text-text-primary">
                        {executionResult.mode === 'preview_only' ? 'Preview only (no chain execution)' : executionResult.mode || 'Preview'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Status:</span>
                      <span className="text-success font-medium">{executionResult.status || 'Preview generated'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Watchlist */}
          {watchlist.length > 0 && (
            <div className="col-span-12 lg:col-span-6">
              <Card className="terminal-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Watchlist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {watchlist.map((item) => (
                    <div key={item.symbol} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{item.symbol}</span>
                        </div>
                        <div>
                          <span className="text-text-primary font-medium">{item.symbol}</span>
                          {item.latestRiskScore && (
                            <div className="text-xs text-text-secondary">Risk: {item.latestRiskScore}/100</div>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleRemoveFromWatchlist(item.symbol)}
                        className="text-xs px-2 py-1 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button onClick={handleAddAssetToWatchlist} className="w-full btn-secondary text-sm">Add Asset</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Reports */}
          {recentReports.length > 0 ? (
            <div className="col-span-12">
              <Card className="terminal-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Recent Risk Checks</CardTitle>
                    <span className="text-sm text-text-secondary">
                      {recentReports.length} of {storageManager.getReports().length} reports
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2">Asset</th>
                          <th className="text-left py-2">Action</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Risk Score</th>
                          <th className="text-left py-2">Decision</th>
                          <th className="text-left py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentReports.map((report) => (
                          <tr key={report.id} className="border-b border-border">
                            <td className="py-2 font-medium">{report.symbol}</td>
                            <td className="py-2 capitalize">{report.action}</td>
                            <td className="py-2">${report.amount.toLocaleString()}</td>
                            <td className="py-2">{report.riskScore}/100</td>
                            <td className="py-2">
                              <Badge className={`${getDecisionBadge(report.decision)} px-2 py-1 text-xs rounded border`}>
                                {report.decision.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-2 text-text-secondary">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : storageManager.getReports().length > 0 ? (
            <div className="col-span-12">
              <Card className="terminal-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Risk Checks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary text-center py-4">
                    You have {storageManager.getReports().length} saved reports. 
                    <Button 
                      onClick={() => setRecentReports(storageManager.getReports().slice(0, 5))}
                      className="ml-2 btn-secondary text-sm px-3 py-1"
                    >
                      Refresh
                    </Button>
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Methodology Note */}
          <div className="col-span-12">
            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Methodology</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  TradeFirewall scores proposed trades using market trend, volatility, sentiment, volume, liquidity, 
                  sector strength, position size, holding period, and user risk profile. The score is designed to help 
                  users understand risk before execution. This analysis is for informational purposes only and is not financial advice.
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}