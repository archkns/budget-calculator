import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Mock currency conversion rates (in a real app, this would come from a live API)
const currencyRates = [
  { id: 1, currency: 'USD', symbol: '$', rate: 35.50, name: 'US Dollar' },
  { id: 2, currency: 'EUR', symbol: '€', rate: 38.20, name: 'Euro' },
  { id: 3, currency: 'GBP', symbol: '£', rate: 44.80, name: 'British Pound' },
  { id: 4, currency: 'JPY', symbol: '¥', rate: 0.24, name: 'Japanese Yen' },
  { id: 5, currency: 'SGD', symbol: 'S$', rate: 26.30, name: 'Singapore Dollar' },
  { id: 6, currency: 'MYR', symbol: 'RM', rate: 7.85, name: 'Malaysian Ringgit' },
  { id: 7, currency: 'CNY', symbol: '¥', rate: 4.95, name: 'Chinese Yuan' },
  { id: 8, currency: 'KRW', symbol: '₩', rate: 0.027, name: 'South Korean Won' },
  { id: 9, currency: 'AUD', symbol: 'A$', rate: 23.80, name: 'Australian Dollar' },
  { id: 10, currency: 'CAD', symbol: 'C$', rate: 26.10, name: 'Canadian Dollar' },
  { id: 11, currency: 'THB', symbol: '฿', rate: 1.00, name: 'Thai Baht' }, // Base currency
] as Array<{ id: number; currency: string; symbol: string; rate: number; name: string }>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = searchParams.get('amount');
    
    // If conversion parameters provided, calculate conversion
    if (from && to && amount) {
      const fromRate = currencyRates.find(r => r.currency === from)?.rate || 1;
      const toRate = currencyRates.find(r => r.currency === to)?.rate || 1;
      
      const amountInTHB = parseFloat(amount) * fromRate;
      const convertedAmount = amountInTHB / toRate;
      
      return NextResponse.json({
        from,
        to,
        amount: parseFloat(amount),
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate: Math.round((fromRate / toRate) * 10000) / 10000,
        calculation: `${amount} ${from} = ${Math.round(convertedAmount * 100) / 100} ${to}`
      });
    }
    
    // Return all available currencies
    return NextResponse.json(currencyRates);
  } catch (error) {
    console.error('Error fetching currency data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currency, symbol, rate, name } = body;
    
    if (!currency || !symbol || !rate || !name) {
      return NextResponse.json(
        { error: 'Currency, symbol, rate, and name are required' },
        { status: 400 }
      );
    }
    
    // Check if currency already exists
    const existingIndex = currencyRates.findIndex(r => r.currency === currency);
    
    if (existingIndex !== -1) {
      // Update existing currency
      currencyRates[existingIndex] = {
        ...currencyRates[existingIndex],
        symbol,
        rate: parseFloat(rate),
        name
      };
      return NextResponse.json(currencyRates[existingIndex]);
    } else {
      // Add new currency
      const newCurrency = {
        id: currencyRates.length + 1,
        currency: currency.toUpperCase(),
        symbol,
        rate: parseFloat(rate),
        name
      };
      
      currencyRates.push(newCurrency);
      return NextResponse.json(newCurrency, { status: 201 });
    }
  } catch (error) {
    console.error('Error managing currency:', error);
    return NextResponse.json(
      { error: 'Failed to manage currency' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    
    if (!currency) {
      return NextResponse.json(
        { error: 'Currency code is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { rate } = body;
    
    if (!rate) {
      return NextResponse.json(
        { error: 'Rate is required' },
        { status: 400 }
      );
    }
    
    const currencyIndex = currencyRates.findIndex(r => r.currency === currency.toUpperCase());
    
    if (currencyIndex === -1) {
      return NextResponse.json(
        { error: 'Currency not found' },
        { status: 404 }
      );
    }
    
    currencyRates[currencyIndex].rate = parseFloat(rate);
    
    return NextResponse.json(currencyRates[currencyIndex]);
  } catch (error) {
    console.error('Error updating currency rate:', error);
    return NextResponse.json(
      { error: 'Failed to update currency rate' },
      { status: 500 }
    );
  }
}
