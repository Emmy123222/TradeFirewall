import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BacktestAggregate, BacktestLabel } from '@/lib/backtest';

interface ConfusionMatrixProps {
  aggregate: BacktestAggregate;
}

const ROWS: Array<{ decision: string; goodLabel: BacktestLabel | null; badLabel: BacktestLabel }> = [
  { decision: 'BLOCK', goodLabel: null, badLabel: 'Good Block' },
  { decision: 'REDUCE_OR_WAIT', goodLabel: null, badLabel: 'Reduce/Wait Correct' },
  { decision: 'CAUTION', goodLabel: null, badLabel: 'Caution Correct' },
  { decision: 'APPROVE', goodLabel: 'Good Approval', badLabel: 'False Negative' },
];

const LABEL_TONE: Record<BacktestLabel, string> = {
  'Good Block': 'bg-success text-background',
  'Reduce/Wait Correct': 'bg-success text-background',
  'Caution Correct': 'bg-success text-background',
  'Good Approval': 'bg-success text-background',
  'False Positive': 'bg-warning text-background',
  'False Negative': 'bg-danger text-white',
};

export function ConfusionMatrix({ aggregate }: ConfusionMatrixProps) {
  const { labelCounts } = aggregate;

  return (
    <Card className="terminal-card">
      <CardHeader>
        <CardTitle className="text-card-heading">Decision vs. Real Outcome</CardTitle>
        <p className="text-sm text-text-secondary">
          Each row is a decision the engine made against real historical data; columns show what the real forward price move actually did.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-text-secondary font-medium">Engine Decision</th>
                <th className="text-left py-2 pr-4 text-text-secondary font-medium">Real outcome: safe</th>
                <th className="text-left py-2 pr-4 text-text-secondary font-medium">Real outcome: adverse</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ decision, goodLabel, badLabel }) => {
                const goodCount = goodLabel ? labelCounts[goodLabel] : labelCounts['False Positive'];
                // For restrictive decisions we don't track False Positive per-decision in labelCounts
                // (it's pooled) — show the pooled count once, on the BLOCK row, to avoid double counting.
                return (
                  <tr key={decision} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-text-primary">{decision.replace('_', ' / ')}</td>
                    <td className="py-3 pr-4">
                      {decision === 'APPROVE' ? (
                        <Badge className={`${LABEL_TONE['Good Approval']} text-xs px-2 py-1`}>
                          Good Approval — {goodCount.toLocaleString()}
                        </Badge>
                      ) : (
                        <span className="text-xs text-text-secondary">pooled below</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={`${LABEL_TONE[badLabel]} text-xs px-2 py-1`}>
                        {badLabel} — {labelCounts[badLabel].toLocaleString()}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className="py-3 pr-4 font-medium text-text-primary">BLOCK / REDUCE_OR_WAIT / CAUTION</td>
                <td className="py-3 pr-4" colSpan={2}>
                  <Badge className={`${LABEL_TONE['False Positive']} text-xs px-2 py-1`}>
                    False Positive (restricted, but real outcome was safe) — {labelCounts['False Positive'].toLocaleString()}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary mt-4">
          &ldquo;Adverse&rdquo; = a real forward move against the trade direction beyond the documented threshold for that holding period
          (see Methodology below). BLOCK, REDUCE_OR_WAIT, and CAUTION share one False Positive bucket because all three restrict or
          discourage a trade that a hard/soft gate applies to differently — see the Validation Metrics false-positive rate above for the
          BLOCK/REDUCE_OR_WAIT-only figure that actually gates execution.
        </p>
      </CardContent>
    </Card>
  );
}
