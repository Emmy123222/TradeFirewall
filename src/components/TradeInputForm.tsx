'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeInput } from '@/lib/riskEngine';

interface TradeInputFormProps {
  onSubmit: (tradeInput: TradeInput) => void;
  isLoading?: boolean;
}

export function TradeInputForm({ onSubmit, isLoading = false }: TradeInputFormProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    action: 'buy' as 'buy' | 'sell',
    amount: '',
    holdingPeriod: '7days' as 'intraday' | '1day' | '7days' | '30days',
    riskProfile: 'balanced' as 'conservative' | 'balanced' | 'aggressive',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    onSubmit({
      symbol: formData.symbol.toUpperCase(),
      action: formData.action,
      amount,
      holdingPeriod: formData.holdingPeriod,
      riskProfile: formData.riskProfile,
      notes: formData.notes || undefined
    });
  };

  return (
    <Card className="terminal-card w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-card-heading">Trade Risk Analysis</CardTitle>
        <p className="text-body">Enter your proposed trade details for institutional-grade risk assessment</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-label">Asset Symbol *</label>
              <Input
                placeholder="e.g. BTC, ETH, SOL"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="bg-card border-border text-text-primary placeholder:text-text-muted h-12 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-label">Trade Action *</label>
              <Select value={formData.action} onValueChange={(value: 'buy' | 'sell') => setFormData({ ...formData, action: value })}>
                <SelectTrigger className="bg-card border-border text-text-primary h-12 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="buy" className="text-text-primary hover:bg-surface">Buy</SelectItem>
                  <SelectItem value="sell" className="text-text-primary hover:bg-surface">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-label">Amount (USD) *</label>
              <Input
                type="number"
                placeholder="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-card border-border text-text-primary placeholder:text-text-muted h-12 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-label">Holding Period</label>
              <Select value={formData.holdingPeriod} onValueChange={(value: any) => setFormData({ ...formData, holdingPeriod: value })}>
                <SelectTrigger className="bg-card border-border text-text-primary h-12 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="intraday" className="text-text-primary hover:bg-surface">Intraday</SelectItem>
                  <SelectItem value="1day" className="text-text-primary hover:bg-surface">1 Day</SelectItem>
                  <SelectItem value="7days" className="text-text-primary hover:bg-surface">7 Days</SelectItem>
                  <SelectItem value="30days" className="text-text-primary hover:bg-surface">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-label">Risk Profile</label>
            <Select value={formData.riskProfile} onValueChange={(value: any) => setFormData({ ...formData, riskProfile: value })}>
              <SelectTrigger className="bg-card border-border text-text-primary h-12 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="conservative" className="text-text-primary hover:bg-surface">Conservative</SelectItem>
                <SelectItem value="balanced" className="text-text-primary hover:bg-surface">Balanced</SelectItem>
                <SelectItem value="aggressive" className="text-text-primary hover:bg-surface">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-label">Notes (Optional)</label>
            <Textarea
              placeholder="Why do you want to take this trade?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="bg-card border-border text-text-primary placeholder:text-text-muted rounded-lg resize-none"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full btn-primary h-12 text-base" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                <span>Analyzing Risk...</span>
              </div>
            ) : (
              'Analyze Trade Risk'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}