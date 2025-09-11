import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Currency API configuration - integrating with real exchange rate service

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
  baseCurrency: string;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Function to get exchange rates from external API with fallback
async function getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  // Check cache first
  if (rateCache && rateCache.baseCurrency === baseCurrency && Date.now() - rateCache.timestamp < rateCache.ttl) {
    return rateCache.data;
  }
  
  try {
    // Try to fetch from external API first
    console.log(`Fetching exchange rates from external API for base currency: ${baseCurrency}`);
    
    // Using exchangerate-api.com (free tier, no API key required)
    // You can configure a custom API URL and key via environment variables
    // Note: Always use USD as base for external API since it has the most reliable data
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest';
    
    const url = `${apiUrl}/USD${apiKey ? `?access_key=${apiKey}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Budget-Calculator/1.0'
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.rates && typeof data.rates === 'object') {
      // Convert rates to our format (THB as base for our application)
      const rates: Record<string, number> = {};
      
      // The external API returns USD-based rates where each currency shows how many units of that currency = 1 USD
      // We need to convert these to rates relative to our requested base currency
      
      if (baseCurrency === 'USD') {
        // If base is USD, use the rates directly
        Object.entries(data.rates).forEach(([currency, rate]) => {
          if (currency === 'USD') {
            rates[currency] = 1.0;
          } else {
            // Use the rate directly: if 1 USD = rate currency, then 1 USD = rate currency
            rates[currency] = rate as number;
          }
        });
      } else {
        // If base is not USD, convert from USD-based rates
        const baseToUSD = data.rates[baseCurrency] || 1; // How many base currency units = 1 USD
        
        Object.entries(data.rates).forEach(([currency, rate]) => {
          if (currency === baseCurrency) {
            rates[currency] = 1.0; // Base currency to itself is always 1
          } else {
            // Convert: if 1 USD = rate currency and 1 USD = baseToUSD base_currency
            // Then: 1 base_currency = (rate / baseToUSD) currency
            rates[currency] = (rate as number) / baseToUSD;
          }
        });
      }
      
      // Cache the rates
      rateCache = {
        data: rates,
        timestamp: Date.now(),
        ttl: CACHE_TTL,
        baseCurrency: baseCurrency
      };
      
      console.log(`Successfully fetched exchange rates from external API`);
      return rates;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates from external API, using fallback:', error);
    
    // Use fallback rates when API fails
    const fallbackRates = { ...FALLBACK_RATES };
    
    // Cache the fallback rates with shorter TTL for faster retry
    rateCache = {
      data: fallbackRates,
      timestamp: Date.now(),
      ttl: 1 * 60 * 1000, // 1 minute for fallback rates to allow faster retry
      baseCurrency: baseCurrency
    };
    
    return fallbackRates;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const amount = searchParams.get('amount');
  const base = searchParams.get('base') || 'USD'; // Allow custom base currency
  
  try {
    
    // Get current exchange rates from external API with fallback
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
        source: 'Exchange Rate API'
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
      source: 'Exchange Rate API',
      base: base
    });
    
    // Add cache headers for client-side caching
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error fetching currency data:', error);
    
    // Try to return fallback data even if there's an error
    try {
      const fallbackRates = { ...FALLBACK_RATES };
      const currenciesWithRates = currencyConfig.map((config, index) => ({
        id: index + 1,
        currency: config.currency,
        symbol: config.symbol,
        name: config.name,
        rate: fallbackRates[config.currency] || 1
      }));
      
      return NextResponse.json({
        success: true,
        currencies: currenciesWithRates,
        timestamp: Date.now(),
        source: 'Fallback Rates',
        base: base,
        warning: 'Using fallback rates due to API error'
      });
    } catch {
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
}

// Note: Currency rates are now managed through external Exchange Rate API
// POST and PUT methods are disabled as rates should come from reliable sources
export async function POST() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Currency rates are managed through external Exchange Rate API. Use GET to fetch current rates.',
      source: 'Exchange Rate API'
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Currency rates are managed through external Exchange Rate API. Use GET to fetch current rates.',
      source: 'Exchange Rate API'
    },
    { status: 405 }
  );
}
