# TradeFirewall

**TradeFirewall** is a pre-trade crypto risk engine that helps users analyze a proposed trade before execution.

Instead of acting like a normal crypto signal bot, TradeFirewall works as a **risk-control layer**. A user enters a trade idea, the app fetches real market data, calculates a risk score, explains the risk in simple language, recommends a safer action, and blocks or warns users before risky execution paths.

> TradeFirewall helps users avoid bad trades before they happen.

---

## Table of Contents

- [Overview](#overview)
- [Problem](#problem)
- [Solution](#solution)
- [Core Features](#core-features)
- [How TradeFirewall Works](#how-tradefirewall-works)
- [System Architecture](#system-architecture)
- [User Flow](#user-flow)
- [Data Flow](#data-flow)
- [Risk Engine](#risk-engine)
- [SoSoValue Integration](#sosovalue-integration)
- [SoDEX Integration](#sodex-integration)
- [Rule-Based Risk Explanation](#rule-based-risk-explanation)
- [Pages](#pages)
- [API Routes](#api-routes)
- [Storage](#storage)
- [Button Behavior](#button-behavior)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Safety Rules](#safety-rules)
- [Business Model](#business-model)
- [Roadmap](#roadmap)
- [Disclaimer](#disclaimer)

---

## Overview

TradeFirewall is designed for:

- Crypto traders
- DeFi users
- Signal groups
- Trading communities
- Wallets
- Trading bots
- DAO treasuries
- Small fund managers
- Market researchers

The product allows users to check a proposed trade before taking action.

Example:

```text
Buy $5,000 SOL
Holding Period: Intraday
Risk Profile: Conservative
```

TradeFirewall analyzes this trade and returns:

```text
Risk Score: 82/100
Decision: BLOCK
Main Risk: High volatility, weak liquidity, large position size
Recommended Action: Reduce size or wait for stronger confirmation
```

---

## Problem

Crypto users often make trades based on hype, emotion, incomplete data, or social signals.

Common problems include:

- Traders enter positions without checking risk.
- Signal groups push trades without context.
- Users do not understand volatility, liquidity, or slippage.
- Execution risk is ignored until it is too late.
- Market data and trading execution are disconnected.
- Users often need a simple answer: proceed, reduce, wait, or cancel.

Most crypto tools focus on finding opportunities.

TradeFirewall focuses on preventing dangerous trades.

---

## Solution

TradeFirewall creates a risk-control layer between trade idea and execution.

It helps users answer:

- Is this trade risky?
- Is the position size too large?
- Is liquidity strong enough?
- Is volatility too high?
- Is market momentum weak?
- Should I reduce size?
- Should I wait?
- Should this trade be blocked?

---

## Core Features

### 1. Trade Risk Engine

Users enter a proposed trade and receive a risk report.

Inputs:

- Asset symbol
- Buy or sell
- Amount
- Holding period
- Risk profile
- Optional notes
- Optional stop loss
- Optional take profit

Outputs:

- Risk score
- Decision
- Risk breakdown
- Risk explanation
- Recommended action
- Suggested position size
- Execution preview

---

### 2. Risk Score

TradeFirewall calculates a risk score from `0` to `100`.

| Score Range | Decision | Meaning |
|---|---|---|
| 0–25 | APPROVE | Risk appears acceptable |
| 26–50 | CAUTION | Trade may proceed carefully |
| 51–75 | REDUCE_OR_WAIT | Trade is risky; reduce size or wait |
| 76–100 | BLOCK | Trade is too risky under current conditions |

---

### 3. Risk Intelligence Explanation

TradeFirewall generates a readable explanation using rule-based logic.

This explanation helps users understand:

- Why the trade is risky
- Which risk factors matter most
- Whether the trade size is too large
- What safer action to take
- What to watch before entering

---

### 4. Confirmation Gate

High-risk trades require confirmation before moving to execution preview.

Users must confirm:

- They understand this is not financial advice.
- They understand the trade may lose money.
- They understand the risk score is high.
- They understand TradeFirewall recommends caution.
- They still want to continue.

---

### 5. SoDEX Execution Preview

TradeFirewall uses SoDEX market data to estimate execution risk.

The execution preview may include:

- Estimated price
- Estimated slippage
- Liquidity warning
- Orderbook depth
- Estimated fees if available
- Preview/testnet mode

No real trade is executed by default.

---

### 6. Trading Dashboard

The dashboard shows only real user-generated data:

- Saved risk reports
- Recent trade checks
- Average risk score
- Blocked trades
- Watchlist assets
- High-risk alerts
- Risk trend
- Recommended next actions

---

## How TradeFirewall Works

```mermaid
flowchart TD
    A[User Enters Trade Idea] --> B[Validate Input]
    B --> C[Fetch SoSoValue Market Intelligence]
    C --> D[Fetch SoDEX Market Data]
    D --> E[Run TradeFirewall Risk Engine]
    E --> F[Generate Risk Score]
    F --> G[Generate Rule-Based Risk Explanation]
    G --> H[Show Risk Report]
    H --> I{Risk Score > 50?}
    I -- No --> J[Allow Save Report / Add to Watchlist]
    I -- Yes --> K[Show Confirmation Gate]
    K --> L{User Confirms All Warnings?}
    L -- No --> M[Cancel or Reduce Trade]
    L -- Yes --> N[Show Execution Preview]
    N --> O[Save Report / View Dashboard]
```

---

## System Architecture

```mermaid
flowchart LR
    subgraph Frontend[Frontend - Next.js]
        A[Landing Page]
        B[Trade Risk Engine]
        C[Trading Dashboard]
        D[Pricing Page]
        E[API Docs Page]
    end

    subgraph Backend[Backend - API Routes]
        F[/api/analyze-trade]
        G[/api/reports]
        H[/api/watchlist]
        I[/api/execution-preview]
    end

    subgraph DataSources[External Data Sources]
        J[SoSoValue API]
        K[SoDEX Public REST API]
    end

    subgraph CoreLogic[Core Logic]
        L[Risk Engine]
        M[Risk Explanation Engine]
        N[Slippage Estimator]
        O[Report Storage]
    end

    A --> B
    B --> F
    F --> J
    F --> K
    J --> L
    K --> L
    K --> N
    L --> M
    M --> B
    B --> G
    B --> H
    G --> C
    H --> C
    I --> K
```

---

## High-Level Product Flow

```mermaid
flowchart TD
    A[Home Page] --> B[Check a Trade]
    B --> C[Trade Risk Engine]
    C --> D[Market Data Snapshot]
    D --> E[Risk Score]
    E --> F[Risk Breakdown]
    F --> G[Risk Intelligence Explanation]
    G --> H[Recommended Action]
    H --> I{High Risk?}
    I -- Yes --> J[Confirmation Gate]
    J --> K[Execution Preview]
    I -- No --> L[Save Risk Report]
    K --> L
    L --> M[Trading Dashboard]
```

---

## User Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as TradeFirewall UI
    participant API as Backend API
    participant SoSo as SoSoValue API
    participant SoDEX as SoDEX API
    participant Risk as Risk Engine
    participant Explain as Risk Explanation Engine
    participant Store as Storage

    User->>UI: Enter proposed trade
    UI->>API: POST /api/analyze-trade
    API->>API: Validate input
    API->>SoSo: Fetch market intelligence
    API->>SoDEX: Fetch ticker/orderbook/klines
    SoSo-->>API: Market data
    SoDEX-->>API: Liquidity + price data
    API->>Risk: Calculate risk score
    Risk-->>API: Risk score + factors
    API->>Explain: Generate explanation
    Explain-->>API: User-readable summary
    API-->>UI: Return risk report
    UI-->>User: Display risk score and recommendation

    alt User saves report
        User->>UI: Click Save Risk Report
        UI->>Store: Save report
        Store-->>UI: Saved
    end

    alt High-risk trade
        UI-->>User: Show confirmation gate
        User->>UI: Confirm warnings
        UI->>API: Request execution preview
        API->>SoDEX: Fetch orderbook/slippage data
        SoDEX-->>API: Execution preview data
        API-->>UI: Return preview
    end
```

---

## Data Flow

```mermaid
flowchart TD
    A[Trade Input] --> B[Input Validator]

    B --> C[SoSoValue Market Data]
    B --> D[SoDEX Market Data]

    C --> E[Market Intelligence Normalizer]
    D --> F[Liquidity and Execution Normalizer]

    E --> G[Risk Engine]
    F --> G

    G --> H[Risk Score]
    G --> I[Risk Factors]
    G --> J[Recommended Action]

    H --> K[Risk Explanation Engine]
    I --> K
    J --> K

    K --> L[Risk Report]

    L --> M[Save Report]
    L --> N[Download PDF]
    L --> O[Copy Summary]
    L --> P[Add to Watchlist]
    L --> Q[Confirmation Gate]
```

---

## Risk Engine

The risk engine is the core of TradeFirewall.

It combines:

- User trade input
- SoSoValue market intelligence
- SoDEX market data
- Liquidity conditions
- Volatility
- Momentum
- Position size
- Holding period
- User risk profile

---

## Risk Engine Inputs

```mermaid
flowchart LR
    A[User Input] --> G[Risk Engine]
    B[Market Trend] --> G
    C[Volatility] --> G
    D[Volume] --> G
    E[Liquidity] --> G
    F[Sentiment / News Context] --> G
    H[Orderbook Depth] --> G
    I[Slippage Estimate] --> G
    J[Holding Period] --> G
    K[Risk Profile] --> G
    L[Position Size] --> G

    G --> M[Risk Score]
    G --> N[Decision]
    G --> O[Risk Factors]
    G --> P[Recommended Action]
```

---

## Risk Factors

| Risk Factor | Description |
|---|---|
| Volatility | Measures how unstable the asset price is |
| Liquidity | Measures whether the market can handle the trade size |
| Slippage | Estimates how much price may move during execution |
| Market Momentum | Checks whether the asset is trending up, down, or sideways |
| Volume | Measures market activity and trade participation |
| Sentiment / News | Adds market intelligence context where available |
| Sector Strength | Checks broader sector/index conditions |
| Position Size | Checks whether the trade amount is too large |
| Holding Period | Shorter holding periods usually increase risk |
| Risk Profile | Conservative users get stricter scoring |
| Execution Risk | Combines slippage, liquidity, and orderbook depth |

---

## Risk Decision Tree

```mermaid
flowchart TD
    A[Risk Score Calculated] --> B{Score 0-25?}
    B -- Yes --> C[APPROVE]
    B -- No --> D{Score 26-50?}
    D -- Yes --> E[CAUTION]
    D -- No --> F{Score 51-75?}
    F -- Yes --> G[REDUCE_OR_WAIT]
    F -- No --> H[BLOCK]

    C --> I[Allow Save Report]
    E --> I
    G --> J[Show Confirmation Gate]
    H --> J
    J --> K[Cancel / Reduce / Continue Anyway]
```

---

## Risk Score Output

```ts
type RiskDecision = "APPROVE" | "CAUTION" | "REDUCE_OR_WAIT" | "BLOCK";

type RiskReport = {
  id: string;
  symbol: string;
  action: "BUY" | "SELL";
  amountUsd: number;
  holdingPeriod: "INTRADAY" | "1_DAY" | "7_DAYS" | "30_DAYS";
  riskProfile: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
  riskScore: number;
  decision: RiskDecision;
  confidence: number;
  riskFactors: RiskFactor[];
  recommendedAction: string;
  suggestedPositionSize?: string;
  explanation: RiskExplanation;
  dataSourcesUsed: string[];
  createdAt: string;
};
```

---

## SoSoValue Integration

SoSoValue is used as the market intelligence layer.

TradeFirewall uses SoSoValue for:

- Market summary
- Asset trend
- Volume context
- Market intelligence
- News or sentiment context where available
- Sector or index context where available
- Risk context for the asset

---

## SoSoValue Data Flow

```mermaid
flowchart TD
    A[User Enters Symbol] --> B[Backend API]
    B --> C[SoSoValue API]
    C --> D[Market Summary]
    C --> E[Trend Data]
    C --> F[Volume Context]
    C --> G[Sentiment / News Context]
    C --> H[Sector / Index Context]
    D --> I[Normalize Market Intelligence]
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J[Risk Engine]
```

---

## SoDEX Integration

SoDEX is used as the market microstructure and execution-preview layer.

TradeFirewall uses SoDEX for:

- Public market data
- Ticker data
- Orderbook data
- Klines/candles
- Recent trades
- Liquidity checks
- Slippage estimation
- Execution preview

SoDEX market data does not require a normal API key.

SoDEX API keys are used for signing authenticated actions. In SoDEX, API keys are EVM addresses that can sign on behalf of a master account or sub-account. They are not needed for public market-data reads.

---

## SoDEX Data Flow

```mermaid
flowchart TD
    A[Trade Input] --> B[Validate Symbol]
    B --> C[SoDEX Public REST API]
    C --> D[Ticker]
    C --> E[Orderbook]
    C --> F[Klines]
    C --> G[Recent Trades]

    D --> H[Price Context]
    E --> I[Liquidity Depth]
    E --> J[Slippage Estimate]
    F --> K[Volatility Estimate]
    F --> L[Momentum Estimate]
    G --> M[Activity Estimate]

    H --> N[Risk Engine]
    I --> N
    J --> N
    K --> N
    L --> N
    M --> N

    N --> O[Execution Preview]
```

---

## SoDEX Usage Levels

```mermaid
flowchart TD
    A[SoDEX Integration] --> B[Level 1: MVP]
    A --> C[Level 2: Future]

    B --> D[Public Market Data]
    B --> E[Ticker]
    B --> F[Orderbook]
    B --> G[Klines]
    B --> H[Recent Trades]
    B --> I[Slippage Estimate]
    B --> J[Execution Preview]

    C --> K[Testnet Order Placement]
    C --> L[EIP-712 Signing]
    C --> M[Authenticated Actions]
    C --> N[Cancel Orders]
    C --> O[Transfer Assets]

    J --> P[No Wallet Required]
    K --> Q[Wallet + Signature Required]
```

---

## Wallet and Signing Flow

Users should not connect a wallet before risk analysis.

Wallet connection is only needed for account-specific or authenticated execution actions.

```mermaid
flowchart TD
    A[Open Trade Risk Engine] --> B[Enter Trade]
    B --> C[Analyze Risk Without Wallet]
    C --> D[View Risk Report]
    D --> E{User Wants Execution?}
    E -- No --> F[Save Report / Add Watchlist]
    E -- Yes --> G{High Risk?}
    G -- Yes --> H[Confirmation Gate]
    G -- No --> I[Execution Preview]
    H --> I
    I --> J[Connect Wallet]
    J --> K[Sign Typed Data]
    K --> L[Testnet Action Only]
```

---

## Rule-Based Risk Explanation

TradeFirewall currently does not use an external AI model, LLM, OpenAI API, or GPT model.

The explanation is generated using rule-based logic.

The explanation engine takes:

- Risk score
- Decision
- Risk factors
- Recommended action
- Suggested position size
- Market data summary

And returns:

- Summary
- Main danger
- Safer action
- What to watch next
- Uncertainty note

---

## Explanation Engine Flow

```mermaid
flowchart TD
    A[Risk Score] --> F[Rule-Based Explanation Engine]
    B[Decision] --> F
    C[Risk Factors] --> F
    D[Recommended Action] --> F
    E[Market Summary] --> F

    F --> G[Summary]
    F --> H[Main Danger]
    F --> I[Safer Action]
    F --> J[Watch Next]
    F --> K[Uncertainty Note]
```

---

## Pages

TradeFirewall has five main pages.

```mermaid
flowchart TD
    A[Home /] --> B[Trade Risk Engine /check-trade]
    A --> C[Trading Dashboard /dashboard]
    A --> D[Pricing /pricing]
    A --> E[API Docs /api]

    B --> F[Risk Report Section]
    B --> G[Confirmation Gate Component]
    B --> H[Execution Preview Component]
    C --> I[Saved Reports]
    C --> J[Watchlist]
    C --> K[Risk History]
```

---

### 1. Home Page

Route:

```text
/
```

Purpose:

- Explain the product
- Show the value proposition
- Introduce TradeFirewall
- Push users to analyze a trade

Main CTA:

```text
Check a Trade
```

---

### 2. Trade Risk Engine

Route:

```text
/check-trade
```

Purpose:

- Analyze one proposed trade
- Generate a risk report
- Show recommendation
- Trigger confirmation gate for risky trades

---

### 3. Trading Dashboard

Route:

```text
/dashboard
```

Purpose:

- Show saved risk reports
- Show recent trade checks
- Show watchlist
- Show high-risk alerts
- Show user-generated risk history

---

### 4. Pricing Page

Route:

```text
/pricing
```

Purpose:

- Show the business model
- Explain paid plans
- Show API and community pricing

---

### 5. API Docs Page

Route:

```text
/api
```

Purpose:

- Explain how external apps can use TradeFirewall
- Show API examples
- Show request/response formats

---

## API Routes

```mermaid
flowchart LR
    A[Frontend] --> B[POST /api/analyze-trade]
    A --> C[GET /api/reports]
    A --> D[POST /api/reports/save]
    A --> E[GET /api/watchlist]
    A --> F[POST /api/watchlist]
    A --> G[POST /api/execution-preview]

    B --> H[SoSoValue API]
    B --> I[SoDEX API]
    B --> J[Risk Engine]
    B --> K[Explanation Engine]

    D --> L[Storage]
    C --> L
    E --> L
    F --> L
    G --> I
```

---

### POST `/api/analyze-trade`

Main endpoint for the Trade Risk Engine.

Responsibilities:

1. Validate user input
2. Fetch SoSoValue data
3. Fetch SoDEX market data
4. Run the risk engine
5. Generate rule-based explanation
6. Return full risk report

---

### GET `/api/reports`

Returns saved user-generated risk reports.

---

### POST `/api/reports/save`

Saves the current risk report.

---

### GET `/api/watchlist`

Returns user-added watchlist assets.

---

### POST `/api/watchlist`

Adds an asset to the watchlist.

---

### POST `/api/execution-preview`

Returns an execution preview using SoDEX market data.

No real trade execution by default.

---

## Storage

TradeFirewall stores only real user-generated data.

Allowed data:

- Real saved risk reports
- Real user-added watchlist assets
- Real dashboard history generated from user actions
- Real report timestamps
- Real calculated risk scores

Not allowed:

- Fake reports
- Fake watchlist assets
- Fake dashboard metrics
- Fake seeded trades
- Hardcoded market results

---

## Storage Model

```mermaid
erDiagram
    RISK_REPORT {
        string id
        string symbol
        string action
        float amountUsd
        string holdingPeriod
        string riskProfile
        int riskScore
        string decision
        float confidence
        string recommendedAction
        string suggestedPositionSize
        string createdAt
    }

    RISK_FACTOR {
        string id
        string reportId
        string factorName
        string reading
        string riskLevel
        float weight
        string explanation
    }

    WATCHLIST_ASSET {
        string id
        string symbol
        string addedAt
        int latestRiskScore
        string latestDecision
    }

    RISK_REPORT ||--o{ RISK_FACTOR : contains
```

---

## Local Storage Keys

If no database is configured, TradeFirewall may use local storage for user-generated data only.

```text
tradefirewall_reports
tradefirewall_watchlist
tradefirewall_settings
```

Local storage must not be preloaded with fake reports.

---

## Button Behavior

Every visible button must work.

```mermaid
flowchart TD
    A[Button Click] --> B{Does Feature Exist?}
    B -- Yes --> C[Run Real Action]
    B -- No --> D[Disable Button or Remove It]
    C --> E{Success?}
    E -- Yes --> F[Show Success Toast]
    E -- No --> G[Show Error Toast]
```

---

### Important Buttons

| Button | Behavior |
|---|---|
| Check a Trade | Navigate to `/check-trade` |
| Analyze Trade Risk | Fetch data and run risk analysis |
| Add to Watchlist | Save current asset to watchlist |
| Save Risk Report | Save current report |
| New Analysis | Reset form and current report |
| View Previous Reports | Navigate to `/dashboard#reports` |
| Download PDF | Download current report as PDF |
| Copy Summary | Copy report summary to clipboard |
| Share Report Link | Only show if report route exists |
| Add Asset | Add new watchlist asset |
| Reduce Size | Apply suggested smaller amount |
| Cancel Trade | Stop high-risk flow |
| Continue Anyway | Unlock execution preview after confirmation |

---

## Confirmation Gate

```mermaid
stateDiagram-v2
    [*] --> RiskReport
    RiskReport --> ConfirmationRequired: Risk score > 50
    RiskReport --> SaveReport: Risk score <= 50

    ConfirmationRequired --> WaitingForCheckboxes
    WaitingForCheckboxes --> ContinueDisabled
    ContinueDisabled --> ContinueEnabled: All checkboxes selected

    ContinueEnabled --> ExecutionPreview: User clicks Continue Anyway
    WaitingForCheckboxes --> Cancelled: User clicks Cancel
    WaitingForCheckboxes --> Reduced: User clicks Reduce Size

    ExecutionPreview --> Saved
    Cancelled --> Saved
    Reduced --> RiskReport
```

---

## Environment Variables

Create a `.env.example` file:

```env
# SoSoValue
SOSOVALUE_API_KEY=
SOSOVALUE_API_BASE_URL=

# SoDEX public market data does not require a normal API key
SODEX_API_KEY=not_required_for_market_data

# SoDEX Testnet REST
SODEX_SPOT_REST_URL=https://testnet-gw.sodex.dev/api/v1/spot
SODEX_PERPS_REST_URL=https://testnet-gw.sodex.dev/api/v1/perps

# SoDEX Testnet WebSocket
SODEX_SPOT_WS_URL=wss://testnet-gw.sodex.dev/ws/spot
SODEX_PERPS_WS_URL=wss://testnet-gw.sodex.dev/ws/perps

# Optional database
DATABASE_URL=
```

---

## Installation

```bash
npm install
```

---

## Running Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Build

```bash
npm run build
```

---

## Lint

```bash
npm run lint
```

---

## Type Check

```bash
npm run typecheck
```

---

## Project Structure

```text
tradefirewall/
├── app/
│   ├── page.tsx
│   ├── check-trade/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── api/
│   │   ├── page.tsx
│   │   ├── analyze-trade/
│   │   │   └── route.ts
│   │   ├── reports/
│   │   │   └── route.ts
│   │   ├── reports/
│   │   │   └── save/
│   │   │       └── route.ts
│   │   ├── watchlist/
│   │   │   └── route.ts
│   │   └── execution-preview/
│   │       └── route.ts
│   │
├── components/
│   ├── TradeInputForm.tsx
│   ├── MarketDataSnapshot.tsx
│   ├── RiskScoreCard.tsx
│   ├── RiskBreakdownTable.tsx
│   ├── RiskExplanationPanel.tsx
│   ├── RecommendedActionCard.tsx
│   ├── ConfirmationGate.tsx
│   ├── ExecutionPreview.tsx
│   ├── DashboardStats.tsx
│   ├── WatchlistTable.tsx
│   └── RecentRiskChecksTable.tsx
│
├── lib/
│   ├── sosovalue.ts
│   ├── sodex.ts
│   ├── riskEngine.ts
│   ├── riskExplanation.ts
│   ├── storage.ts
│   ├── pdf.ts
│   └── validation.ts
│
├── types/
│   ├── trade.ts
│   ├── risk.ts
│   ├── report.ts
│   └── market.ts
│
├── public/
│   └── assets/
│
├── .env.example
├── README.md
├── package.json
└── tsconfig.json
```

---

## Component Architecture

```mermaid
flowchart TD
    A[TradeRiskEnginePage] --> B[RiskEngineHeader]
    A --> C[TradeInputForm]
    A --> D[LiveTradePreview]
    A --> E[MarketDataSnapshot]
    A --> F[RiskScoreCard]
    A --> G[RiskBreakdownTable]
    A --> H[RiskExplanationPanel]
    A --> I[RecommendedActionCard]
    A --> J[ConfirmationGate]
    A --> K[ExecutionPreview]
    A --> L[SaveExportActions]
    A --> M[RecentRiskChecksTable]

    C --> N[Form Validation]
    F --> O[DecisionBadge]
    G --> P[RiskFactorRow]
    J --> Q[ConfirmationCheckbox]
```

---

## Safety Rules

TradeFirewall must follow these rules:

1. No mock market data.
2. No dummy dashboard data.
3. No fake risk scores.
4. No silent API fallback.
5. No wallet required before analysis.
6. No signing before risk report.
7. No blind signatures.
8. No mainnet execution by default.
9. No auto-execution.
10. Always show “Not financial advice.”
11. High-risk trades require confirmation.
12. API keys must remain server-side.
13. All user inputs must be validated.
14. All errors must be shown clearly.

---

## Error Handling

```mermaid
flowchart TD
    A[API Request] --> B{Success?}
    B -- Yes --> C[Return Data]
    B -- No --> D{Error Type}

    D --> E[Missing API Key]
    D --> F[Invalid Symbol]
    D --> G[API Timeout]
    D --> H[Market Data Unavailable]
    D --> I[Storage Error]

    E --> J[Show Setup Error]
    F --> K[Show Unsupported Asset Error]
    G --> L[Show Try Again Later]
    H --> M[Show Market Data Error]
    I --> N[Show Save Error]
```

---

## Empty States

| State | Message |
|---|---|
| No reports | No trade checks yet. Start by analyzing your first trade. |
| No watchlist | No assets in your watchlist yet. |
| Missing API key | Live market data is not connected. Please configure API keys. |
| API failure | Market data is temporarily unavailable. Please try again later. |
| Unsupported asset | This asset is not supported by the connected market data sources. |

---

## Business Model

TradeFirewall can be monetized through multiple plans.

```mermaid
flowchart TD
    A[TradeFirewall Business Model] --> B[Free Plan]
    A --> C[Pro Trader]
    A --> D[Advanced Trader]
    A --> E[Community Bot]
    A --> F[API Plan]

    B --> G[Limited risk checks]
    C --> H[Unlimited risk checks]
    D --> I[Portfolio risk + watchlist alerts]
    E --> J[Telegram/Discord signal group risk checks]
    F --> K[Wallets, bots, DeFi apps]
```

---

### Pricing Plan Ideas

| Plan | Target User | Example Price |
|---|---|---|
| Free | Beginner traders | Free |
| Pro Trader | Active retail traders | $19/month |
| Advanced Trader | Serious traders | $49/month |
| Community Bot | Signal groups and communities | $299/month |
| API Plan | Wallets, bots, DeFi apps | Usage-based |

---

## API Product Vision

TradeFirewall can become a risk API for external apps.

Example endpoint:

```http
POST /api/analyze-trade
```

Example request:

```json
{
  "symbol": "SOL",
  "action": "BUY",
  "amountUsd": 5000,
  "holdingPeriod": "INTRADAY",
  "riskProfile": "CONSERVATIVE",
  "notes": "I want to buy because SOL looks strong today."
}
```

Example response:

```json
{
  "symbol": "SOL",
  "riskScore": 82,
  "decision": "BLOCK",
  "confidence": 87,
  "recommendedAction": "Reduce position size or wait for stronger confirmation.",
  "riskFactors": [
    {
      "name": "Volatility",
      "riskLevel": "Critical",
      "explanation": "Short-term volatility is too high for an intraday conservative trade."
    },
    {
      "name": "Liquidity",
      "riskLevel": "High",
      "explanation": "Orderbook depth may not support this position size safely."
    }
  ],
  "disclaimer": "Not financial advice."
}
```

---

## Roadmap

```mermaid
timeline
    title TradeFirewall Roadmap

    section MVP
      Trade Risk Engine : User trade input
      Real Market Data : SoSoValue + SoDEX
      Risk Score : Deterministic risk engine
      Risk Explanation : Rule-based explanation
      Dashboard : Saved reports and watchlist

    section Next
      Live Alerts : Watchlist risk changes
      PDF Reports : Export risk statement
      API Access : External integrations
      Community Bot : Telegram and Discord support

    section Future
      Wallet Accounts : Account-specific history
      SoDEX Testnet Actions : Confirmed testnet execution
      LLM Layer : Optional real AI explanation
      Team Plans : Signal groups and fund managers
```

---

## Final Demo Flow

The demo should prove this full journey:

```mermaid
flowchart TD
    A[Open Landing Page] --> B[Click Check a Trade]
    B --> C[Enter Trade Details]
    C --> D[Click Analyze Trade Risk]
    D --> E[Fetch Real Market Data]
    E --> F[Calculate Risk Score]
    F --> G[Show Risk Report]
    G --> H[Show Risk Intelligence Explanation]
    H --> I[Show Recommended Action]
    I --> J{High Risk?}
    J -- Yes --> K[Show Confirmation Gate]
    K --> L[Execution Preview]
    J -- No --> M[Save Report]
    L --> M
    M --> N[View Dashboard]
    N --> O[Add Asset to Watchlist]
```

---

## Quality Checklist

Before submission:

- [ ] All pages load correctly
- [ ] Navbar links work
- [ ] Trade Risk Engine works
- [ ] No mock market data
- [ ] No fake dashboard data
- [ ] No fake reports
- [ ] SoSoValue integration is connected
- [ ] SoDEX market-data integration is connected
- [ ] Risk score uses real fetched data
- [ ] Risk explanation is labeled correctly
- [ ] Dashboard uses only real saved reports
- [ ] Watchlist uses only user-added assets
- [ ] Missing API key error works
- [ ] API failure error works
- [ ] Confirmation gate works
- [ ] Save Risk Report works
- [ ] Add to Watchlist works
- [ ] Download PDF works if visible
- [ ] Copy Summary works if visible
- [ ] Share Report Link is hidden unless implemented
- [ ] App is responsive on mobile
- [ ] `npm run build` passes
- [ ] `.env.example` exists
- [ ] README is complete

---

## Disclaimer

TradeFirewall is a risk intelligence and decision-support tool.

It does not provide financial advice.

Risk scores, explanations, and recommended actions are designed to help users understand potential trade risk before execution. Users remain responsible for their own decisions.

---

## One-Line Summary

**TradeFirewall is a pre-trade crypto risk engine that uses real market data, deterministic risk scoring, rule-based explanations, and confirmation controls to help users avoid dangerous trades before execution.**