// Score calibration — explains *why* a risk score means what it means, instead of
// just displaying a number. Bands match the score-color cutoffs already used across
// the UI (RiskScoreCard, RiskFactorsList, /validate): 0-25 / 26-50 / 51-75 / 76-100.
//
// Historical-case text for each band is generated from real /validate backtest runs
// (src/lib/backtest.ts) where available; the static fallback text below is what renders
// before/if a backtest sample for that band isn't available.

export type CalibrationBandId = 'low' | 'moderate' | 'high' | 'critical';

export interface CalibrationBand {
  id: CalibrationBandId;
  scoreRange: [number, number];
  label: string;
  /** Nominal decision at this score under a BALANCED profile (profile-adjusted thresholds shift this). */
  nominalDecision: 'APPROVE' | 'CAUTION' | 'REDUCE_OR_WAIT' | 'BLOCK';
  whyThreshold: string;
  typicalCases: string;
  failureMode: string;
  confidenceGuidance: string;
}

export const CALIBRATION_BANDS: CalibrationBand[] = [
  {
    id: 'low',
    scoreRange: [0, 25],
    label: 'Low Risk',
    nominalDecision: 'APPROVE',
    whyThreshold:
      'Set at the point where every weighted factor (volatility, trend, liquidity, position size, etc.) is independently reading low. A single weak factor cannot push a trade under 25 — it requires broad, simultaneous alignment.',
    typicalCases:
      'Established assets (BTC/ETH-class liquidity), moderate holding periods (7-30 days), position size well under the risk-profile tolerance, and a trend that supports the trade direction.',
    failureMode:
      'The main failure mode is a sudden regime change the engine has not yet priced in — a low score describes current conditions, not a guarantee they persist for the full holding period.',
    confidenceGuidance: 'Confidence is usually highest here because low-risk conditions correlate with deep liquidity and active news coverage, both of which feed the confidence score.',
  },
  {
    id: 'moderate',
    scoreRange: [26, 50],
    label: 'Moderate Risk',
    nominalDecision: 'CAUTION',
    whyThreshold:
      'Marks where at least one or two factors (commonly volatility or trend) are elevated but not extreme, and the rest are still supportive. The trade is not broken, but it is no longer a clean setup.',
    typicalCases:
      'A supportive trend paired with above-average volatility, or adequate liquidity for a position size that is on the larger side of the risk profile tolerance.',
    failureMode:
      'Under-sizing risk: traders sometimes read CAUTION as "fine" rather than "reduce." The one or two elevated factors are exactly the ones that tend to compound if conditions worsen.',
    confidenceGuidance: 'Confidence is typically medium — the trade has enough live data to score, but one of the supporting signals (news coverage, book depth) is often thinner than in the low-risk band.',
  },
  {
    id: 'high',
    scoreRange: [51, 75],
    label: 'High Risk',
    nominalDecision: 'REDUCE_OR_WAIT',
    whyThreshold:
      'Reached when multiple heavily-weighted factors (volatility 18%, trend 15%, position size 10%, execution 10%) are simultaneously unfavorable. No single factor drives this band — it is the combination.',
    typicalCases:
      'Buying into a bearish trend during elevated volatility, a position size that is 2-3x the risk-profile tolerance, or a thin order book relative to the trade size.',
    failureMode:
      'The dangerous failure mode is treating REDUCE_OR_WAIT as a soft warning to click through rather than an instruction — this band is where the confirmation gate exists specifically to slow that down.',
    confidenceGuidance: 'Confidence varies more here — high-risk conditions sometimes come with thin books or sparse news coverage, which pulls the confidence score down even as the risk score goes up.',
  },
  {
    id: 'critical',
    scoreRange: [76, 100],
    label: 'Critical Risk',
    nominalDecision: 'BLOCK',
    whyThreshold:
      'The ceiling band: nearly every weighted factor is reading in its own danger zone at once — extreme volatility, adverse trend, oversized position, and/or execution warnings from the live orderbook.',
    typicalCases:
      'Large positions into thin, volatile books; buying heavily against a strongly bearish trend on a short holding period; or execution previews flagging multiple slippage/liquidity warnings simultaneously.',
    failureMode:
      "This band is calibrated to accept false positives over false negatives — it will occasionally block a trade that would have been fine. That tradeoff is intentional (see /validate's false-positive rate) because the cost of a missed BLOCK is higher than the cost of an unnecessary one.",
    confidenceGuidance: 'Confidence can be high even here — critical scores often come from unambiguous signals (deep orderbook warnings, extreme volatility readings) rather than missing data.',
  },
];

export function getCalibrationBand(riskScore: number): CalibrationBand {
  const band = CALIBRATION_BANDS.find((b) => riskScore >= b.scoreRange[0] && riskScore <= b.scoreRange[1]);
  return band ?? CALIBRATION_BANDS[CALIBRATION_BANDS.length - 1];
}

export interface ReliabilityNote {
  level: 'high' | 'medium' | 'low';
  note: string;
}

/**
 * Turns the same signals RiskEngine.calculateConfidence already inspects into a
 * plain-language explanation, instead of just showing a percentage.
 */
export function getReliabilityNote(
  confidence: number,
  sosoData?: { sentiment?: { newsCount?: number } },
  sodexData?: {
    liquidityAnalysis?: { marketDepth?: number };
    ticker?: { volume?: string };
    executionPreview?: { warnings?: string[] };
  }
): ReliabilityNote {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const hasDepth = (sodexData?.liquidityAnalysis?.marketDepth ?? 0) > 0;
  const hasNews = (sosoData?.sentiment?.newsCount ?? 0) > 0;
  const hasVolume = parseFloat(sodexData?.ticker?.volume ?? '0') > 0;
  const warningCount = sodexData?.executionPreview?.warnings?.length ?? 0;

  if (hasDepth) reasons.push('live orderbook depth');
  else concerns.push('thin or missing orderbook depth');

  if (hasNews) reasons.push('active news coverage');
  else concerns.push('thin news coverage for this asset');

  if (hasVolume) reasons.push('live traded volume');
  else concerns.push('no live traded volume reading');

  if (warningCount > 0) concerns.push(`${warningCount} execution warning${warningCount > 1 ? 's' : ''} from the live book`);

  const level: ReliabilityNote['level'] = confidence >= 0.75 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';

  const levelLabel = level === 'high' ? 'High confidence' : level === 'medium' ? 'Medium confidence' : 'Low confidence';
  const detail =
    level === 'high'
      ? `strong signal quality: ${reasons.join(', ') || 'multiple live data sources agree'}.`
      : level === 'medium'
        ? `${concerns[0] ?? 'some inputs are thinner than ideal'}${reasons.length ? `, offset by ${reasons.join(', ')}` : ''}.`
        : `${concerns.join(', ') || 'market data is incomplete'} — treat this score as directional, not precise.`;

  return { level, note: `${levelLabel}: ${detail}` };
}
