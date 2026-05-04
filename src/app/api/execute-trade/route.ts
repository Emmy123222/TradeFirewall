import { NextRequest, NextResponse } from 'next/server';
import { sodexAPI } from '@/lib/sodex';

export async function POST(request: NextRequest) {
  try {
    const { symbol, action, amount, confirmed } = await request.json();

    // Validate input
    if (!symbol || !action || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid execution parameters' },
        { status: 400 }
      );
    }

    // Require confirmation for execution
    if (!confirmed) {
      return NextResponse.json(
        { error: 'Trade execution requires risk confirmation' },
        { status: 400 }
      );
    }

    // Normalize symbol
    const normalizedSymbol = symbol.toUpperCase();

    // Validate symbol exists on SoDEX
    const symbolExists = await sodexAPI.validateSymbolExists(normalizedSymbol);
    if (!symbolExists) {
      return NextResponse.json(
        { 
          error: `Symbol ${normalizedSymbol} not found on SoDEX exchange`,
          errorType: 'SYMBOL_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Get execution preview
    const executionPreview = await sodexAPI.prepareExecutionPreview({
      symbol: normalizedSymbol,
      action,
      amount
    });

    // For safety, always return preview mode - no real execution
    return NextResponse.json({
      mode: 'preview_only',
      symbol: normalizedSymbol,
      action,
      amount,
      executionPreview,
      status: 'preview_generated',
      message: 'Execution preview generated. Real trading not implemented for safety.',
      timestamp: Date.now(),
      warnings: [
        'This is a preview only',
        'No real trades will be executed',
        'TradeFirewall is in risk analysis mode'
      ]
    });

  } catch (error) {
    console.error('Trade execution error:', error);
    
    if (error instanceof Error && error.message.includes('Unable to fetch SoDEX')) {
      return NextResponse.json(
        { 
          error: 'Unable to fetch SoDEX market data for execution preview',
          errorType: 'SODEX_ERROR'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate execution preview',
        errorType: 'EXECUTION_ERROR'
      },
      { status: 500 }
    );
  }
}