'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Decision, RiskAnalysis } from '@/lib/riskEngine';

interface RiskScoreCardProps {
  riskScore: number;
  decision: Decision;
  confidence: number;
  calibration?: RiskAnalysis['calibration'];
  reliability?: RiskAnalysis['reliability'];
}

export function RiskScoreCard({ riskScore, decision, confidence, calibration, reliability }: RiskScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 76) return 'risk-critical';
    if (score >= 51) return 'risk-high';
    if (score >= 26) return 'risk-medium';
    return 'risk-low';
  };

  const getDecisionBadge = (decision: Decision) => {
    const variants = {
      'APPROVE': 'bg-success text-background',
      'CAUTION': 'bg-warning text-background',
      'REDUCE_OR_WAIT': 'bg-orange-risk text-white',
      'BLOCK': 'bg-danger text-white'
    };

    const labels = {
      'APPROVE': 'APPROVE',
      'CAUTION': 'CAUTION',
      'REDUCE_OR_WAIT': 'REDUCE / WAIT',
      'BLOCK': 'BLOCK'
    };

    return (
      <Badge className={`${variants[decision]} px-4 py-2 text-sm font-medium rounded-lg border-0`}>
        {labels[decision]}
      </Badge>
    );
  };

  const getScoreDescription = (score: number) => {
    if (score >= 76) return 'Critical Risk';
    if (score >= 51) return 'High Risk';
    if (score >= 26) return 'Moderate Risk';
    return 'Low Risk';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-success';
    if (confidence >= 0.6) return 'bg-primary';
    if (confidence >= 0.4) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <Card className="terminal-card w-full">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-card-heading">Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div className="space-y-4">
          <div className={`text-7xl font-bold ${getScoreColor(riskScore)}`}>
            {riskScore}
          </div>
          <div className="text-label">Risk Score out of 100</div>
          <div className={`text-lg font-medium ${getScoreColor(riskScore)}`}>
            {getScoreDescription(riskScore)}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-label">Decision</div>
          {getDecisionBadge(decision)}
        </div>

        <div className="space-y-3">
          <div className="text-label">Analysis Confidence</div>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-32 bg-surface rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getConfidenceColor(confidence)}`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-text-primary min-w-[3rem]">
              {Math.round(confidence * 100)}%
            </span>
          </div>
          {reliability && (
            <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">{reliability.note}</p>
          )}
        </div>

        {calibration && (
          <div className="space-y-1.5 pt-2 border-t border-border text-left">
            <div className="text-label text-center">Calibration</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="text-text-primary font-medium">{calibration.label}</span> band (
              {calibration.scoreRange[0]}-{calibration.scoreRange[1]}): {calibration.typicalCases}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}