'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RiskFactorsListProps {
  reasons: string[];
  marketFactors: Record<string, number>;
}

export function RiskFactorsList({ reasons, marketFactors }: RiskFactorsListProps) {
  const getFactorColor = (value: number) => {
    if (value >= 70) return 'risk-critical';
    if (value >= 50) return 'risk-high';
    if (value >= 30) return 'risk-medium';
    return 'risk-low';
  };

  const getFactorLabel = (value: number) => {
    if (value >= 70) return 'High Risk';
    if (value >= 50) return 'Medium Risk';
    if (value >= 30) return 'Low Risk';
    return 'Very Low Risk';
  };

  const getFactorBadge = (value: number) => {
    if (value >= 70) return 'bg-danger text-white';
    if (value >= 50) return 'bg-orange-risk text-white';
    if (value >= 30) return 'bg-warning text-background';
    return 'bg-success text-background';
  };

  return (
    <div className="space-y-6">
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

      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-card-heading">Market Factor Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="terminal-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Factor</th>
                  <th className="text-left">Score</th>
                  <th className="text-left">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(marketFactors).map(([factor, value]) => (
                  <tr key={factor}>
                    <td className="text-text-secondary capitalize">
                      {factor === 'liquidity'
                        ? 'Liquidity Risk'
                        : factor === 'holdingPeriod'
                          ? 'Holding period'
                          : factor === 'positionSize'
                            ? 'Position size'
                            : `${factor} Risk`}
                    </td>
                    <td className="text-text-primary font-medium">{value}/100</td>
                    <td>
                      <Badge className={`${getFactorBadge(value)} px-2 py-1 text-xs rounded`}>
                        {getFactorLabel(value)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}