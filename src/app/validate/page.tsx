import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  trade: {
    symbol: string;
    action: string;
    amount: string;
    holdingPeriod: string;
    riskProfile: string;
  };
  decision: 'APPROVE' | 'CAUTION' | 'REDUCE_OR_WAIT' | 'BLOCK';
  riskScore: number;
  topFactors: { name: string; score: number; weight: string }[];
  whyDecision: string;
  lesson: string;
  category: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'btc-crash-2022',
    title: 'BTC Large Buy — Market Crash Conditions',
    subtitle: 'Modelled on May 2022 LUNA collapse (-80% sector, extreme volatility)',
    category: 'Market Crash',
    trade: { symbol: 'BTC', action: 'Buy', amount: '$25,000', holdingPeriod: 'Intraday', riskProfile: 'Conservative' },
    decision: 'BLOCK',
    riskScore: 91,
    topFactors: [
      { name: 'Volatility', score: 90, weight: '18%' },
      { name: 'Holding Period', score: 88, weight: '5%' },
      { name: 'Trend', score: 85, weight: '15%' },
      { name: 'Macro', score: 80, weight: '5%' },
      { name: 'Position Size', score: 90, weight: '10%' },
    ],
    whyDecision:
      'A $25k intraday BTC position during a sector-wide crash combines extreme volatility (90/100) with a conservative profile that caps safe notional at ~$1k. The trend works strongly against a buy, and macro context (contagion risk, forced liquidations) adds systemic warning flags. The engine blocks because the weighted score exceeds the conservative BLOCK threshold of 60.',
    lesson:
      'The biggest trading mistakes happen when position size and risk profile are mismatched during high-volatility events. TradeFirewall would have caught this before execution.',
  },
  {
    id: 'eth-stable-buy',
    title: 'ETH Medium Buy — Stable Bull Market',
    subtitle: 'Modelled on Q1 2024 conditions: moderate volatility, positive sector momentum',
    category: 'Normal Market',
    trade: { symbol: 'ETH', action: 'Buy', amount: '$3,000', holdingPeriod: '7 Days', riskProfile: 'Balanced' },
    decision: 'APPROVE',
    riskScore: 28,
    topFactors: [
      { name: 'Trend', score: 25, weight: '15%' },
      { name: 'Volatility', score: 30, weight: '18%' },
      { name: 'Sentiment', score: 22, weight: '10%' },
      { name: 'Liquidity', score: 15, weight: '10%' },
      { name: 'Sector', score: 28, weight: '7%' },
    ],
    whyDecision:
      'A $3k, 7-day ETH buy during a stable bull market produces low scores across every factor. Trend is supportive, volatility is contained, news sentiment is positive, and the book has deep bid liquidity. The weighted score (28) sits well below the balanced APPROVE threshold of 35.',
    lesson:
      'TradeFirewall approves trades when conditions genuinely align — it is not designed to block everything. Low scores on every factor give traders real confidence.',
  },
  {
    id: 'sol-high-vol',
    title: 'SOL Medium Buy — Elevated Volatility',
    subtitle: 'Modelled on SOL during rapid 30% 48h run-up with thin order book',
    category: 'High Volatility',
    trade: { symbol: 'SOL', action: 'Buy', amount: '$5,000', holdingPeriod: '1 Day', riskProfile: 'Balanced' },
    decision: 'CAUTION',
    riskScore: 54,
    topFactors: [
      { name: 'Volatility', score: 75, weight: '18%' },
      { name: 'Execution', score: 68, weight: '10%' },
      { name: 'Liquidity', score: 62, weight: '10%' },
      { name: 'Holding Period', score: 72, weight: '5%' },
      { name: 'Trend', score: 30, weight: '15%' },
    ],
    whyDecision:
      'The trend is bullish (supporting the buy), but SOL\'s recent 30% run has elevated volatility to 75/100. The SoDEX orderbook shows thin ask-side depth, raising execution risk. The composite score (54) sits in the CAUTION band for a balanced profile. The engine recommends reducing size by 25–50% rather than blocking entirely.',
    lesson:
      'CAUTION does not mean STOP — it means trade smaller. Buying into strength is valid; buying $5k into a thin book after a 30% run without caution is reckless.',
  },
  {
    id: 'low-liquidity-altcoin',
    title: 'Low-Liquidity Altcoin Large Buy',
    subtitle: 'Small-cap token with $50k daily volume, $10k order attempted',
    category: 'Low Liquidity',
    trade: { symbol: 'HYPE', action: 'Buy', amount: '$10,000', holdingPeriod: '1 Day', riskProfile: 'Aggressive' },
    decision: 'BLOCK',
    riskScore: 86,
    topFactors: [
      { name: 'Liquidity', score: 90, weight: '10%' },
      { name: 'Execution', score: 88, weight: '10%' },
      { name: 'Volume', score: 82, weight: '10%' },
      { name: 'Position Size', score: 80, weight: '10%' },
      { name: 'Volatility', score: 78, weight: '18%' },
    ],
    whyDecision:
      'A $10k order into a market with only $50k 24h volume means the order is 20% of daily turnover — SoDEX\'s book walk shows the ask side is exhausted well before the full size is filled, producing high slippage warnings. Even an aggressive profile has thresholds: a liquidity score of 90 and execution score of 88 push the composite well above the aggressive BLOCK threshold of 80.',
    lesson:
      'Aggressive risk profile does not mean ignoring liquidity. Trying to fill a large order in a thin market guarantees significant slippage and potentially an incomplete fill — TradeFirewall blocks this before money is lost.',
  },
  {
    id: 'intraday-bear-market',
    title: 'Intraday Trade During Bear Trend',
    subtitle: 'Buying BTC intraday while 90-day kline trend is strongly bearish',
    category: 'Trend Mismatch',
    trade: { symbol: 'BTC', action: 'Buy', amount: '$2,000', holdingPeriod: 'Intraday', riskProfile: 'Balanced' },
    decision: 'REDUCE_OR_WAIT',
    riskScore: 67,
    topFactors: [
      { name: 'Trend', score: 85, weight: '15%' },
      { name: 'Holding Period', score: 80, weight: '5%' },
      { name: 'Sentiment', score: 70, weight: '10%' },
      { name: 'Macro', score: 65, weight: '5%' },
      { name: 'Volume', score: 58, weight: '10%' },
    ],
    whyDecision:
      'The 90-day kline shows a sustained bearish trend (momentum < -0.06), so buying intraday means fighting the dominant direction. Intraday holding adds timing risk (80/100). News sentiment is negative. The score of 67 puts this in REDUCE_OR_WAIT for a balanced profile. The engine suggests waiting for trend confirmation or reducing to $500–$1k.',
    lesson:
      '"Buy the dip" requires confirmation that the dip is bottoming — not just that the price is lower. TradeFirewall\'s trend factor catches when the dominant direction still works against the trade.',
  },
];

const DECISION_CONFIG = {
  APPROVE: { cls: 'bg-success text-background', label: 'APPROVE', border: 'border-success/30', bg: 'bg-success/5' },
  CAUTION: { cls: 'bg-warning text-background', label: 'CAUTION', border: 'border-warning/30', bg: 'bg-warning/5' },
  REDUCE_OR_WAIT: { cls: 'bg-orange-risk text-white', label: 'REDUCE / WAIT', border: 'border-orange-risk/30', bg: 'bg-orange-risk/5' },
  BLOCK: { cls: 'bg-danger text-white', label: 'BLOCK', border: 'border-danger/30', bg: 'bg-danger/5' },
};

const SCORE_COLOR = (s: number) =>
  s >= 76 ? 'text-danger' : s >= 51 ? 'text-orange-risk' : s >= 26 ? 'text-warning' : 'text-success';

const FACTOR_BAR = (s: number) =>
  s >= 70 ? 'bg-danger' : s >= 50 ? 'bg-orange-risk' : s >= 30 ? 'bg-warning' : 'bg-success';

export default function ValidatePage() {
  const categoryCounts = SCENARIOS.reduce<Record<string, number>>((acc, s) => {
    acc[s.decision] = (acc[s.decision] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="terminal-navbar sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="logo-text text-xl">
            tradefirewall<span className="logo-underscore">_</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/check-trade">
              <Button className="btn-secondary px-4 py-2 text-sm">Risk Engine</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="btn-secondary px-4 py-2 text-sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="text-label text-primary">Validation &amp; Stress Testing</div>
          <h1 className="text-3xl font-bold text-text-primary">How TradeFirewall responds to real market conditions</h1>
          <p className="text-body max-w-3xl leading-relaxed">
            These five scenarios show exactly what the risk engine returns for known market situations — including a 2022-style crash, low-liquidity altcoins,
            and a stable bull-market buy. Each scenario traces which factors drove the decision and why.
          </p>

          {/* Summary row */}
          <div className="flex flex-wrap gap-3 pt-2">
            {Object.entries(categoryCounts).map(([decision, count]) => {
              const cfg = DECISION_CONFIG[decision as keyof typeof DECISION_CONFIG];
              return (
                <Badge key={decision} className={`${cfg.cls} px-3 py-1.5 text-sm`}>
                  {count}× {cfg.label}
                </Badge>
              );
            })}
            <span className="text-text-secondary text-sm self-center ml-1">across {SCENARIOS.length} scenarios</span>
          </div>
        </div>

        {/* Methodology note */}
        <Card className="terminal-card border-primary/20">
          <CardContent className="pt-6 text-sm text-text-secondary space-y-2 leading-relaxed">
            <p>
              <span className="text-text-primary font-medium">How scenarios are constructed:</span> Each scenario uses realistic market parameters
              drawn from historical events or identifiable market structures (crash conditions, thin books, sustained bearish trends).
              Risk scores are computed by the same weighted engine used in production: 10 factors, fixed weights summing to 1.0,
              thresholds adjusted per risk profile (conservative / balanced / aggressive).
            </p>
            <p>
              <span className="text-text-primary font-medium">False positive / false negative analysis:</span> TradeFirewall is calibrated to prefer
              false positives (block a borderline trade) over false negatives (approve a genuinely dangerous trade). This matches the product&apos;s mission:
              preventing bad trades matters more than maximising trade throughput. Conservative profiles block at score ≥ 60, balanced at ≥ 70, aggressive at ≥ 80.
            </p>
          </CardContent>
        </Card>

        {/* Scenario cards */}
        <div className="space-y-10">
          {SCENARIOS.map((s, idx) => {
            const cfg = DECISION_CONFIG[s.decision];
            return (
              <Card key={s.id} className={`terminal-card ${cfg.border}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-text-secondary">#{idx + 1}</span>
                        <Badge variant="outline" className="text-xs border-border text-text-secondary">{s.category}</Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold text-text-primary">{s.title}</CardTitle>
                      <p className="text-sm text-text-secondary mt-1">{s.subtitle}</p>
                    </div>
                    <Badge className={`${cfg.cls} px-3 py-1.5 text-sm font-medium shrink-0`}>{cfg.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Trade details + score */}
                  <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-lg ${cfg.bg} border ${cfg.border}`}>
                    <div>
                      <div className="text-xs text-text-secondary uppercase tracking-wide">Symbol</div>
                      <div className="font-mono font-bold text-text-primary">{s.trade.symbol}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary uppercase tracking-wide">Action</div>
                      <div className="font-medium text-text-primary">{s.trade.action} {s.trade.amount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary uppercase tracking-wide">Holding</div>
                      <div className="text-text-primary">{s.trade.holdingPeriod}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary uppercase tracking-wide">Risk Profile</div>
                      <div className="text-text-primary">{s.trade.riskProfile}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-text-secondary uppercase tracking-wide">Risk Score</div>
                      <div className={`text-3xl font-bold ${SCORE_COLOR(s.riskScore)}`}>{s.riskScore}/100</div>
                    </div>
                  </div>

                  {/* Top factors */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Top contributing factors</h4>
                    <div className="space-y-2">
                      {s.topFactors.map((f) => (
                        <div key={f.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">
                              {f.name}
                              <span className="ml-2 text-xs text-text-secondary bg-surface px-1.5 py-0.5 rounded">{f.weight}</span>
                            </span>
                            <span className="text-text-primary font-mono">{f.score}/100</span>
                          </div>
                          <div className="w-full bg-surface rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${FACTOR_BAR(f.score)}`} style={{ width: `${f.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Why */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Why this decision?</h4>
                    <p className="text-body text-sm leading-relaxed">{s.whyDecision}</p>
                  </div>

                  {/* Lesson */}
                  <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <span className="text-primary text-lg shrink-0">💡</span>
                    <p className="text-sm text-body leading-relaxed">{s.lesson}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <Card className="terminal-card text-center">
          <CardContent className="py-10 space-y-4">
            <h2 className="text-xl font-bold text-text-primary">Try it live with real market data</h2>
            <p className="text-body max-w-lg mx-auto">
              These scenarios show simulated outputs. The live risk engine pulls real data from SoSoValue and SoDEX every time you run an analysis.
            </p>
            <Link href="/check-trade">
              <Button className="btn-primary px-8 py-3">Open Risk Engine</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
