'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TradeInput, Decision } from '@/lib/riskEngine';

interface ConfirmationGateProps {
  tradeInput: TradeInput;
  riskScore: number;
  decision: Decision;
  onCancel: () => void;
  onReduceSize: () => void;
}

/**
 * Safety rule: BLOCK never reaches execution — no override exists, not even behind
 * checkboxes. REDUCE_OR_WAIT can only proceed by actually reducing size and
 * re-running analysis (onReduceSize), never by confirming through on the same
 * oversized trade. Neither path calls an "execute" callback — this component only
 * ever cancels or redirects into a fresh, smaller analysis.
 */
export function ConfirmationGate({
  tradeInput,
  riskScore,
  decision,
  onCancel,
  onReduceSize
}: ConfirmationGateProps) {
  const [confirmations, setConfirmations] = useState({
    notAdvice: false,
    understandRisk: false,
    acceptLoss: false,
  });

  const allConfirmed = Object.values(confirmations).every(Boolean);
  const isBlocked = decision === 'BLOCK';

  const handleCheckboxChange = (key: keyof typeof confirmations) => {
    setConfirmations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getRiskBadge = () => {
    if (riskScore >= 76) return <Badge className="bg-danger text-white">Critical Risk</Badge>;
    if (riskScore >= 51) return <Badge className="bg-orange-risk text-white">High Risk</Badge>;
    if (riskScore >= 26) return <Badge className="bg-warning text-background">Moderate Risk</Badge>;
    return <Badge className="bg-success text-background">Low Risk</Badge>;
  };

  return (
    <Card className="terminal-card w-full max-w-2xl mx-auto border-danger/30">
      <CardHeader className="bg-danger/5">
        <CardTitle className="flex items-center justify-between">
          <span className="text-card-heading">{isBlocked ? 'Trade Blocked' : 'High-Risk Trade Confirmation'}</span>
          {getRiskBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
          <h3 className="font-medium text-danger mb-2">{isBlocked ? 'This trade cannot proceed to execution' : 'High Risk Trade Detected'}</h3>
          <p className="text-body">
            Your proposed {tradeInput.action} of ${tradeInput.amount.toLocaleString()} worth of {tradeInput.symbol}{' '}
            has been flagged as high risk (Score: {riskScore}/100).{' '}
            {isBlocked
              ? 'BLOCK decisions have no execution override — reduce the position size significantly or wait for market conditions to change, then re-run analysis.'
              : 'This trade cannot execute at its current size. Reduce the position size and re-run analysis to get a fresh decision — there is no way to execute the current oversized trade directly.'}
          </p>
        </div>

        {!isBlocked && (
          <div className="space-y-4">
            <h4 className="text-card-heading">Please confirm you understand, before reducing size:</h4>

            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-surface transition-colors">
              <input
                type="checkbox"
                checked={confirmations.notAdvice}
                onChange={() => handleCheckboxChange('notAdvice')}
                className="mt-1 accent-primary"
              />
              <span className="text-body">
                I understand this analysis is not financial advice and is for informational purposes only.
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-surface transition-colors">
              <input
                type="checkbox"
                checked={confirmations.understandRisk}
                onChange={() => handleCheckboxChange('understandRisk')}
                className="mt-1 accent-primary"
              />
              <span className="text-body">
                I understand the risk factors identified and their potential impact on my trade.
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-surface transition-colors">
              <input
                type="checkbox"
                checked={confirmations.acceptLoss}
                onChange={() => handleCheckboxChange('acceptLoss')}
                className="mt-1 accent-primary"
              />
              <span className="text-body">
                I understand this trade may result in significant losses and I can afford to lose this amount.
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            Cancel Trade
          </Button>

          {!isBlocked && (
            <Button
              onClick={onReduceSize}
              disabled={!allConfirmed}
              className="flex-1 btn-primary"
            >
              Reduce Size &amp; Re-analyze
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}