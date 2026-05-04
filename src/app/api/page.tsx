'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function APIPage() {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log(`${label} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="terminal-navbar sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="logo-text text-xl">
            tradefirewall<span className="logo-underscore">_</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/check-trade">
              <Button className="btn-primary px-4 py-2 text-sm">Go to App</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-section-heading mb-6">
            TradeFirewall API Documentation
          </h1>
          <p className="text-xl text-body max-w-3xl mx-auto leading-relaxed">
            Integrate risk intelligence into your trading platform, wallet, or DeFi application. 
            Get real-time risk scores for any proposed trade.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-8">Quick Start</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">1. Get API Key</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body mb-4">
                  Sign up for a TradeFirewall account and generate your API key from the dashboard.
                </p>
                <Link href="/pricing">
                  <Button className="btn-primary">Get API Access</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">2. Make Your First Request</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body mb-4">
                  Send a POST request to analyze any trade proposal and get a risk score.
                </p>
                <Button 
                  className="btn-secondary"
                  onClick={() => copyToClipboard('curl -X POST https://api.tradefirewall.com/v1/analyze-trade', 'API endpoint')}
                >
                  Copy Example
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-8">API Endpoints</h2>
          
          <div className="space-y-8">
            {/* Analyze Trade */}
            <Card className="terminal-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-card-heading">Analyze Trade</CardTitle>
                  <Badge className="bg-primary text-background">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-label mb-2">Endpoint</h4>
                  <div className="bg-surface p-3 rounded-lg font-mono text-sm">
                    POST https://api.tradefirewall.com/v1/analyze-trade
                  </div>
                </div>

                <div>
                  <h4 className="text-label mb-2">Request Body</h4>
                  <div className="bg-surface p-4 rounded-lg">
                    <pre className="text-sm text-text-primary overflow-x-auto">
{`{
  "symbol": "BTC",
  "action": "buy",
  "amount": 5000,
  "holdingPeriod": "1day",
  "riskProfile": "balanced"
}`}
                    </pre>
                  </div>
                  <Button 
                    className="btn-secondary text-xs mt-2"
                    onClick={() => copyToClipboard(`{
  "symbol": "BTC",
  "action": "buy", 
  "amount": 5000,
  "holdingPeriod": "1day",
  "riskProfile": "balanced"
}`, 'Request example')}
                  >
                    Copy Request
                  </Button>
                </div>

                <div>
                  <h4 className="text-label mb-2">Response</h4>
                  <div className="bg-surface p-4 rounded-lg">
                    <pre className="text-sm text-text-primary overflow-x-auto">
{`{
  "riskScore": 45,
  "decision": "CAUTION",
  "confidence": 0.85,
  "reasons": [
    "Medium volatility detected",
    "Positive market sentiment"
  ],
  "recommendedAction": "Consider reducing position size by 25%",
  "suggestedPositionSize": "$3,750",
  "marketFactors": {
    "volatility": 55,
    "sentiment": 35,
    "volume": 40,
    "liquidity": 25
  },
  "dataSourcesUsed": ["SoSoValue", "SoDEX"],
  "timestamp": 1640995200000
}`}
                    </pre>
                  </div>
                  <Button 
                    className="btn-secondary text-xs mt-2"
                    onClick={() => copyToClipboard(`{
  "riskScore": 45,
  "decision": "CAUTION", 
  "confidence": 0.85,
  "reasons": ["Medium volatility detected", "Positive market sentiment"],
  "recommendedAction": "Consider reducing position size by 25%",
  "suggestedPositionSize": "$3,750",
  "marketFactors": {
    "volatility": 55,
    "sentiment": 35, 
    "volume": 40,
    "liquidity": 25
  },
  "dataSourcesUsed": ["SoSoValue", "SoDEX"],
  "timestamp": 1640995200000
}`, 'Response example')}
                  >
                    Copy Response
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Execution Preview */}
            <Card className="terminal-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-card-heading">Execution Preview</CardTitle>
                  <Badge className="bg-primary text-background">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-label mb-2">Endpoint</h4>
                  <div className="bg-surface p-3 rounded-lg font-mono text-sm">
                    POST https://api.tradefirewall.com/v1/execution-preview
                  </div>
                </div>

                <div>
                  <h4 className="text-label mb-2">Response</h4>
                  <div className="bg-surface p-4 rounded-lg">
                    <pre className="text-sm text-text-primary overflow-x-auto">
{`{
  "symbol": "BTC",
  "estimatedPrice": 45000,
  "estimatedSlippage": 0.015,
  "estimatedFees": 0.001,
  "priceImpact": 0.008,
  "executionProbability": 0.92,
  "warnings": ["High slippage expected"],
  "canExecute": true,
  "mode": "testnet"
}`}
                    </pre>
                  </div>
                  <Button 
                    className="btn-secondary text-xs mt-2"
                    onClick={() => copyToClipboard(`{
  "symbol": "BTC",
  "estimatedPrice": 45000,
  "estimatedSlippage": 0.015,
  "estimatedFees": 0.001,
  "priceImpact": 0.008,
  "executionProbability": 0.92,
  "warnings": ["High slippage expected"],
  "canExecute": true,
  "mode": "testnet"
}`, 'Execution preview response')}
                  >
                    Copy Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Authentication */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-8">Authentication</h2>
          
          <Card className="terminal-card">
            <CardContent className="pt-6 space-y-4">
              <p className="text-body">
                Include your API key in the Authorization header of all requests:
              </p>
              <div className="bg-surface p-4 rounded-lg">
                <pre className="text-sm text-text-primary">
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                </pre>
              </div>
              <Button 
                className="btn-secondary text-xs"
                onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json', 'Headers')}
              >
                Copy Headers
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Rate Limits */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-8">Rate Limits</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Free Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary mb-2">10</div>
                <div className="text-body">requests per month</div>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Advanced Trader</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary mb-2">1,000</div>
                <div className="text-body">requests per month</div>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Enterprise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary mb-2">Unlimited</div>
                <div className="text-body">custom rate limits</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Codes */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-8">Error Codes</h2>
          
          <Card className="terminal-card">
            <CardContent className="pt-6">
              <div className="terminal-table">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Code</th>
                      <th className="text-left">Description</th>
                      <th className="text-left">Solution</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-text-primary font-mono">400</td>
                      <td className="text-text-secondary">Invalid request format</td>
                      <td className="text-text-secondary">Check request body structure</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-mono">401</td>
                      <td className="text-text-secondary">Invalid API key</td>
                      <td className="text-text-secondary">Verify your API key</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-mono">404</td>
                      <td className="text-text-secondary">Symbol not found</td>
                      <td className="text-text-secondary">Use supported symbols only</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-mono">429</td>
                      <td className="text-text-secondary">Rate limit exceeded</td>
                      <td className="text-text-secondary">Upgrade your plan</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-mono">503</td>
                      <td className="text-text-secondary">Market data unavailable</td>
                      <td className="text-text-secondary">Retry after a few minutes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SDKs */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-8">SDKs & Libraries</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">JavaScript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-surface p-3 rounded-lg font-mono text-sm mb-3">
                  npm install tradefirewall
                </div>
                <Button 
                  className="w-full btn-secondary text-xs"
                  onClick={() => copyToClipboard('npm install tradefirewall', 'NPM install command')}
                >
                  Copy Install
                </Button>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Python</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-surface p-3 rounded-lg font-mono text-sm mb-3">
                  pip install tradefirewall
                </div>
                <Button 
                  className="w-full btn-secondary text-xs"
                  onClick={() => copyToClipboard('pip install tradefirewall', 'Pip install command')}
                >
                  Copy Install
                </Button>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Go</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-surface p-3 rounded-lg font-mono text-sm mb-3">
                  go get tradefirewall
                </div>
                <Button 
                  className="w-full btn-secondary text-xs"
                  onClick={() => copyToClipboard('go get tradefirewall', 'Go get command')}
                >
                  Copy Install
                </Button>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Rust</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-surface p-3 rounded-lg font-mono text-sm mb-3">
                  cargo add tradefirewall
                </div>
                <Button 
                  className="w-full btn-secondary text-xs"
                  onClick={() => copyToClipboard('cargo add tradefirewall', 'Cargo add command')}
                >
                  Copy Install
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-surface rounded-2xl p-12">
          <h2 className="text-section-heading mb-6">Ready to Integrate?</h2>
          <p className="text-xl text-body mb-8 max-w-2xl mx-auto leading-relaxed">
            Start building with TradeFirewall API today. Get your API key and begin adding risk intelligence to your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button className="btn-primary px-8 py-3 text-base">
                Get API Access
              </Button>
            </Link>
            <Button 
              className="btn-secondary px-8 py-3 text-base"
              onClick={() => {
                const email = 'support@tradefirewall.com';
                const subject = 'API Integration Support';
                const body = 'Hi, I need help integrating the TradeFirewall API. Please provide technical support.';
                window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              }}
            >
              Contact Support
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}