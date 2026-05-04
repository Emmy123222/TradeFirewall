'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PricingPage() {
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
            Choose Your Risk Intelligence Plan
          </h1>
          <p className="text-xl text-body max-w-3xl mx-auto leading-relaxed">
            From individual traders to institutional platforms, TradeFirewall scales with your needs. 
            Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          {/* Free Plan */}
          <Card className="terminal-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-card-heading">Free</CardTitle>
              <div className="text-4xl font-bold text-text-primary">$0</div>
              <div className="text-sm text-text-secondary">Forever</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">10 trade checks/month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Basic risk scoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Risk explanations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Web dashboard</span>
                </li>
              </ul>
              <Link href="/check-trade">
                <Button className="w-full btn-secondary mt-6">
                  Start Free
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="terminal-card border-primary/30 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-background px-3 py-1 text-xs">
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-card-heading">Pro</CardTitle>
              <div className="text-4xl font-bold text-text-primary">$29</div>
              <div className="text-sm text-text-secondary">per month</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">500 trade checks/month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Advanced risk models</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Portfolio risk tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Real-time alerts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Export reports</span>
                </li>
              </ul>
              <Button 
                className="w-full btn-primary mt-6"
                onClick={() => {
                  const email = 'contact@tradefirewall.com';
                  const subject = 'Pro Plan Inquiry';
                  const body = 'Hi, I am interested in the TradeFirewall Pro plan. Please provide more information about pricing and features.';
                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Start Pro Trial
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Trader Plan */}
          <Card className="terminal-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-card-heading">Advanced Trader</CardTitle>
              <div className="text-4xl font-bold text-text-primary">$99</div>
              <div className="text-sm text-text-secondary">per month</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Unlimited trade checks</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Custom risk profiles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">API access (1K calls/mo)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Priority support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Webhook integrations</span>
                </li>
              </ul>
              <Button 
                className="w-full btn-secondary mt-6"
                onClick={() => {
                  const email = 'contact@tradefirewall.com';
                  const subject = 'Advanced Trader Plan Inquiry';
                  const body = 'Hi, I am interested in the TradeFirewall Advanced Trader plan. Please provide more information about pricing and features.';
                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Start Advanced
              </Button>
            </CardContent>
          </Card>

          {/* Community Bot Plan */}
          <Card className="terminal-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-card-heading">Community Bot</CardTitle>
              <div className="text-4xl font-bold text-text-primary">$199</div>
              <div className="text-sm text-text-secondary">per month</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">10K API calls/month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Telegram/Discord bots</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Signal validation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Community dashboard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">White-label options</span>
                </li>
              </ul>
              <Button 
                className="w-full btn-secondary mt-6"
                onClick={() => {
                  const email = 'contact@tradefirewall.com';
                  const subject = 'Community Bot Plan Inquiry';
                  const body = 'Hi, I am interested in the TradeFirewall Community Bot plan. Please provide more information about pricing and features.';
                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Start Community
              </Button>
            </CardContent>
          </Card>

          {/* API Plan */}
          <Card className="terminal-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-card-heading">API Enterprise</CardTitle>
              <div className="text-4xl font-bold text-text-primary">Custom</div>
              <div className="text-sm text-text-secondary">Contact us</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Unlimited API calls</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Custom integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">On-premise deployment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">Dedicated support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                  </div>
                  <span className="text-text-secondary">99.99% SLA</span>
                </li>
              </ul>
              <Button 
                className="w-full btn-secondary mt-6"
                onClick={() => {
                  const email = 'sales@tradefirewall.com';
                  const subject = 'Enterprise API Plan Inquiry';
                  const body = 'Hi, I am interested in the TradeFirewall Enterprise API plan. Please provide more information about custom pricing and enterprise features.';
                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-12 text-center">Feature Comparison</h2>
          
          <Card className="terminal-card">
            <CardContent className="p-0">
              <div className="terminal-table">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Feature</th>
                      <th className="text-center">Free</th>
                      <th className="text-center">Pro</th>
                      <th className="text-center">Advanced</th>
                      <th className="text-center">Community</th>
                      <th className="text-center">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-text-primary font-medium">Trade Checks per Month</td>
                      <td className="text-center text-text-secondary">10</td>
                      <td className="text-center text-text-secondary">500</td>
                      <td className="text-center text-text-secondary">Unlimited</td>
                      <td className="text-center text-text-secondary">Unlimited</td>
                      <td className="text-center text-text-secondary">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">Risk Scoring</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">AI Explanations</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">Portfolio Tracking</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">Real-time Alerts</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">API Access</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-success">1K/mo</td>
                      <td className="text-center text-success">10K/mo</td>
                      <td className="text-center text-success">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">Custom Risk Models</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">Webhook Integrations</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">White-label Options</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-success">✓</td>
                      <td className="text-center text-success">✓</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">On-premise Deployment</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-text-muted">—</td>
                      <td className="text-center text-success">✓</td>
                    </tr>
                    <tr>
                      <td className="text-text-primary font-medium">Support Level</td>
                      <td className="text-center text-text-secondary">Community</td>
                      <td className="text-center text-text-secondary">Email</td>
                      <td className="text-center text-text-secondary">Priority</td>
                      <td className="text-center text-text-secondary">Priority</td>
                      <td className="text-center text-text-secondary">Dedicated</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-12 text-center">Choose Based on Your Use Case</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Individual Traders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body mb-4">
                  Perfect for retail traders who want to add risk intelligence to their personal trading.
                </p>
                <div className="text-sm text-text-secondary mb-4">
                  <strong className="text-text-primary">Recommended:</strong> Free → Pro
                </div>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Start with 10 free checks</li>
                  <li>• Upgrade for portfolio tracking</li>
                  <li>• Real-time market alerts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Professional Traders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body mb-4">
                  For active traders and fund managers who need unlimited analysis and custom models.
                </p>
                <div className="text-sm text-text-secondary mb-4">
                  <strong className="text-text-primary">Recommended:</strong> Advanced Trader
                </div>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Unlimited trade analysis</li>
                  <li>• Custom risk profiles</li>
                  <li>• API integration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Signal Groups & Communities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body mb-4">
                  Ideal for Telegram/Discord communities that share trading signals and want to add risk validation.
                </p>
                <div className="text-sm text-text-secondary mb-4">
                  <strong className="text-text-primary">Recommended:</strong> Community Bot
                </div>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Bot integrations</li>
                  <li>• Signal validation</li>
                  <li>• Community protection</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Trading Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body mb-4">
                  For exchanges, wallets, and DeFi platforms that want to integrate risk intelligence.
                </p>
                <div className="text-sm text-text-secondary mb-4">
                  <strong className="text-text-primary">Recommended:</strong> API Enterprise
                </div>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Unlimited API calls</li>
                  <li>• Custom integrations</li>
                  <li>• White-label solutions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">DeFi Protocols</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body mb-4">
                  For DeFi apps that want to protect users from high-risk swaps and leverage positions.
                </p>
                <div className="text-sm text-text-secondary mb-4">
                  <strong className="text-text-primary">Recommended:</strong> API Enterprise
                </div>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• On-premise deployment</li>
                  <li>• Custom risk models</li>
                  <li>• Protocol integration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="terminal-card">
              <CardHeader>
                <CardTitle className="text-card-heading">Institutional Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body mb-4">
                  For hedge funds, family offices, and institutions requiring enterprise-grade risk management.
                </p>
                <div className="text-sm text-text-secondary mb-4">
                  <strong className="text-text-primary">Recommended:</strong> API Enterprise
                </div>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Dedicated support</li>
                  <li>• Compliance reporting</li>
                  <li>• Custom deployment</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-section-heading mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-card-heading mb-2">How accurate are the risk scores?</h3>
                <p className="text-body">
                  Our risk scores are based on multiple market data sources, volatility analysis, sentiment tracking, 
                  and AI models trained on historical market behavior. While no system is perfect, our models 
                  have shown strong correlation with actual trade outcomes.
                </p>
              </div>
              
              <div>
                <h3 className="text-card-heading mb-2">Can I cancel anytime?</h3>
                <p className="text-body">
                  Yes, all plans can be canceled at any time. You'll retain access until the end of your billing period, 
                  and we don't charge cancellation fees.
                </p>
              </div>
              
              <div>
                <h3 className="text-card-heading mb-2">Do you offer refunds?</h3>
                <p className="text-body">
                  We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied, 
                  contact support for a full refund.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-card-heading mb-2">What data sources do you use?</h3>
                <p className="text-body">
                  We integrate with multiple market data providers, social sentiment APIs, on-chain analytics, 
                  and news sources to provide comprehensive risk analysis. Data sources include SoSoValue, 
                  CoinGecko, and other institutional-grade providers.
                </p>
              </div>
              
              <div>
                <h3 className="text-card-heading mb-2">Is this financial advice?</h3>
                <p className="text-body">
                  No, TradeFirewall provides risk analysis and educational information only. 
                  Our tools are designed to help you make more informed decisions, but all trading 
                  decisions remain your responsibility.
                </p>
              </div>
              
              <div>
                <h3 className="text-card-heading mb-2">How does the API work?</h3>
                <p className="text-body">
                  Our REST API allows you to submit trade proposals and receive risk analysis in real-time. 
                  Integration typically takes less than an hour with our comprehensive documentation and SDKs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-surface rounded-2xl p-12">
          <h2 className="text-section-heading mb-6">Ready to Start?</h2>
          <p className="text-xl text-body mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of traders using TradeFirewall to make safer, more informed trading decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/check-trade">
              <Button className="btn-primary px-8 py-3 text-base">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/api">
              <Button className="btn-secondary px-8 py-3 text-base">
                View API Docs
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}