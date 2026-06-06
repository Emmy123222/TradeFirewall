'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RiskFactorsListProps {
  reasons: string[];
  marketFactors: Record<string, number>;
  factorWeights?: Record<string, number>;
  decision?: string;
}

const FACTOR_LABELS: Record<string, string> = {
  volatility: 'Volatility',
  sentiment: 'Sentiment',
  volume: 'Volume',
  trend: 'Trend',
  liquidity: 'Liquidity',
  execution: 'Execution',
  sector: 'Sector',
  macro: 'Macro',
  positionSize: 'Position Size',
  holdingPeriod: 'Holding Period',
};

const FACTOR_DESCRIPTIONS: Record<string, string> = {
  volatility: 'Price swing intensity from recent klines',
  sentiment: 'News & social mood around this asset',
  volume: 'Trading volume vs. recent averages',
  trend: 'Price momentum relative to your trade direction',
  liquidity: 'Order book depth vs. your trade size',
  execution: 'Estimated slippage, fees, and fill probability',
  sector: 'Sector performance and relative strength',
  macro: 'Broad market risk factors and contextual warnings',
  positionSize: 'Your trade size vs. your risk profile threshold',
  holdingPeriod: 'Timing risk amplified by volatility',
};

export function RiskFactorsList({ reasons, marketFactors, factorWeights, decision }: RiskFactorsListProps) {
  const getBadge = (value: number) => {
    if (value >= 70) return { cls: 'bg-danger text-white', label: 'High Risk' };
    if (value >= 50) return { cls: 'bg-orange-risk text-white', label: 'Medium Risk' };
    if (value >= 30) return { cls: 'bg-warning text-background', label: 'Low Risk' };
    return { cls: 'bg-success text-background', label: 'Minimal' };
  };

  const getBarColor = (value: number) => {
    if (value >= 70) return 'bg-danger';
    if (value >= 50) return 'bg-orange-risk';
    if (value >= 30) return 'bg-warning';
    return 'bg-success';
  };

  // Top contributors = factors with score >= 60, sorted descending by weighted impact
  const topContributors = Object.entries(marketFactors)
    .filter(([, v]) => v >= 60)
    .map(([k, v]) => ({ key: k, score: v, weight: factorWeights?.[k] ?? 0, impact: v * (factorWeights?.[k] ?? 0) }))
    .sort((a, b) => b.impact - a.impact);

  const isBlocked = decision === 'BLOCK' || decision === 'REDUCE_OR_WAIT';

  return (
    <div className="space-y-6">
      {/* Why this trade was blocked / reduced callout */}
      {isBlocked && topContributors.length > 0 && (
        <Card className="terminal-card border-danger/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-danger flex items-center gap-2">
              <span className="text-lg">⛔</span>
              {decision === 'BLOCK' ? 'Why this trade is blocked' : 'Why this trade needs reduction'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-text-secondary">
              These factors are driving the decision, ranked by their weighted impact on the score:
            </p>
            <div className="space-y-2">
              {topContributors.slice(0, 4).map(({ key, score, weight }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-danger/5 border border-danger/20 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{FACTOR_LABELS[key] ?? key}</span>
                    <p className="text-xs text-text-secondary mt-0.5">{FACTOR_DESCRIPTIONS[key]}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-sm font-bold text-danger">{score}/100</div>
                    <div className="text-xs text-text-secondary">{Math.round(weight * 100)}% weight</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key risk reasons */}
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-card-heading">Key Risk Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {reasons.map((reason, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-risk rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-body">{reason}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Full factor breakdown with weights and bars */}
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-card-heading">Risk Factor Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(marketFactors)
              .sort((a, b) => {
                const wa = factorWeights?.[a[0]] ?? 0;
                const wb = factorWeights?.[b[0]] ?? 0;
                return wb * b[1] - wa * a[1];
              })
              .map(([factor, value]) => {
                const { cls, label } = getBadge(value);
                const weight = factorWeights?.[factor];
                return (
                  <div key={factor} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{FACTOR_LABELS[factor] ?? factor}</span>
                        {weight !== undefined && (
                          <span className="text-xs text-text-secondary bg-surface px-1.5 py-0.5 rounded">
                            {Math.round(weight * 100)}% weight
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-mono text-xs">{value}/100</span>
                        <Badge className={`${cls} px-2 py-0.5 text-xs rounded`}>{label}</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${getBarColor(value)}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary">{FACTOR_DESCRIPTIONS[factor]}</p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
