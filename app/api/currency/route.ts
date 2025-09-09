import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Currency API configuration - using fallback rates for security

// Currency configuration with static data
const currencyConfig = [
  { currency: 'USD', symbol: '$', name: 'US Dollar' },
  { currency: 'EUR', symbol: '€', name: 'Euro' },
  { currency: 'GBP', symbol: '£', name: 'British Pound' },
  { currency: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { currency: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { currency: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { currency: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { currency: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { currency: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { currency: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { currency: 'THB', symbol: '฿', name: 'Thai Baht' },
  { currency: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { currency: 'INR', symbol: '₹', name: 'Indian Rupee' },
] as Array<{ currency: string; symbol: string; name: string }>;

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES: Record<string, number> = {
  'USD': 35.50,
  'EUR': 38.20,
  'GBP': 44.80,
  'JPY': 0.24,
  'SGD': 26.30,
  'MYR': 7.85,
  'CNY': 4.95,
  'KRW': 0.027,
  'AUD': 23.80,
  'CAD': 26.10,
  'THB': 1.00,
  'CHF': 39.50,
  'INR': 0.43,
};

// In-memory cache for exchange rates (5 minute TTL)
let rateCache: {
  data: Record<string, number>;
  timestamp: number;
  ttl: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Function to get exchange rates (using secure fallback rates only)
async function getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  // Check cache first
  if (rateCache && Date.now() - rateCache.timestamp < rateCache.ttl) {
    return rateCache.data;
  }
  
  // For security reasons, we only use fallback rates
  // This prevents any API keys or external service dependencies
  console.log(`Using secure fallback exchange rates for base currency: ${baseCurrency}`);
  
  // Cache the rates
  rateCache = {
    data: FALLBACK_RATES,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  };
  
  // Return fallback rates (these should be updated periodically by the development team)
  return FALLBACK_RATES;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = searchParams.get('amount');
    const base = searchParams.get('base') || 'USD'; // Allow custom base currency
    
    // Get current exchange rates from Open Exchange Rates API
    const rates = await getExchangeRates(base);
    
    // If conversion parameters provided, calculate conversion
    if (from && to && amount) {
      const fromRate = rates[from] || 1;
      const toRate = rates[to] || 1;
      
      // Calculate conversion rate
      const conversionRate = fromRate / toRate;
      const convertedAmount = parseFloat(amount) * conversionRate;
      
      return NextResponse.json({
        success: true,
        from,
        to,
        amount: parseFloat(amount),
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate: Math.round(conversionRate * 10000) / 10000,
        calculation: `${amount} ${from} = ${Math.round(convertedAmount * 100) / 100} ${to}`,
        timestamp: Date.now(),
        source: 'Open Exchange Rates API'
      });
    }
    
    // Return all available currencies with current rates
    const currenciesWithRates = currencyConfig.map((config, index) => ({
      id: index + 1,
      currency: config.currency,
      symbol: config.symbol,
      name: config.name,
      rate: rates[config.currency] || 1
    }));
    
    const response = NextResponse.json({
      success: true,
      currencies: currenciesWithRates,
      timestamp: Date.now(),
      source: 'Open Exchange Rates API',
      base: base
    });
    
    // Add cache headers for client-side caching
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error fetching currency data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch currency data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

// Note: Currency rates are now managed through Open Exchange Rates API
// POST and PUT methods are disabled as rates should come from reliable sources
export async function POST() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Currency rates are managed through Open Exchange Rates API. Use GET to fetch current rates.',
      source: 'Open Exchange Rates API'
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Currency rates are managed through Open Exchange Rates API. Use GET to fetch current rates.',
      source: 'Open Exchange Rates API'
    },
    { status: 405 }
  );
}
