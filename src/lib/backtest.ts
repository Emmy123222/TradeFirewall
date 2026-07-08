// Real historical backtest — walks REAL daily closes (SoDEX mainnet, read-only, no
// mock data) through the SAME scoring functions the live risk engine uses
// (see the "Pure scoring functions" section of riskEngine.ts) to produce genuine
// statistics for /validate: false positive/negative rates, a decision-vs-outcome
// confusion matrix, and curated real example rows.
//
// Honesty constraints this file is written under:
//  - Real market data only reaches back to ~2025-10-10 on SoDEX mainnet (verified
//    live). There is no real data covering a named historical crash (e.g. 2022
//    LUNA) — so this does not claim to. It reports genuine statistics over the
//    real window that exists.
//  - Factors that require live SoSoValue/orderbook data (sentiment, sector, macro,
//    liquidity, execution) cannot be reconstructed historically. They get the same
//    neutral default (50) the live engine already falls back to when a source is
//    missing — never a fabricated value.
//  - Intraday holding period is not backtested — daily bars can't represent it
//    honestly.

import { sodexAPI, SodexKline } from './sodex';
import {
  calculateTrendRisk,
  calculateVolumeRisk,
  calculatePositionSizeRisk,
  calculateHoldingPeriodRisk,
  combineRiskFactors,
  determineDecision,
  RiskProfile,
  TradeAction,
  Decision,
} from './riskEngine';

const BACKTEST_SYMBOLS = ['BTC', 'ETH', 'SOL', 'LINK', 'AVAX', 'DOGE'];
const BACKTEST_HOLDING_PERIODS: Array<'1day' | '7days' | '30days'> = ['1day', '7days', '30days'];
const HOLDING_PERIOD_DAYS: Record<'1day' | '7days' | '30days', number> = { '1day': 1, '7days': 7, '30days': 30 };
const RISK_PROFILES: RiskProfile[] = ['conservative', 'balanced', 'aggressive'];
const ACTIONS: TradeAction[] = ['buy', 'sell'];
/** Documented assumption used for the "estimated loss avoided" figure and position-size scoring. */
const ASSUMED_POSITION_SIZE_USD = 5000;
/**
 * Adverse-move thresholds in the trade direction, scaled to holding period.
 * Set to represent a genuinely damaging move, not routine daily noise (crypto
 * commonly moves 2-4%/day even in calm conditions) — otherwise "bad outcome"
 * would just mean "any red day," which the risk factors aren't designed to
 * predict and would make every statistic on this page meaningless.
 */
const ADVERSE_THRESHOLD: Record<'1day' | '7days' | '30days', number> = {
  '1day': -0.03,
  '7days': -0.05,
  '30days': -0.08,
};
const TREND_LOOKBACK_DAYS = 14;
const VOLATILITY_LOOKBACK_DAYS = 14;

export type BacktestLabel =
  | 'Good Block'
  | 'False Positive'
  | 'Reduce/Wait Correct'
  | 'Caution Correct'
  | 'Good Approval'
  | 'False Negative';

export interface BacktestRow {
  symbol: string;
  date: string;
  action: TradeAction;
  holdingPeriod: '1day' | '7days' | '30days';
  riskProfile: RiskProfile;
  riskScore: number;
  decision: Decision;
  factors: Record<string, number>;
  trendLabel: string;
  forwardReturnPct: number;
  outcome: 'bad' | 'good';
  label: BacktestLabel;
  positionSizeUsd: number;
}

export interface BacktestAggregate {
  totalScenarios: number;
  decisionCounts: Record<Decision, number>;
  labelCounts: Record<BacktestLabel, number>;
  /** BLOCK/REDUCE_OR_WAIT only — the two decisions that actually restrict execution (see Priority 3 gating). */
  falsePositiveRate: number;
  /** CAUTION's own accuracy, tracked separately since it warns rather than restricts. */
  cautionFalsePositiveRate: number;
  falseNegativeRate: number;
  avgScoreByOutcome: { good: number; bad: number };
  estimatedLossAvoidedUsd: number;
  assumedPositionSizeUsd: number;
}

export interface CuratedScenario {
  category: string;
  note: string;
  row: BacktestRow;
}

export interface BacktestMethodology {
  symbols: string[];
  dataSource: string;
  dateRange: string;
  realCandleCount: number;
  reconstructableFactors: string[];
  neutralDefaultedFactors: string[];
  adverseThresholds: Record<string, string>;
}

export interface BacktestResult {
  aggregate: BacktestAggregate;
  scenarios: CuratedScenario[];
  methodology: BacktestMethodology;
}

// ── Daily-bar volatility scoring ────────────────────────────────────────────
// riskEngine's calculateVolatilityFromKlines assumes ~hourly bars (it multiplies
// by sqrt(24) to convert hourly stdev to a daily-scale figure). Feeding it daily
// closes directly would double-apply that scaling and silently misclassify every
// row. This mirrors the SAME risk buckets on correctly-scaled daily-return stdev
// instead of misusing the hourly-tuned function.
function volatilityRiskFromDailyCloses(closes: number[]): number {
  if (closes.length < 2) return 70;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) * (r - mean), 0) / returns.length;
  const dailyStdev = Math.sqrt(variance);
  if (dailyStdev > 0.08) return 90;
  if (dailyStdev > 0.05) return 70;
  if (dailyStdev > 0.025) return 40;
  return 20;
}

function trendLabelFromCloses(pastClose: number, currentClose: number): string {
  const change = (currentClose - pastClose) / pastClose;
  if (change > 0.15) return 'strong_bullish';
  if (change > 0.05) return 'bullish';
  if (change > -0.05) return 'neutral';
  if (change > -0.15) return 'bearish';
  return 'strong_bearish';
}

let cache: { at: number; result: BacktestResult } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function runBacktest(): Promise<BacktestResult> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.result;

  const perSymbolKlines = await Promise.all(
    BACKTEST_SYMBOLS.map(async (symbol) => {
      try {
        const klines = await sodexAPI.getSpotKlinesFromMainnet(symbol, '1D', 300);
        return { symbol, klines };
      } catch {
        return { symbol, klines: [] as SodexKline[] };
      }
    })
  );

  const rows: BacktestRow[] = [];
  let earliestDate: string | null = null;
  let latestDate: string | null = null;
  let realCandleCount = 0;

  for (const { symbol, klines } of perSymbolKlines) {
    if (klines.length < TREND_LOOKBACK_DAYS + 2) continue;
    const sorted = [...klines].sort((a, b) => a.openTime - b.openTime);
    realCandleCount += sorted.length;
    const closes = sorted.map((k) => parseFloat(k.close));
    const volumes = sorted.map((k) => parseFloat(k.volume));

    const maxHoldDays = Math.max(...BACKTEST_HOLDING_PERIODS.map((h) => HOLDING_PERIOD_DAYS[h]));

    for (let i = TREND_LOOKBACK_DAYS; i < sorted.length - 1; i++) {
      const date = new Date(sorted[i].openTime).toISOString().slice(0, 10);
      if (!earliestDate || date < earliestDate) earliestDate = date;
      if (!latestDate || date > latestDate) latestDate = date;

      const volWindow = closes.slice(Math.max(0, i - VOLATILITY_LOOKBACK_DAYS), i + 1);
      const volatilityFactor = volatilityRiskFromDailyCloses(volWindow);
      const trendLabel = trendLabelFromCloses(closes[i - TREND_LOOKBACK_DAYS], closes[i]);
      const volumeFactor = calculateVolumeRisk(undefined, { volume: String(volumes[i]) });

      for (const action of ACTIONS) {
        const trendFactor = calculateTrendRisk({ trend: trendLabel }, action);

        for (const holdingPeriod of BACKTEST_HOLDING_PERIODS) {
          const holdDays = HOLDING_PERIOD_DAYS[holdingPeriod];
          const futureIndex = i + holdDays;
          if (futureIndex >= sorted.length) continue; // no lookahead beyond real data

          const holdingPeriodFactor = calculateHoldingPeriodRisk(holdingPeriod, volatilityFactor);
          const rawReturn = (closes[futureIndex] - closes[i]) / closes[i];
          const forwardReturnPct = action === 'buy' ? rawReturn : -rawReturn;
          const outcome: 'bad' | 'good' = forwardReturnPct <= ADVERSE_THRESHOLD[holdingPeriod] ? 'bad' : 'good';

          for (const riskProfile of RISK_PROFILES) {
            const positionSizeFactor = calculatePositionSizeRisk(ASSUMED_POSITION_SIZE_USD, riskProfile);
            const factors: Record<string, number> = {
              volatility: volatilityFactor,
              sentiment: 50,
              volume: volumeFactor,
              trend: trendFactor,
              liquidity: 50,
              execution: 50,
              sector: 50,
              macro: 50,
              positionSize: positionSizeFactor,
              holdingPeriod: holdingPeriodFactor,
            };
            const riskScore = combineRiskFactors(factors);
            const decision = determineDecision(riskScore, riskProfile);
            const label = classify(decision, outcome);

            rows.push({
              symbol,
              date,
              action,
              holdingPeriod,
              riskProfile,
              riskScore,
              decision,
              factors,
              trendLabel,
              forwardReturnPct,
              outcome,
              label,
              positionSizeUsd: ASSUMED_POSITION_SIZE_USD,
            });
          }
        }
      }
    }
    void maxHoldDays;
  }

  const aggregate = aggregateRows(rows);
  const scenarios = curateScenarios(rows);

  const result: BacktestResult = {
    aggregate,
    scenarios,
    methodology: {
      symbols: BACKTEST_SYMBOLS,
      dataSource: 'SoDEX mainnet public daily klines (read-only, real prices — independent of the testnet execution path)',
      dateRange: earliestDate && latestDate ? `${earliestDate} to ${latestDate}` : 'unavailable',
      realCandleCount,
      reconstructableFactors: ['Volatility (real daily closes)', 'Trend (real 14-day price change)', 'Volume (real daily volume)', 'Position size (assumed notional)', 'Holding period'],
      neutralDefaultedFactors: ['Sentiment', 'Liquidity', 'Execution', 'Sector', 'Macro — all default to 50 (neutral), matching the live engine\'s own fallback when a data source is unavailable'],
      adverseThresholds: {
        '1day': `${(ADVERSE_THRESHOLD['1day'] * 100).toFixed(0)}% adverse move`,
        '7days': `${(ADVERSE_THRESHOLD['7days'] * 100).toFixed(0)}% adverse move`,
        '30days': `${(ADVERSE_THRESHOLD['30days'] * 100).toFixed(0)}% adverse move`,
      },
    },
  };

  cache = { at: Date.now(), result };
  return result;
}

function classify(decision: Decision, outcome: 'bad' | 'good'): BacktestLabel {
  if (decision === 'BLOCK') return outcome === 'bad' ? 'Good Block' : 'False Positive';
  if (decision === 'REDUCE_OR_WAIT') return outcome === 'bad' ? 'Reduce/Wait Correct' : 'False Positive';
  if (decision === 'CAUTION') return outcome === 'bad' ? 'Caution Correct' : 'False Positive';
  return outcome === 'bad' ? 'False Negative' : 'Good Approval';
}

function aggregateRows(rows: BacktestRow[]): BacktestAggregate {
  const decisionCounts: Record<Decision, number> = { APPROVE: 0, CAUTION: 0, REDUCE_OR_WAIT: 0, BLOCK: 0 };
  const labelCounts: Record<BacktestLabel, number> = {
    'Good Block': 0,
    'False Positive': 0,
    'Reduce/Wait Correct': 0,
    'Caution Correct': 0,
    'Good Approval': 0,
    'False Negative': 0,
  };
  let goodScoreSum = 0;
  let goodCount = 0;
  let badScoreSum = 0;
  let badCount = 0;
  let estimatedLossAvoidedUsd = 0;

  for (const row of rows) {
    decisionCounts[row.decision]++;
    labelCounts[row.label]++;
    if (row.outcome === 'good') {
      goodScoreSum += row.riskScore;
      goodCount++;
    } else {
      badScoreSum += row.riskScore;
      badCount++;
    }
    if (row.label === 'Good Block' || row.label === 'Reduce/Wait Correct') {
      estimatedLossAvoidedUsd += row.positionSizeUsd * Math.abs(row.forwardReturnPct);
    }
  }

  // False-positive rate is measured only over decisions that actually restrict execution
  // (BLOCK, REDUCE_OR_WAIT — see Priority 3 gating). CAUTION still allows execution, so
  // conflating a "CAUTION but it was fine" row with a wrongful BLOCK overstates the error rate.
  const hardRestrictions = rows.filter((r) => r.decision === 'BLOCK' || r.decision === 'REDUCE_OR_WAIT');
  const hardFalsePositives = hardRestrictions.filter((r) => r.label === 'False Positive').length;
  const falsePositiveRate = hardRestrictions.length > 0 ? hardFalsePositives / hardRestrictions.length : 0;

  const cautionRows = rows.filter((r) => r.decision === 'CAUTION');
  const cautionFalsePositives = cautionRows.filter((r) => r.label === 'False Positive').length;
  const cautionFalsePositiveRate = cautionRows.length > 0 ? cautionFalsePositives / cautionRows.length : 0;

  const approvals = labelCounts['Good Approval'] + labelCounts['False Negative'];
  const falseNegativeRate = approvals > 0 ? labelCounts['False Negative'] / approvals : 0;

  return {
    totalScenarios: rows.length,
    decisionCounts,
    labelCounts,
    falsePositiveRate,
    cautionFalsePositiveRate,
    falseNegativeRate,
    avgScoreByOutcome: {
      good: goodCount > 0 ? Math.round(goodScoreSum / goodCount) : 0,
      bad: badCount > 0 ? Math.round(badScoreSum / badCount) : 0,
    },
    estimatedLossAvoidedUsd: Math.round(estimatedLossAvoidedUsd),
    assumedPositionSizeUsd: ASSUMED_POSITION_SIZE_USD,
  };
}

function curateScenarios(rows: BacktestRow[]): CuratedScenario[] {
  // Fixed lens for most categories so examples are directly comparable to each other.
  const lens = rows.filter((r) => r.riskProfile === 'balanced' && r.action === 'buy' && r.holdingPeriod === '7days');
  const scenarios: CuratedScenario[] = [];
  const used = new Set<BacktestRow>();

  const take = (category: string, note: string, candidate: BacktestRow | undefined) => {
    if (!candidate || used.has(candidate)) return;
    used.add(candidate);
    scenarios.push({ category, note, row: candidate });
  };

  const byVolatilityDesc = [...lens].sort((a, b) => b.factors.volatility - a.factors.volatility);
  take('High Volatility', 'Real day with the highest volatility factor in the sample.', byVolatilityDesc[0]);

  const bullish = lens
    .filter((r) => (r.trendLabel === 'bullish' || r.trendLabel === 'strong_bullish') && r.outcome === 'good')
    .sort((a, b) => a.riskScore - b.riskScore);
  take('Bull Market', 'Real day with a supportive trend and a safe real forward outcome.', bullish[0]);

  const bearMismatch = lens
    .filter((r) => (r.trendLabel === 'bearish' || r.trendLabel === 'strong_bearish'))
    .sort((a, b) => b.riskScore - a.riskScore);
  take('Trend Mismatch (Bear Market)', 'Buying real-data days where the 14-day trend was bearish.', bearMismatch[0]);

  const byVolumeAsc = [...lens].sort((a, b) => a.factors.volume - b.factors.volume === 0 ? 0 : b.factors.volume - a.factors.volume);
  const lowLiquidityProxy = [...lens].sort((a, b) => b.factors.volume - a.factors.volume)[0];
  take('Low Liquidity (volume proxy)', 'Real day with the thinnest traded volume — a proxy for a shallow order book (historical orderbook depth is not reconstructable).', lowLiquidityProxy);
  void byVolumeAsc;

  const stable = lens.filter((r) => r.factors.volatility <= 20 && r.outcome === 'good').sort((a, b) => a.riskScore - b.riskScore);
  take('Stable Market', 'Real low-volatility day with a safe real forward outcome.', stable[0]);

  const largePosition = rows.find((r) => r.riskProfile === 'aggressive' && r.holdingPeriod === '7days' && r.action === 'buy' && r.factors.volatility < 40);
  if (largePosition) {
    const oversized: BacktestRow = {
      ...largePosition,
      positionSizeUsd: 60000,
      factors: { ...largePosition.factors, positionSize: calculatePositionSizeRisk(60000, 'aggressive') },
    };
    oversized.riskScore = combineRiskFactors(oversized.factors);
    oversized.decision = determineDecision(oversized.riskScore, 'aggressive');
    oversized.label = classify(oversized.decision, oversized.outcome);
    scenarios.push({
      category: 'Large Position Size',
      note: 'Real market conditions from that day, with position size scaled to $60,000 against an aggressive profile\'s $20,000 tolerance to illustrate the position-size factor (simulated overlay on real price data — not an actual differently-sized historical trade).',
      row: oversized,
    });
  }

  const falsePositive = rows.find((r) => r.label === 'False Positive' && (r.decision === 'BLOCK' || r.decision === 'REDUCE_OR_WAIT'));
  take('False Positive', 'A real day the engine restricted where the real forward move turned out fine.', falsePositive);

  const falseNegative = rows.find((r) => r.label === 'False Negative');
  take('False Negative (Missed Risk)', 'A real day the engine approved where the real forward move was adverse.', falseNegative);

  const reduceCorrect = lens.find((r) => r.label === 'Reduce/Wait Correct');
  take('Reduce/Wait Correct', 'A real day flagged REDUCE_OR_WAIT where the real forward move was adverse.', reduceCorrect);

  const cautionCorrect = lens.find((r) => r.label === 'Caution Correct');
  take('Caution Correct', 'A real day flagged CAUTION where the real forward move was adverse.', cautionCorrect);

  const goodApproval = lens.find((r) => r.label === 'Good Approval');
  take('Good Approval', 'A real day approved where the real forward move was safe.', goodApproval);

  const goodBlock = lens.find((r) => r.label === 'Good Block');
  take('Good Block', 'A real day blocked where the real forward move was adverse.', goodBlock);

  // Fill out to ~20-25 with additional diverse real rows across symbols/labels not yet represented.
  const bySymbol = new Map<string, BacktestRow[]>();
  for (const r of lens) {
    if (used.has(r)) continue;
    const list = bySymbol.get(r.symbol) ?? [];
    list.push(r);
    bySymbol.set(r.symbol, list);
  }
  let round = 0;
  while (scenarios.length < 22 && round < 20) {
    let addedAny = false;
    for (const [, list] of bySymbol) {
      if (scenarios.length >= 22) break;
      const next = list[round];
      if (next && !used.has(next)) {
        used.add(next);
        scenarios.push({ category: `${next.label}`, note: 'Additional real historical data point for sample diversity.', row: next });
        addedAny = true;
      }
    }
    round++;
    if (!addedAny) break;
  }

  return scenarios;
}
