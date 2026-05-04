'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { storageManager } from '@/lib/storage';
import { toast } from '@/lib/toast';

// Types for real data
interface DashboardMetrics {
  averageRiskScore: number | null;
  blockedTrades: number;
  reducedSizeRecommendations: number;
  highRiskAlerts: number;
  simulatedLossesAvoided: number;
  tradesChecked: number;
}

interface TradeCheck {
  id: string;
  time: string;
  asset: string;
  action: string;
  amount: string;
  holdingPeriod: string;
  riskScore: number;
  decision: string;
  recommendedAction: string;
  status: string;
  timestamp: number;
}

interface RiskAlert {
  id: string;
  message: string;
  severity: 'high' | 'medium';
  time: string;
  timestamp: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTradeChecks, setRecentTradeChecks] = useState<TradeCheck[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load real data from localStorage using storageManager
        const savedReports = storageManager.getReports();
        const savedWatchlist = storageManager.getWatchlist();

        if (savedReports.length > 0) {
          setRecentTradeChecks(savedReports.slice(-10).map(report => ({
            id: report.id,
            time: new Date(report.createdAt).toLocaleDateString(),
            asset: report.symbol,
            action: report.action,
            amount: `$${report.amount.toLocaleString()}`,
            holdingPeriod: report.holdingPeriod,
            riskScore: report.riskScore,
            decision: report.decision,
            recommendedAction: report.recommendedAction,
            status: report.status || 'completed',
            timestamp: report.createdAt
          })));
          
          // Calculate real metrics from saved data
          const calculatedMetrics = calculateMetricsFromReports(savedReports);
          setMetrics(calculatedMetrics);
        } else {
          // No data available - show empty state
          setMetrics({
            averageRiskScore: null,
            blockedTrades: 0,
            reducedSizeRecommendations: 0,
            highRiskAlerts: 0,
            simulatedLossesAvoided: 0,
            tradesChecked: 0
          });
        }

        setWatchlist(savedWatchlist);

        // Generate alerts based on recent high-risk reports
        const highRiskReports = savedReports.filter(r => r.riskScore >= 70);
        const generatedAlerts = highRiskReports.slice(0, 5).map(report => ({
          id: `alert_${report.id}`,
          message: `High risk detected for ${report.symbol} trade (${report.riskScore}/100)`,
          severity: report.riskScore >= 85 ? 'high' as const : 'medium' as const,
          time: new Date(report.createdAt).toLocaleDateString(),
          timestamp: report.createdAt
        }));
        setAlerts(generatedAlerts);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateMetricsFromReports = (reports: any[]): DashboardMetrics => {
    if (reports.length === 0) {
      return {
        averageRiskScore: null,
        blockedTrades: 0,
        reducedSizeRecommendations: 0,
        highRiskAlerts: 0,
        simulatedLossesAvoided: 0,
        tradesChecked: 0
      };
    }

    const totalRiskScore = reports.reduce((sum, report) => sum + report.riskScore, 0);
    const averageRiskScore = Math.round(totalRiskScore / reports.length);
    const blockedTrades = reports.filter(report => report.decision === 'BLOCK').length;
    const reducedSizeRecommendations = reports.filter(report => 
      report.recommendedAction.toLowerCase().includes('reduce')
    ).length;
    
    // Estimate losses avoided based on blocked high-risk trades
    const highRiskBlockedTrades = reports.filter(report => 
      report.decision === 'BLOCK' && report.riskScore >= 70
    );
    const simulatedLossesAvoided = highRiskBlockedTrades.reduce((sum, report) => {
      return sum + (report.amount * 0.15); // Estimate 15% loss avoided
    }, 0);

    const highRiskAlerts = reports.filter(report => report.riskScore >= 70).length;

    return {
      averageRiskScore,
      blockedTrades,
      reducedSizeRecommendations,
      highRiskAlerts,
      simulatedLossesAvoided: Math.round(simulatedLossesAvoided),
      tradesChecked: reports.length
    };
  };

  const getDecisionBadge = (decision: string) => {
    const variants = {
      'APPROVE': 'bg-success text-background',
      'CAUTION': 'bg-warning text-background',
      'REDUCE_OR_WAIT': 'bg-orange-risk text-white',
      'BLOCK': 'bg-danger text-white',
      'Approve': 'bg-success text-background',
      'Caution': 'bg-warning text-background',
      'Block': 'bg-danger text-white'
    };
    return variants[decision as keyof typeof variants] || 'bg-surface text-text-primary';
  };
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="terminal-navbar sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <Link href="/" className="logo-text text-xl">
              tradefirewall<span className="logo-underscore">_</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/check-trade">
                <Button className="btn-primary px-4 py-2 text-sm">Check New Trade</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-body">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="terminal-navbar sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <Link href="/" className="logo-text text-xl">
              tradefirewall<span className="logo-underscore">_</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/check-trade">
                <Button className="btn-primary px-4 py-2 text-sm">Check New Trade</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-danger text-xl">⚠</span>
            </div>
            <h1 className="text-section-heading mb-4">Dashboard Error</h1>
            <p className="text-body mb-8">{error}</p>
            <Button onClick={() => window.location.reload()} className="btn-primary px-8 py-3">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no trade history
  if (!metrics || metrics.tradesChecked === 0) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="terminal-navbar sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <Link href="/" className="logo-text text-xl">
              tradefirewall<span className="logo-underscore">_</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/check-trade">
                <Button className="btn-primary px-4 py-2 text-sm">Check New Trade</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-8">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary text-xl">📊</span>
              </div>
            </div>
            <h1 className="text-section-heading mb-4">No trade checks yet</h1>
            <p className="text-body mb-8 max-w-md mx-auto">
              Start by analyzing your first trade in the Trade Risk Engine to see your dashboard come to life.
            </p>
            <Link href="/check-trade">
              <Button className="btn-primary px-8 py-3 text-base">
                Check Your First Trade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="terminal-navbar sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="logo-text text-xl">
            tradefirewall<span className="logo-underscore">_</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/check-trade">
              <Button className="btn-primary px-4 py-2 text-sm">Check New Trade</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* SECTION 1: Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
          <div>
            <h1 className="text-section-heading mb-2">Trading Dashboard</h1>
            <p className="text-body max-w-2xl">
              Monitor your trade checks, portfolio risk, alerts, and market conditions in one place.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/check-trade">
              <Button className="btn-primary px-6 py-2">Check New Trade</Button>
            </Link>
            <Button 
              className="btn-secondary px-6 py-2"
              onClick={() => {
                const data = storageManager.exportData();
                if (data) {
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `tradefirewall-reports-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success('Reports exported successfully.');
                } else {
                  toast.error('No data to export.');
                }
              }}
            >
              Export Reports
            </Button>
            <Button 
              className="btn-secondary px-6 py-2"
              onClick={() => {
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
              }}
            >
              Add Watchlist Asset
            </Button>
          </div>
        </div>

        {/* SECTION 2: Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <Card className="terminal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-label">Average Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {metrics.averageRiskScore ? `${metrics.averageRiskScore}/100` : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="terminal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-label">Blocked Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-danger">{metrics.blockedTrades}</div>
            </CardContent>
          </Card>

          <Card className="terminal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-label">Reduced Size Rec.</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{metrics.reducedSizeRecommendations}</div>
            </CardContent>
          </Card>

          <Card className="terminal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-label">High-Risk Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-risk">{metrics.highRiskAlerts}</div>
            </CardContent>
          </Card>

          <Card className="terminal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-label">Losses Avoided</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {metrics.simulatedLossesAvoided > 0 ? `$${metrics.simulatedLossesAvoided.toLocaleString()}` : '$0'}
              </div>
            </CardContent>
          </Card>

          <Card className="terminal-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-label">Trades Checked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{metrics.tradesChecked}</div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: Trade Analysis Summary - Only show if we have real data */}
        {recentTradeChecks.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Trade Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-label">Total Analyses</div>
                    <div className="text-lg font-medium text-text-primary">{metrics.tradesChecked}</div>
                  </div>
                  <div>
                    <div className="text-label">Avg Risk Score</div>
                    <div className="text-lg font-medium text-text-primary">
                      {metrics.averageRiskScore ? `${metrics.averageRiskScore}/100` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-label">Blocked Trades</div>
                    <div className="text-lg font-medium text-danger">{metrics.blockedTrades}</div>
                  </div>
                  <div>
                    <div className="text-label">Est. Losses Avoided</div>
                    <div className="text-lg font-medium text-success">
                      ${metrics.simulatedLossesAvoided.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-text-secondary mb-4">
                  Based on your {metrics.tradesChecked} trade analyses
                </div>
                <div className="space-y-3">
                  {(() => {
                    const lowRisk = recentTradeChecks.filter(t => t.riskScore <= 25).length;
                    const mediumRisk = recentTradeChecks.filter(t => t.riskScore > 25 && t.riskScore <= 50).length;
                    const highRisk = recentTradeChecks.filter(t => t.riskScore > 50 && t.riskScore <= 75).length;
                    const criticalRisk = recentTradeChecks.filter(t => t.riskScore > 75).length;
                    const total = recentTradeChecks.length;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-body">Low Risk (0-25)</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-surface rounded-full h-2">
                              <div className="bg-success h-2 rounded-full" style={{ width: `${(lowRisk / total) * 100}%` }}></div>
                            </div>
                            <span className="text-sm text-text-primary min-w-[3ch]">{Math.round((lowRisk / total) * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-body">Medium Risk (26-50)</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-surface rounded-full h-2">
                              <div className="bg-warning h-2 rounded-full" style={{ width: `${(mediumRisk / total) * 100}%` }}></div>
                            </div>
                            <span className="text-sm text-text-primary min-w-[3ch]">{Math.round((mediumRisk / total) * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-body">High Risk (51-75)</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-surface rounded-full h-2">
                              <div className="bg-orange-risk h-2 rounded-full" style={{ width: `${(highRisk / total) * 100}%` }}></div>
                            </div>
                            <span className="text-sm text-text-primary min-w-[3ch]">{Math.round((highRisk / total) * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-body">Critical Risk (76-100)</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-surface rounded-full h-2">
                              <div className="bg-danger h-2 rounded-full" style={{ width: `${(criticalRisk / total) * 100}%` }}></div>
                            </div>
                            <span className="text-sm text-text-primary min-w-[3ch]">{Math.round((criticalRisk / total) * 100)}%</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* SECTION 4: Watchlist - Only show if user has added assets */}
        {watchlist.length > 0 && (
          <Card className="terminal-card mb-12">
            <CardHeader>
              <CardTitle className="text-card-heading">Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {watchlist.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
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
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-text-secondary">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </div>
                      <Button 
                        onClick={() => {
                          const result = storageManager.removeFromWatchlist(item.symbol);
                          if (result.success) {
                            toast.success(result.message);
                            setWatchlist(storageManager.getWatchlist());
                          } else {
                            toast.error(result.message);
                          }
                        }}
                        className="text-xs px-2 py-1 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              <Button 
                className="w-full btn-secondary text-sm"
                onClick={() => {
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
                }}
              >
                Add Asset
              </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 5: Recent Trade Checks - Only show if user has trade history */}
        {recentTradeChecks.length > 0 && (
          <Card className="terminal-card mb-12">
            <CardHeader>
              <CardTitle className="text-card-heading">Recent Trade Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="terminal-table">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Time</th>
                      <th className="text-left">Asset</th>
                      <th className="text-left">Action</th>
                      <th className="text-left">Amount</th>
                      <th className="text-left">Holding Period</th>
                      <th className="text-left">Risk Score</th>
                      <th className="text-left">Decision</th>
                      <th className="text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTradeChecks.map((check, index) => (
                      <tr key={index}>
                        <td className="text-text-secondary">{check.time}</td>
                        <td className="text-text-primary font-medium">{check.asset}</td>
                        <td className="text-text-secondary capitalize">{check.action}</td>
                        <td className="text-text-secondary">{check.amount}</td>
                        <td className="text-text-secondary">{check.holdingPeriod}</td>
                        <td className="text-text-primary">{check.riskScore}/100</td>
                        <td>
                          <Badge className={`${getDecisionBadge(check.decision)} px-2 py-1 text-xs rounded`}>
                            {check.decision}
                          </Badge>
                        </td>
                        <td className="text-text-secondary">{check.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 6: High-Risk Alerts - Only show if there are real alerts */}
        {alerts.length > 0 && (
          <Card className="terminal-card mb-12">
            <CardHeader>
              <CardTitle className="text-card-heading">Risk Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.severity === 'high' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        alert.severity === 'high' ? 'text-danger' : 'text-warning'
                      }`}>
                        {alert.message}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">{alert.time}</div>
                    </div>
                    <Badge className={`${
                      alert.severity === 'high' ? 'bg-danger text-white' : 'bg-warning text-background'
                    } text-xs`}>
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* SECTION 10: Recommended Next Actions */}
        <Card className="terminal-card mb-12">
          <CardHeader>
            <CardTitle className="text-card-heading">Recommended Next Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/check-trade">
                <Button className="w-full btn-primary">
                  Check a new trade
                </Button>
              </Link>
              <Button className="w-full btn-secondary">
                Export risk report
              </Button>
              <Button className="w-full btn-secondary">
                Configure API keys
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}