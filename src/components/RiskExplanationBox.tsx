'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskExplanation } from '@/lib/riskExplanation';

interface RiskExplanationBoxProps {
  explanation: RiskExplanation;
}

export function RiskExplanationBox({ explanation }: RiskExplanationBoxProps) {
  return (
    <div className="space-y-6">
      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-card-heading">Risk Intelligence Explanation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-label mb-3">Summary</h4>
            <p className="text-body leading-relaxed">{explanation.summary}</p>
          </div>

          <div>
            <h4 className="text-label mb-3">Risk Breakdown</h4>
            <p className="text-body leading-relaxed">{explanation.riskBreakdown}</p>
          </div>

          <div>
            <h4 className="text-label mb-3">Market Context</h4>
            <p className="text-body leading-relaxed">{explanation.marketContext}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="terminal-card">
        <CardHeader>
          <CardTitle className="text-card-heading">Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-body leading-relaxed">{explanation.recommendation}</p>
          
          {explanation.alternatives.length > 0 && (
            <div>
              <h4 className="text-label mb-4">Safer Alternatives</h4>
              <div className="space-y-3">
                {explanation.alternatives.map((alternative: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-surface rounded-lg">
                    <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                    </div>
                    <span className="text-body leading-relaxed">{alternative}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="terminal-card border-warning/30">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-warning text-sm">⚠</span>
            </div>
            <div>
              <Badge variant="outline" className="text-warning border-warning/50 mb-3 text-xs">
                Important Disclaimer
              </Badge>
              <p className="text-xs text-text-secondary leading-relaxed">{explanation.disclaimer}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}