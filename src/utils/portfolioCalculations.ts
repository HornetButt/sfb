import { Transaction, AssetQuote, HoldingPosition, MonthlyDividendProjection, Currency } from '../types';

export function calculateHoldings(
  transactions: Transaction[],
  quotesMap: Record<string, AssetQuote>
): HoldingPosition[] {
  // Group transactions by ticker sorted by date
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  
  interface TickerAccumulator {
    shares: number;
    totalCost: number; // Cost of currently held shares
    realizedPnL: number;
    dividendsReceived: number;
  }

  const accMap: Record<string, TickerAccumulator> = {};

  for (const tx of sortedTx) {
    if (!accMap[tx.ticker]) {
      accMap[tx.ticker] = {
        shares: 0,
        totalCost: 0,
        realizedPnL: 0,
        dividendsReceived: 0
      };
    }

    const acc = accMap[tx.ticker];

    if (tx.type === 'BUY') {
      const buyCost = tx.shares * tx.price + (tx.fee || 0);
      acc.shares += tx.shares;
      acc.totalCost += buyCost;
    } else if (tx.type === 'SELL') {
      if (acc.shares > 0) {
        const avgPriceBeforeSell = acc.totalCost / acc.shares;
        const sharesToSell = Math.min(tx.shares, acc.shares);
        const costOfSoldShares = avgPriceBeforeSell * sharesToSell;
        const netProceeds = sharesToSell * tx.price - (tx.fee || 0);
        
        acc.realizedPnL += (netProceeds - costOfSoldShares);
        acc.shares -= sharesToSell;
        acc.totalCost = Math.max(0, acc.totalCost - costOfSoldShares);
      }
    } else if (tx.type === 'DIVIDEND' || tx.type === 'COUPON') {
      // tx.totalAmount or tx.shares * tx.price
      const divAmount = tx.totalAmount || (tx.shares * tx.price);
      acc.dividendsReceived += divAmount;
    }
  }

  // Calculate market value & metrics
  const positions: HoldingPosition[] = [];

  for (const [ticker, acc] of Object.entries(accMap)) {
    // If user owned and sold everything, but has realizedPnL or dividends, or currently owns shares
    if (acc.shares <= 0 && acc.realizedPnL === 0 && acc.dividendsReceived === 0) {
      continue;
    }

    const fallbackQuote: AssetQuote = {
      ticker,
      name: ticker,
      sector: 'Другое',
      currency: 'USD',
      price: acc.shares > 0 ? (acc.totalCost / acc.shares) : 0,
      previousClose: acc.shares > 0 ? (acc.totalCost / acc.shares) : 0,
      changePercent: 0,
      dividendYield: 0,
      annualDividendPerShare: 0,
      payoutFrequency: 'quarterly',
      payoutMonths: [3, 6, 9, 12],
      assetType: 'stock'
    };

    const quote = quotesMap[ticker] || fallbackQuote;
    const currentPrice = quote.price;
    const avgBuyPrice = acc.shares > 0 ? (acc.totalCost / acc.shares) : 0;
    const currentValue = acc.shares * currentPrice;
    const totalInvested = acc.totalCost;
    const unrealizedPnL = currentValue - totalInvested;
    const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;
    const totalReturn = unrealizedPnL + acc.realizedPnL + acc.dividendsReceived;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    const annualDividendIncome = acc.shares * (quote.annualDividendPerShare || 0);
    const yieldOnCost = avgBuyPrice > 0 ? ((quote.annualDividendPerShare || 0) / avgBuyPrice) * 100 : 0;

    positions.push({
      ticker,
      asset: quote,
      shares: acc.shares,
      averageBuyPrice: avgBuyPrice,
      totalInvested: totalInvested,
      currentPrice: currentPrice,
      currentValue: currentValue,
      unrealizedPnL: unrealizedPnL,
      unrealizedPnLPercent: unrealizedPnLPercent,
      realizedPnL: acc.realizedPnL,
      totalDividendsReceived: acc.dividendsReceived,
      totalReturn: totalReturn,
      totalReturnPercent: totalReturnPercent,
      portfolioWeight: 0, // will compute below
      annualDividendIncome: annualDividendIncome,
      yieldOnCost: yieldOnCost,
      currentDividendYield: quote.dividendYield || 0
    });
  }

  // Calculate portfolio weights
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  if (totalValue > 0) {
    positions.forEach(p => {
      p.portfolioWeight = (p.currentValue / totalValue) * 100;
    });
  }

  // Sort by current value descending
  return positions.sort((a, b) => b.currentValue - a.currentValue);
}

export function calculatePortfolioSummary(holdings: HoldingPosition[]) {
  const activeHoldings = holdings.filter(h => h.shares > 0);
  
  const totalValue = activeHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalInvested = activeHoldings.reduce((sum, h) => sum + h.totalInvested, 0);
  const unrealizedPnL = totalValue - totalInvested;
  const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;
  
  const realizedPnL = holdings.reduce((sum, h) => sum + h.realizedPnL, 0);
  const totalDividendsReceived = holdings.reduce((sum, h) => sum + h.totalDividendsReceived, 0);
  const totalReturn = unrealizedPnL + realizedPnL + totalDividendsReceived;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  
  const annualDividendIncome = activeHoldings.reduce((sum, h) => sum + h.annualDividendIncome, 0);
  const monthlyAverageDividend = annualDividendIncome / 12;
  
  const currentDividendYield = totalValue > 0 ? (annualDividendIncome / totalValue) * 100 : 0;
  const averageYieldOnCost = totalInvested > 0 ? (annualDividendIncome / totalInvested) * 100 : 0;

  // Day change
  const dayChangeValue = activeHoldings.reduce((sum, h) => {
    const prevClose = h.asset.previousClose || h.currentPrice;
    return sum + h.shares * (h.currentPrice - prevClose);
  }, 0);
  const prevDayTotal = totalValue - dayChangeValue;
  const dayChangePercent = prevDayTotal > 0 ? (dayChangeValue / prevDayTotal) * 100 : 0;

  return {
    totalValue,
    totalInvested,
    unrealizedPnL,
    unrealizedPnLPercent,
    realizedPnL,
    totalDividendsReceived,
    totalReturn,
    totalReturnPercent,
    annualDividendIncome,
    monthlyAverageDividend,
    currentDividendYield,
    averageYieldOnCost,
    dayChangeValue,
    dayChangePercent,
    activePositionsCount: activeHoldings.length
  };
}

const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const MONTH_SHORT_RU = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
];

export function calculateMonthlyDividendProjections(holdings: HoldingPosition[]): MonthlyDividendProjection[] {
  const activeHoldings = holdings.filter(h => h.shares > 0 && h.annualDividendIncome > 0);

  const months: MonthlyDividendProjection[] = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i,
    monthName: MONTH_NAMES_RU[i],
    projectedAmount: 0,
    items: []
  }));

  for (const h of activeHoldings) {
    const payoutMonths = h.asset.payoutMonths || [3, 6, 9, 12];
    const payoutsCount = payoutMonths.length || 4;
    const amountPerPayout = (h.asset.annualDividendPerShare || 0) / payoutsCount;
    const totalPayoutForAsset = amountPerPayout * h.shares;

    for (const m of payoutMonths) {
      const targetMonthIdx = m - 1; // 1-12 to 0-11
      if (months[targetMonthIdx]) {
        months[targetMonthIdx].projectedAmount += totalPayoutForAsset;
        months[targetMonthIdx].items.push({
          ticker: h.ticker,
          shares: h.shares,
          amountPerShare: amountPerPayout,
          totalAmount: totalPayoutForAsset
        });
      }
    }
  }

  return months;
}

export function formatCurrency(amount: number, currency: Currency = 'USD', compact: boolean = false): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  let symbol = '$';
  if (currency === 'RUB') symbol = '₽';
  else if (currency === 'EUR') symbol = '€';
  else if (currency === 'CNY') symbol = '¥';

  if (compact && abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}M ${symbol}`;
  }
  if (compact && abs >= 100_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}k ${symbol}`;
  }

  const formattedNum = abs.toLocaleString('ru-RU', {
    minimumFractionDigits: abs >= 100 ? 2 : 2,
    maximumFractionDigits: 2
  });

  return `${sign}${formattedNum} ${symbol}`;
}

export function formatPercent(value: number, includeSign: boolean = true): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
