'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TradeInput, Decision } from '@/lib/riskEngine';
import { toast } from '@/lib/toast';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

// MetaMask (and most EIP-1193 wallets) validate that eth_signTypedData_v4's
// domain.chainId matches the wallet's currently active network before signing —
// so the wallet must actually be switched to SoDEX's chain, not just informed of
// it via the typed data. Verified live: testnet.valuechain.xyz returns chainId
// 0x21d45 (138565), matching SODEX_TESTNET_CHAIN_ID.
const VALUECHAIN_TESTNET_PARAMS = {
  chainId: '0x21d45',
  chainName: 'ValueChain Testnet',
  nativeCurrency: { name: 'SOSO', symbol: 'SOSO', decimals: 18 },
  rpcUrls: ['https://testnet.valuechain.xyz'],
  blockExplorerUrls: ['https://test-scan.valuechain.xyz'],
};

async function ensureSodexTestnetChain(): Promise<void> {
  if (!window.ethereum) throw new Error('No injected wallet found');
  const currentChainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
  if (currentChainId.toLowerCase() === VALUECHAIN_TESTNET_PARAMS.chainId) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: VALUECHAIN_TESTNET_PARAMS.chainId }],
    });
  } catch (switchError) {
    const code = (switchError as { code?: number })?.code;
    if (code === 4902) {
      // Chain not yet known to the wallet — add it, which also switches to it.
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [VALUECHAIN_TESTNET_PARAMS],
      });
    } else {
      throw switchError;
    }
  }
}

interface SoDEXOrderPlacementProps {
  tradeInput: TradeInput;
  riskScore: number;
  decision: Decision;
}

interface ExecutionPreviewData {
  estimatedPrice: number;
  estimatedSlippage: number;
  priceImpact: number;
  executionProbability: number;
  warnings: string[];
}

interface PreparedOrder {
  typedData: Record<string, unknown>;
  nonce: number;
  orderParams: Record<string, unknown>;
  preview: {
    symbol: string;
    side: string;
    quantity: string;
    protectionPrice: string;
    estimatedNotionalUsd: number;
    currentBid: number;
    currentAsk: number;
    slippagePct: number;
    orderType: string;
    timeInForce: string;
    network: string;
  };
}

interface OrderResult {
  success: boolean;
  orderID: number | null;
  clOrdID: string;
  error?: string;
  network: string;
  timestamp: number;
}

type Stage = 'idle' | 'connecting' | 'connected' | 'preparing' | 'ready' | 'signing' | 'submitting' | 'done' | 'error';

export function SoDEXOrderPlacement({ tradeInput, riskScore, decision }: SoDEXOrderPlacementProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [executionPreview, setExecutionPreview] = useState<ExecutionPreviewData | null>(null);
  const [prepared, setPrepared] = useState<PreparedOrder | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [maxSlippagePct, setMaxSlippagePct] = useState(1);

  const canExecute = decision === 'APPROVE' || decision === 'CAUTION';

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('No injected wallet found. Install MetaMask or another EIP-1193 wallet to place a testnet order.');
      return;
    }
    setStage('connecting');
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts?.[0];
      if (!address) throw new Error('No wallet account returned');

      await ensureSodexTestnetChain();

      setWalletAddress(address);
      setStage('connected');

      const previewRes = await fetch('/api/execution-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: tradeInput.symbol, action: tradeInput.action, amount: tradeInput.amount }),
      });
      const previewJson = await previewRes.json();
      if (previewRes.ok) {
        setExecutionPreview(previewJson);
      }
    } catch (error) {
      setStage('idle');
      toast.error(error instanceof Error ? error.message : 'Wallet connection failed');
    }
  };

  const prepareOrder = async () => {
    if (!walletAddress) return;
    setStage('preparing');
    setErrorMessage(null);
    setErrorType(null);
    try {
      const res = await fetch('/api/sodex/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prepare',
          symbol: tradeInput.symbol,
          side: tradeInput.action,
          amountUsd: tradeInput.amount,
          walletAddress,
          maxSlippagePct: maxSlippagePct / 100,
          decision,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorType(json.errorType ?? null);
        throw new Error(json.error || 'Failed to prepare order');
      }
      setPrepared(json);
      setStage('ready');
    } catch (error) {
      setStage('connected');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to prepare order');
    }
  };

  const signAndSubmit = async () => {
    if (!prepared || !walletAddress || !window.ethereum) return;
    setStage('signing');
    setErrorMessage(null);
    setErrorType(null);
    try {
      // Defensive re-check — the user may have switched networks in their wallet
      // since connecting, and a stale chain would make the signature invalid.
      await ensureSodexTestnetChain();

      const signature = (await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [walletAddress, JSON.stringify(prepared.typedData)],
      })) as string;

      setStage('submitting');
      const res = await fetch('/api/sodex/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          orderParams: prepared.orderParams,
          nonce: prepared.nonce,
          signature,
          walletAddress,
        }),
      });
      const json = await res.json();
      setResult(json);
      setStage(json.success ? 'done' : 'error');
      if (!json.success) setErrorMessage(json.error || 'Order rejected by SoDEX');
    } catch (error) {
      setStage('ready');
      setErrorMessage(error instanceof Error ? error.message : 'Signing was cancelled or failed');
    }
  };

  if (!canExecute) {
    return (
      <Card className="terminal-card border-border">
        <CardContent className="pt-6 text-sm text-text-secondary">
          Execution is not available for {decision.replace('_', ' / ')} trades. {decision === 'BLOCK' ? 'This trade cannot proceed to execution.' : 'Reduce the position size and re-run analysis to unlock execution.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="terminal-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-card-heading flex items-center justify-between">
          <span>SoDEX Testnet Execution</span>
          <Badge variant="outline" className="text-xs border-primary/40 text-primary">Testnet — no real funds</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {stage === 'idle' && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Connect a wallet to place a real signed order on SoDEX testnet. No wallet is required to analyze risk — only to execute.
            </p>
            <Button onClick={connectWallet} className="btn-primary w-full">Connect Wallet</Button>
          </div>
        )}

        {stage === 'connecting' && (
          <p className="text-sm text-text-secondary">
            Requesting wallet connection… Your wallet may also ask to add or switch to the &ldquo;ValueChain Testnet&rdquo; network — this is required to sign SoDEX orders correctly.
          </p>
        )}

        {(stage === 'connected' || stage === 'preparing') && walletAddress && (
          <div className="space-y-4">
            <div className="text-xs text-text-secondary font-mono">Connected: {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</div>

            {executionPreview && (
              <div className="p-3 bg-surface rounded-lg text-xs text-text-secondary space-y-1">
                <div className="text-text-primary font-medium mb-1">Execution Preview (SoDEX testnet, live)</div>
                <div>Estimated price: ${executionPreview.estimatedPrice.toLocaleString()}</div>
                <div>Estimated slippage: {(executionPreview.estimatedSlippage * 100).toFixed(2)}%</div>
                <div>Price impact: {(executionPreview.priceImpact * 100).toFixed(2)}%</div>
                <div>Execution probability: {Math.round(executionPreview.executionProbability * 100)}%</div>
                {executionPreview.warnings.length > 0 && (
                  <div className="text-warning">{executionPreview.warnings.join(' · ')}</div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary">Max slippage protection: {maxSlippagePct.toFixed(1)}%</label>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={maxSlippagePct}
                onChange={(e) => setMaxSlippagePct(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {errorMessage && (
              <div className="text-xs text-danger space-y-1">
                <p>{errorMessage}</p>
                {errorType === 'NOT_ONBOARDED' && (
                  <a
                    href="https://testnet.sodex.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline inline-block"
                  >
                    Open SoDEX Testnet to connect this wallet and claim faucet funds →
                  </a>
                )}
              </div>
            )}

            <Button onClick={prepareOrder} disabled={stage === 'preparing'} className="btn-primary w-full">
              {stage === 'preparing' ? 'Preparing order…' : 'Review Order'}
            </Button>
          </div>
        )}

        {(stage === 'ready' || stage === 'signing' || stage === 'submitting') && prepared && (
          <div className="space-y-4">
            <div className="p-4 bg-surface rounded-lg space-y-2 text-sm">
              <div className="text-text-primary font-medium mb-1">Order Ticket — review before signing</div>
              <Row label="Symbol" value={prepared.preview.symbol} />
              <Row label="Side" value={prepared.preview.side} />
              <Row label="Order Type / TIF" value={`${prepared.preview.orderType} / ${prepared.preview.timeInForce}`} />
              <Row label="Quantity" value={prepared.preview.quantity} />
              <Row label="Protection Price" value={`$${prepared.preview.protectionPrice}`} />
              <Row label="Max Slippage" value={`${(prepared.preview.slippagePct * 100).toFixed(1)}%`} />
              <Row label="Estimated Notional" value={`$${prepared.preview.estimatedNotionalUsd.toLocaleString()}`} />
              <Row label="Network" value="SoDEX Testnet" />
              <Row label="Risk Score / Decision" value={`${riskScore}/100 — ${decision}`} />
            </div>

            {errorMessage && <p className="text-xs text-danger">{errorMessage}</p>}

            <Button onClick={signAndSubmit} disabled={stage !== 'ready'} className="btn-primary w-full">
              {stage === 'signing' ? 'Waiting for wallet signature…' : stage === 'submitting' ? 'Submitting to SoDEX testnet…' : 'Sign & Place Order'}
            </Button>
          </div>
        )}

        {(stage === 'done' || stage === 'error') && result && (
          <div className={`p-4 rounded-lg space-y-2 text-sm ${result.success ? 'bg-success/5 border border-success/30' : 'bg-danger/5 border border-danger/30'}`}>
            <div className={`font-medium ${result.success ? 'text-success' : 'text-danger'}`}>
              {result.success ? 'Order placed on SoDEX Testnet' : 'Order failed'}
            </div>
            <Row label="Order ID" value={result.orderID ? String(result.orderID) : '—'} />
            <Row label="Client Order ID" value={result.clOrdID} />
            <Row label="Submitted size" value={prepared?.preview.quantity ?? '—'} />
            <Row label="Protection price" value={prepared ? `$${prepared.preview.protectionPrice}` : '—'} />
            <Row label="Risk score at execution" value={`${riskScore}/100 — ${decision}`} />
            <Row label="Timestamp" value={new Date(result.timestamp).toLocaleString()} />
            <Row label="Network" value="SoDEX Testnet" />
            {!result.success && result.error && <p className="text-xs text-danger">{result.error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-mono text-xs">{value}</span>
    </div>
  );
}
