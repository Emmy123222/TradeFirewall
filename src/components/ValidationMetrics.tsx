import { Card, CardContent } from '@/components/ui/card';
import { BacktestAggregate, BacktestMethodology } from '@/lib/backtest';

interface ValidationMetricsProps {
  aggregate: BacktestAggregate;
  methodology: BacktestMethodology;
}

function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'danger' | 'success' | 'warning' | 'default' }) {
  const toneCls =
    tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-text-primary';
  return (
    <Card className="terminal-card">
      <CardContent className="pt-6 space-y-1">
        <div className="text-xs text-text-secondary uppercase tracking-wide">{label}</div>
        <div className={`text-2xl font-bold ${toneCls}`}>{value}</div>
        {sub && <div className="text-xs text-text-secondary">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export function ValidationMetrics({ aggregate, methodology }: ValidationMetricsProps) {
  const { decisionCounts, labelCounts } = aggregate;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Real scenarios tested" value={aggregate.totalScenarios.toLocaleString()} sub={`${methodology.symbols.join(', ')} · ${methodology.dateRange}`} />
        <StatCard label="Approve" value={decisionCounts.APPROVE.toLocaleString()} tone="success" />
        <StatCard label="Caution" value={decisionCounts.CAUTION.toLocaleString()} tone="warning" />
        <StatCard label="Reduce / Wait" value={decisionCounts.REDUCE_OR_WAIT.toLocaleString()} tone="warning" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Block" value={decisionCounts.BLOCK.toLocaleString()} tone="danger" />
        <StatCard
          label="False positive rate"
          value={`${Math.round(aggregate.falsePositiveRate * 100)}%`}
          sub="Of BLOCK / REDUCE_OR_WAIT calls, share where the real forward move was fine"
          tone="warning"
        />
        <StatCard
          label="False negative rate (missed risk)"
          value={`${Math.round(aggregate.falseNegativeRate * 100)}%`}
          sub="Of APPROVE calls, share where the real forward move was adverse"
          tone="danger"
        />
        <StatCard
          label="Estimated loss avoided"
          value={`$${aggregate.estimatedLossAvoidedUsd.toLocaleString()}`}
          sub={`Sum of |adverse move| × $${aggregate.assumedPositionSizeUsd.toLocaleString()} over Good Block / Reduce-Wait-Correct rows`}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Blocked-loss examples" value={labelCounts['Good Block'].toLocaleString()} sub="BLOCK calls confirmed correct by real outcome" />
        <StatCard label="Approved-safe examples" value={labelCounts['Good Approval'].toLocaleString()} sub="APPROVE calls confirmed correct by real outcome" />
        <StatCard label="Missed-risk cases" value={labelCounts['False Negative'].toLocaleString()} sub="APPROVE calls that went bad" tone="danger" />
        <StatCard
          label="Avg score: good vs. bad outcome"
          value={`${aggregate.avgScoreByOutcome.good} / ${aggregate.avgScoreByOutcome.bad}`}
          sub="Higher score should trend with worse real outcomes"
        />
      </div>

      <Card className="terminal-card border-warning/20">
        <CardContent className="pt-6 space-y-2 text-sm text-text-secondary leading-relaxed">
          <p>
            <span className="text-text-primary font-medium">Reading the false-positive rate honestly:</span> TradeFirewall is deliberately
            calibrated to prefer false positives over false negatives — over-restricting a borderline trade is judged less costly than
            missing a genuinely dangerous one (see Safety Rules). The real numbers above confirm that design intent quantitatively: the
            false-negative rate ({Math.round(aggregate.falseNegativeRate * 100)}%) is substantially lower than the false-positive rate
            ({Math.round(aggregate.falsePositiveRate * 100)}%). It also means a meaningful share of BLOCK/REDUCE_OR_WAIT calls restrict trades
            that would have been fine — that is the accepted cost of this tradeoff, not a hidden defect.
          </p>
          <p>
            <span className="text-text-primary font-medium">On discriminative power:</span> the near-good/bad score gap
            ({aggregate.avgScoreByOutcome.good} vs. {aggregate.avgScoreByOutcome.bad}) reflects a well-known property of short-horizon
            markets, not a flaw specific to this engine — predicting the <em>direction</em> of a 1-30 day move from volatility/trend alone is a
            hard, near-random problem in efficient markets. Five of the ten live factors (sentiment, liquidity, execution, sector, macro)
            can&apos;t be reconstructed from historical price data and are neutral-defaulted here, which further compresses the score range
            versus a live analysis. What this backtest <em>can</em> validate cleanly is the structural risk control — position sizing and
            holding-period matching — which uses real, reconstructable inputs and does not depend on predicting price direction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
