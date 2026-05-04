'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TradeInput } from '@/lib/riskEngine';

interface ConfirmationGateProps {
  tradeInput: TradeInput;
  riskScore: number;
  onConfirm: () => void;
  onCancel: () => void;
  onReduceSize: () => void;
}

export function ConfirmationGate({ 
  tradeInput, 
  riskScore, 
  onConfirm, 
  onCancel, 
  onReduceSize 
}: ConfirmationGateProps) {
  const [confirmations, setConfirmations] = useState({
    notAdvice: false,
    understandRisk: false,
    acceptLoss: false,
    stillContinue: false
  });

  const allConfirmed = Object.values(confirmations).every(Boolean);

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
          <span className="text-card-heading">High-Risk Trade Confirmation</span>
          {getRiskBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
          <h3 className="font-medium text-danger mb-2">High Risk Trade Detected</h3>
          <p className="text-body">
            Your proposed {tradeInput.action} of ${tradeInput.amount.toLocaleString()} worth of {tradeInput.symbol} 
            has been flagged as high risk (Score: {riskScore}/100). Please confirm that you understand 
            the potential consequences before proceeding.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-card-heading">Please confirm the following:</h4>
          
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

          <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-surface transition-colors">
            <input
              type="checkbox"
              checked={confirmations.stillContinue}
              onChange={() => handleCheckboxChange('stillContinue')}
              className="mt-1 accent-primary"
            />
            <span className="text-body">
              Despite the high risk score, I still want to proceed with this trade.
            </span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onCancel}
            className="flex-1 btn-secondary"
          >
            Cancel Trade
          </Button>
          
          <Button 
            onClick={onReduceSize}
            className="flex-1 btn-secondary"
          >
            Reduce Size
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                disabled={!allConfirmed}
                className="flex-1 btn-danger"
              >
                Continue Anyway
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="terminal-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-card-heading">Final Confirmation</AlertDialogTitle>
                <AlertDialogDescription className="text-body">
                  You are about to proceed with a high-risk trade. This action cannot be undone. 
                  Are you absolutely sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="btn-secondary">No, Go Back</AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm} className="btn-danger">
                  Yes, Execute Trade
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}