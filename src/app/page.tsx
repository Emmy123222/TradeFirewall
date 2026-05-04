import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Bar */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-3 text-center">
          <div className="announcement-pill inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>TradeFirewall Risk Engine is live</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="terminal-navbar sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <Link href="/" className="logo-text text-xl">
              tradefirewall<span className="logo-underscore">_</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/product" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                Product
              </Link>
              <Link href="/check-trade" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                Risk Engine
              </Link>
              <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                Pricing
              </Link>
              <Link href="/resources" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                Resources
              </Link>
              <Link href="/about" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                About
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/api" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
              API
            </Link>
            <Link href="/check-trade">
              <Button className="btn-primary px-6 py-2 text-sm">
                Go to App
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="text-label text-primary">Rule-based crypto risk intelligence</div>
                <h1 className="text-hero">
                  Pre-trade risk<br />
                  you can<br />
                  <span className="text-primary">understand</span><br />
                  <span className="text-primary">trust</span><br />
                  <span className="text-primary">act on</span>
                </h1>
              </div>
              
              <p className="text-xl text-body max-w-lg leading-relaxed">
                TradeFirewall transforms market data into institutional-grade risk intelligence. 
                Analyze proposed trades, detect hidden danger, and add confirmation controls before execution.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/check-trade">
                  <Button className="btn-primary px-8 py-3 text-base">
                    Go to Risk Engine
                  </Button>
                </Link>
                <Link href="/check-trade">
                  <Button className="btn-secondary px-8 py-3 text-base">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side - Risk Engine Preview */}
            <div className="relative">
              <Card className="terminal-card-elevated hover-lift">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-card-heading">Risk Engine Preview</CardTitle>
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* How It Works */}
                  <div className="space-y-4">
                    <div className="p-4 bg-surface rounded-lg">
                      <div className="text-sm font-medium text-text-primary mb-2">1. Enter Trade Details</div>
                      <div className="text-xs text-text-secondary">Asset, action, amount, holding period, risk profile</div>
                    </div>
                    
                    <div className="p-4 bg-surface rounded-lg">
                      <div className="text-sm font-medium text-text-primary mb-2">2. Market Data Analysis</div>
                      <div className="text-xs text-text-secondary">Real-time volatility, sentiment, volume, liquidity data</div>
                    </div>
                    
                    <div className="p-4 bg-surface rounded-lg">
                      <div className="text-sm font-medium text-text-primary mb-2">3. Risk Intelligence Scoring</div>
                      <div className="text-xs text-text-secondary">Comprehensive risk score from 0-100 with explanations</div>
                    </div>
                    
                    <div className="p-4 bg-surface rounded-lg">
                      <div className="text-sm font-medium text-text-primary mb-2">4. Safety Controls</div>
                      <div className="text-xs text-text-secondary">Confirmation gates for high-risk trades</div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-center space-y-3">
                      <div className="text-sm font-medium text-primary">Ready to analyze your trade?</div>
                      <Link href="/check-trade">
                        <Button className="w-full btn-primary text-sm">
                          Try Risk Engine
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-lg font-medium text-text-secondary mb-8">
              Trusted by risk-aware traders and builders
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                'Signal Groups',
                'DeFi Apps', 
                'Wallets',
                'Trading Bots',
                'Fund Managers',
                'Research Teams',
                'DAO Treasuries',
                'Market Analysts'
              ].map((item) => (
                <div key={item} className="trusted-pill">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full Stack Platform Section */}
      <section className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-section-heading mb-6">
              A full stack pre-trade risk platform
            </h2>
            <p className="text-xl text-body max-w-3xl mx-auto leading-relaxed">
              TradeFirewall connects market data, rule-based risk scoring, and execution controls 
              into one workflow so users can move from trade idea to safer decision.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="terminal-card hover-lift">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-sm"></div>
                </div>
                <h3 className="text-card-heading">Source of truth for trade risk</h3>
                <p className="text-body">
                  Every risk score is based on market data, volatility, sentiment, liquidity, and trade context.
                </p>
              </CardContent>
            </Card>
            
            <Card className="terminal-card hover-lift">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-sm"></div>
                </div>
                <h3 className="text-card-heading">Standardized risk scoring</h3>
                <p className="text-body">
                  Every proposed trade is converted into a comparable risk score from 0 to 100.
                </p>
              </CardContent>
            </Card>
            
            <Card className="terminal-card hover-lift">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-sm"></div>
                </div>
                <h3 className="text-card-heading">Data you can act on</h3>
                <p className="text-body">
                  Users get a clear decision: Approve, Caution, Reduce, Wait, or Block.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Cards Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-section-heading mb-6">
              Pre-trade intelligence you can understand
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Risk Engine',
                description: 'Analyze proposed trades before execution.',
                icon: '📊'
              },
              {
                title: 'Trade Statement',
                description: 'Convert every trade into a financial-style risk statement.',
                icon: '📋'
              },
              {
                title: 'Risk Intelligence Explanation',
                description: 'Explain the risk in simple language.',
                icon: '🤖'
              },
              {
                title: 'Confirmation Gate',
                description: 'Require users to confirm high-risk trades before execution.',
                icon: '🛡️'
              },
              {
                title: 'API',
                description: 'Let wallets, bots, and DeFi apps call TradeFirewall risk checks.',
                icon: '🔌'
              },
              {
                title: 'Dashboard',
                description: 'Track recent checks, blocked trades, alerts, and simulated losses avoided.',
                icon: '📈'
              }
            ].map((product, index) => (
              <Card key={index} className="terminal-card hover-lift">
                <CardContent className="pt-8 space-y-4">
                  <div className="text-2xl mb-4">{product.icon}</div>
                  <h3 className="text-card-heading">{product.title}</h3>
                  <p className="text-body">{product.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-surface border-t border-border">
        <div className="max-w-4xl mx-auto text-center px-4 space-y-8">
          <h2 className="text-section-heading">Ready to add risk intelligence to your trades?</h2>
          <p className="text-xl text-body leading-relaxed">
            Join traders and builders using TradeFirewall to make safer decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/check-trade">
              <Button className="btn-primary px-8 py-3 text-base">
                Start Risk Analysis
              </Button>
            </Link>
            <Link href="/api">
              <Button className="btn-secondary px-8 py-3 text-base">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="logo-text text-xl">
                tradefirewall<span className="logo-underscore">_</span>
              </div>
              <p className="text-body max-w-sm">
                Rule-based pre-trade risk intelligence for crypto traders and builders.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-card-heading">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-body hover:text-text-primary transition-colors">About</a></li>
                <li><a href="#" className="text-body hover:text-text-primary transition-colors">Contact</a></li>
                <li><Link href="/pricing" className="text-body hover:text-text-primary transition-colors">Pricing</Link></li>
                <li><a href="#" className="text-body hover:text-text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-card-heading">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/check-trade" className="text-body hover:text-text-primary transition-colors">Risk Engine</Link></li>
                <li><Link href="/dashboard" className="text-body hover:text-text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/api" className="text-body hover:text-text-primary transition-colors">API</Link></li>
                <li><a href="#" className="text-body hover:text-text-primary transition-colors">Confirmation Gate</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-card-heading">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-body hover:text-text-primary transition-colors">Docs</a></li>
                <li><a href="#" className="text-body hover:text-text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="text-body hover:text-text-primary transition-colors">Demo</a></li>
                <li><a href="#" className="text-body hover:text-text-primary transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-body text-sm">
              &copy; 2026 TradeFirewall. Built for SoSoValue Buildathon.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-body hover:text-text-primary transition-colors text-sm">X</a>
              <a href="#" className="text-body hover:text-text-primary transition-colors text-sm">Discord</a>
              <a href="#" className="text-body hover:text-text-primary transition-colors text-sm">Telegram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}