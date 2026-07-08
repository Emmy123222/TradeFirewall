import { NextRequest, NextResponse } from 'next/server';
import { sodexAPI } from '@/lib/sodex';
import {
  OrderSide,
  OrderType,
  TimeInForce,
  buildBatchNewOrderParams,
  computePayloadHash,
  buildExchangeActionTypedData,
  generateClOrdID,
  generateNonce,
  toSodexApiSign,
  snapToStep,
  SODEX_TESTNET_CHAIN_ID,
  BatchNewOrderParams,
} from '@/lib/sodexOrderSigning';

// Testnet-only, always — this route never reaches mainnet regardless of trade
// content or SODEX_USE_TESTNET misconfiguration (checked explicitly below).
const SODEX_TESTNET_SPOT_URL = (
  process.env.SODEX_TESTNET_SPOT_URL || 'https://testnet-gw.sodex.dev/api/v1/spot'
).replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    if (sodexAPI.configuredNetwork !== 'testnet') {
      return NextResponse.json(
        { error: 'SoDEX order placement requires SODEX_USE_TESTNET=true. Mainnet execution is not enabled by this app.', errorType: 'MAINNET_DISABLED' },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (body.action === 'prepare') return handlePrepare(body);
    if (body.action === 'submit') return handleSubmit(body);
    return NextResponse.json({ error: 'Unknown action. Use "prepare" or "submit".' }, { status: 400 });
  } catch (error) {
    console.error('SoDEX place-order error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Order placement failed', errorType: 'ORDER_ERROR' },
      { status: 500 }
    );
  }
}

async function handlePrepare(body: {
  symbol?: string;
  side?: 'buy' | 'sell';
  amountUsd?: number;
  walletAddress?: string;
  maxSlippagePct?: number;
  decision?: string;
}) {
  const { symbol, side, amountUsd, walletAddress, decision } = body;

  if (!symbol || !side || !amountUsd || amountUsd <= 0 || !walletAddress) {
    return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 });
  }

  // Server-side backstop — mirrors the UI gating in ConfirmationGate/check-trade,
  // but enforced here too so a tampered client can't bypass it.
  if (decision === 'BLOCK') {
    return NextResponse.json(
      { error: 'This trade is BLOCKed by the risk engine. Execution is not available for BLOCK decisions.', errorType: 'BLOCKED' },
      { status: 403 }
    );
  }
  if (decision === 'REDUCE_OR_WAIT') {
    return NextResponse.json(
      { error: 'REDUCE_OR_WAIT trades must be resized and re-analyzed before execution is available.', errorType: 'REDUCE_REQUIRED' },
      { status: 403 }
    );
  }

  let accountState: Awaited<ReturnType<typeof sodexAPI.getAccountState>>;
  let rules: Awaited<ReturnType<typeof sodexAPI.getSpotSymbolRules>>;
  try {
    [accountState, rules] = await Promise.all([
      sodexAPI.getAccountState(walletAddress),
      sodexAPI.getSpotSymbolRules(symbol),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resolve account or symbol';
    const notOnboarded = message.includes('no SoDEX testnet account');
    return NextResponse.json(
      { error: message, errorType: notOnboarded ? 'NOT_ONBOARDED' : 'ACCOUNT_RESOLUTION_ERROR' },
      { status: notOnboarded ? 404 : 502 }
    );
  }

  // Uses the same bookTicker → orderbook → last-trade fallback chain as the
  // execution preview, so a one-sided testnet book (bids with no asks, or vice
  // versa — common on SoDEX testnet) still resolves to a usable reference price
  // instead of failing outright.
  let bid: number;
  let ask: number;
  try {
    ({ bidPrice: bid, askPrice: ask } = await sodexAPI.getExecutionReferencePrices(symbol));
  } catch {
    return NextResponse.json({ error: 'SoDEX testnet has no usable bid/ask for this symbol right now.', errorType: 'NO_LIQUIDITY' }, { status: 503 });
  }

  const slippage = Math.min(Math.max(body.maxSlippagePct ?? 0.01, 0.001), 0.05);
  const isBuy = side === 'buy';
  // Marketable limit + IOC: fills immediately like a market order, but never worse
  // than this protection price — the slippage-protection mechanism.
  const protectionPriceRaw = isBuy ? ask * (1 + slippage) : bid * (1 - slippage);
  const protectionPrice = snapToStep(protectionPriceRaw, rules.tickSize, rules.pricePrecision);
  const refPrice = parseFloat(protectionPrice);
  const quantity = snapToStep(amountUsd / refPrice, rules.stepSize, rules.quantityPrecision);
  const notional = parseFloat(quantity) * refPrice;

  if (!(parseFloat(quantity) > 0)) {
    return NextResponse.json({ error: 'Order size rounds to zero at this symbol\'s minimum step size.', errorType: 'SIZE_TOO_SMALL' }, { status: 400 });
  }
  if (notional < rules.minNotional) {
    return NextResponse.json(
      { error: `Order notional $${notional.toFixed(2)} is below SoDEX's minimum of $${rules.minNotional} for this symbol.`, errorType: 'BELOW_MIN_NOTIONAL' },
      { status: 400 }
    );
  }

  const clOrdID = generateClOrdID();
  const orderParams = buildBatchNewOrderParams({
    accountID: accountState.accountID,
    symbolID: rules.symbolID,
    clOrdID,
    side: isBuy ? OrderSide.BUY : OrderSide.SELL,
    type: OrderType.LIMIT,
    timeInForce: TimeInForce.IOC,
    price: protectionPrice,
    quantity,
  });
  const payloadHash = computePayloadHash(orderParams);
  const nonce = generateNonce();
  const typedData = buildExchangeActionTypedData(payloadHash, nonce, SODEX_TESTNET_CHAIN_ID);

  return NextResponse.json({
    typedData,
    nonce,
    orderParams,
    preview: {
      symbol,
      side: isBuy ? 'BUY' : 'SELL',
      accountID: accountState.accountID,
      clOrdID,
      quantity,
      protectionPrice,
      estimatedNotionalUsd: Math.round(notional),
      currentBid: bid,
      currentAsk: ask,
      slippagePct: slippage,
      orderType: 'LIMIT',
      timeInForce: 'IOC',
      network: 'testnet',
    },
  });
}

async function handleSubmit(body: {
  orderParams?: BatchNewOrderParams;
  nonce?: number;
  signature?: string;
  walletAddress?: string;
}) {
  const { orderParams, nonce, signature, walletAddress } = body;
  if (!orderParams || !nonce || !signature || !walletAddress) {
    return NextResponse.json({ error: 'Missing signed order fields' }, { status: 400 });
  }

  let apiSign: string;
  try {
    apiSign = toSodexApiSign(signature);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid wallet signature', errorType: 'BAD_SIGNATURE' }, { status: 400 });
  }

  const url = `${SODEX_TESTNET_SPOT_URL}/trade/orders/batch`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-Sign': apiSign,
      'X-API-Nonce': String(nonce),
      'X-API-Chain': String(SODEX_TESTNET_CHAIN_ID),
    },
    body: JSON.stringify(orderParams),
  });

  const raw: unknown = await response.json().catch(() => null);
  if (!response.ok || raw === null) {
    return NextResponse.json(
      { error: `SoDEX order submission failed (HTTP ${response.status})`, errorType: 'SODEX_SUBMIT_ERROR', raw },
      { status: 502 }
    );
  }

  const container = raw as { code?: number; message?: string; data?: unknown };
  const results = Array.isArray(raw) ? raw : Array.isArray(container.data) ? container.data : [raw];
  const result = results[0] as { code?: number; clOrdID?: string; orderID?: number; error?: string } | undefined;
  const success = !!result && result.code === 0;

  return NextResponse.json(
    {
      success,
      orderID: result?.orderID ?? null,
      clOrdID: result?.clOrdID ?? orderParams.orders[0]?.clOrdID,
      error: success ? undefined : result?.error || container.message || 'Order rejected by SoDEX',
      network: 'testnet',
      timestamp: Date.now(),
      raw,
    },
    { status: success ? 200 : 502 }
  );
}
