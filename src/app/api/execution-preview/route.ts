import { NextRequest, NextResponse } from 'next/server';
import { sodexAPI } from '@/lib/sodex';

export async function POST(request: NextRequest) {
  try {
    const tradeInput = await request.json();

    // Validate input
    if (!tradeInput.symbol || !tradeInput.action || !tradeInput.amount || tradeInput.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid execution parameters' },
        { status: 400 }
      );
    }

    // Get execution preview from SoDEX
    const executionPreview = await sodexAPI.prepareExecutionPreview(tradeInput);

    // Always return preview mode - never execute real trades
    return NextResponse.json({
      ...executionPreview,
      mode: 'preview',
      canExecute: false, // Always false for safety
      timestamp: Date.now(),
      disclaimer: 'This is a preview only. No real trades will be executed.'
    });

  } catch (error) {
    console.error('Execution preview error:', error);
    
    if (error instanceof Error && error.message.includes('Symbol')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Unable to generate execution preview' },
      { status: 500 }
    );
  }
}