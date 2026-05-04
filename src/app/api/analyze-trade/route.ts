import { NextRequest, NextResponse } from 'next/server';
import { riskEngine, TradeInput } from '@/lib/riskEngine';
import { riskExplanationGenerator } from '@/lib/riskExplanation';
import { APIConnectionError } from '@/lib/sosovalue';

export async function POST(request: NextRequest) {
  try {
    const tradeInput: TradeInput = await request.json();

    // Validate input
    if (!tradeInput.symbol || !tradeInput.amount || tradeInput.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid trade input' },
        { status: 400 }
      );
    }

    // Validate symbol format
    if (!/^[A-Z]{2,10}$/.test(tradeInput.symbol.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid symbol format. Use uppercase letters only (e.g., BTC, ETH, SOL)' },
        { status: 400 }
      );
    }

    // Normalize symbol to uppercase
    tradeInput.symbol = tradeInput.symbol.toUpperCase();

    // Analyze trade risk using real API data
    const riskAnalysis = await riskEngine.analyzeTradeRisk(tradeInput);
    
    // Generate risk intelligence explanation based on real risk analysis
    const riskExplanation = riskExplanationGenerator.generateExplanation(riskAnalysis, tradeInput);

    // Return comprehensive risk report
    return NextResponse.json({
      tradeInput,
      riskAnalysis,
      riskExplanation,
      timestamp: Date.now(),
      apiStatus: {
        sosoValueConnected: riskAnalysis.dataSourcesUsed.includes('SoSoValue Market Intelligence'),
        sodexConnected: riskAnalysis.dataSourcesUsed.includes('SoDEX Market Data'),
        dataSourcesUsed: riskAnalysis.dataSourcesUsed
      }
    });

  } catch (error) {
    console.error('Trade analysis error:', error);
    
    // Handle specific API connection errors
    if (error instanceof APIConnectionError) {
      return NextResponse.json(
        { 
          error: error.message,
          errorType: 'API_CONNECTION_ERROR',
          suggestion: 'Configure SOSOVALUE_API_KEY in environment variables'
        },
        { status: 503 }
      );
    }
    
    // Handle SoDEX market data errors
    if (error instanceof Error) {
      if (error.message.includes('Unable to fetch SoDEX')) {
        return NextResponse.json(
          { 
            error: 'Unable to fetch SoDEX market data',
            errorType: 'SODEX_ERROR',
            suggestion: 'Check SoDEX API endpoints configuration'
          },
          { status: 503 }
        );
      }
      
      if (error.message.includes('Symbol') && error.message.includes('not found')) {
        return NextResponse.json(
          { 
            error: error.message,
            errorType: 'SYMBOL_NOT_FOUND',
            suggestion: 'Verify the symbol exists on SoDEX exchange'
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Cannot calculate risk score')) {
        return NextResponse.json(
          { 
            error: error.message,
            errorType: 'INSUFFICIENT_DATA',
            suggestion: 'Both SoSoValue and SoDEX APIs are unavailable'
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Risk analysis failed',
        errorType: 'ANALYSIS_ERROR',
        suggestion: 'Please try again or contact support'
      },
      { status: 500 }
    );
  }
}