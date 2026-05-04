'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Decision } from '@/lib/riskEngine';

interface RiskScoreCardProps {
  riskScore: number;
  decision: Decision;
  confidence: number;
}

export function RiskScoreCard({ riskScore, decision, confidence }: RiskScoreCardProps) {
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
        </div>
      </CardContent>
    </Card>
  );
}