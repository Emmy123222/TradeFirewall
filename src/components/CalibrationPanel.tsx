'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskAnalysis } from '@/lib/riskEngine';

interface CalibrationPanelProps {
  riskScore: number;
  calibration: RiskAnalysis['calibration'];
  reliability: RiskAnalysis['reliability'];
  confidence: number;
}

const RELIABILITY_BADGE: Record<string, string> = {
  high: 'bg-success text-background',
  medium: 'bg-warning text-background',
  low: 'bg-danger text-white',
};

export function CalibrationPanel({ riskScore, calibration, reliability, confidence }: CalibrationPanelProps) {
  return (
    <Card className="terminal-card">
      <CardHeader>
        <CardTitle className="text-card-heading flex items-center justify-between">
          <span>Score Calibration</span>
          <Badge className={`${RELIABILITY_BADGE[reliability.level]} text-xs px-2 py-1`}>
            {reliability.level === 'high' ? 'High' : reliability.level === 'medium' ? 'Medium' : 'Low'} confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-text-secondary uppercase tracking-wide">Score</div>
            <div className="text-2xl font-bold text-text-primary">{riskScore}/100</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase tracking-wide">Band</div>
            <div className="text-2xl font-bold text-text-primary">{calibration.label}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase tracking-wide">Confidence</div>
            <div className="text-2xl font-bold text-text-primary">{Math.round(confidence * 100)}%</div>
          </div>
        </div>

        <div>
          <h4 className="text-label mb-2">Why this band exists</h4>
          <p className="text-body text-sm leading-relaxed">{calibration.whyThreshold}</p>
        </div>

        <div>
          <h4 className="text-label mb-2">What this score historically means</h4>
          <p className="text-body text-sm leading-relaxed">{calibration.typicalCases}</p>
          <p className="text-xs text-text-secondary mt-2">
            See the <a href="/validate" className="text-primary underline-offset-2 hover:underline">validation dashboard</a> for the real backtest counts behind this band.
          </p>
        </div>

        <div>
          <h4 className="text-label mb-2">Known limitations</h4>
          <p className="text-body text-sm leading-relaxed">{calibration.failureMode}</p>
        </div>

        <div className="p-3 bg-surface rounded-lg">
          <p className="text-xs text-text-secondary leading-relaxed">{reliability.note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
