export type Currency = 'USD' | 'RUB' | 'EUR' | 'CNY';

export type TransactionType = 'BUY' | 'SELL' | 'DIVIDEND' | 'COUPON' | 'DEPOSIT' | 'WITHDRAW';

export interface Portfolio {
  id: string;
  name: string;
  currency: Currency;
  description?: string;
  targetMonthlyDividend?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  ticker: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  shares: number;
  price: number; // Price per share in portfolio currency
  fee: number;
  notes?: string;
  totalAmount: number; // calculated: shares * price + fee (for BUY) or shares * price - fee (for SELL)
}

export interface AssetQuote {
  ticker: string;
  name: string;
  sector: string;
  currency: Currency;
  price: number;
  previousClose: number;
  changePercent: number;
  dividendYield: number; // e.g. 4.5 for 4.5%
  annualDividendPerShare: number;
  payoutFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  payoutMonths: number[]; // 1-12 (1 = Jan, 12 = Dec)
  assetType: 'stock' | 'etf' | 'bond' | 'crypto' | 'reit';
  logoColor?: string;
  lotSize?: number; // Размер лота (количество штук в одном биржевом лоте, по умолчанию 1)
  description?: string;
}

export interface HoldingPosition {
  ticker: string;
  asset: AssetQuote;
  shares: number;
  averageBuyPrice: number;
  totalInvested: number; // based on current remaining shares
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  totalDividendsReceived: number;
  totalReturn: number; // unrealizedPnL + realizedPnL + totalDividendsReceived
  totalReturnPercent: number;
  portfolioWeight: number; // 0 - 100%
  annualDividendIncome: number;
  yieldOnCost: number; // % annual dividend / average buy price
  currentDividendYield: number;
}

export interface CashflowEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  currency: Currency;
  date: string;
  note?: string;
  relatedPortfolioId?: string;
}

export interface BrokerImportRow {
  date: string;
  ticker: string;
  type: TransactionType;
  shares: number;
  price: number;
  fee: number;
  currency: Currency;
  notes?: string;
  valid: boolean;
  errorMessage?: string;
}

export interface MonthlyDividendProjection {
  monthIndex: number; // 0-11
  monthName: string;
  projectedAmount: number;
  items: {
    ticker: string;
    shares: number;
    amountPerShare: number;
    totalAmount: number;
  }[];
}

export type DepositPayoutFrequency = 'daily' | 'monthly' | 'quarterly' | 'annual' | 'end_of_term';

export interface DepositRateChange {
  id: string;
  effectiveDate: string; // YYYY-MM-DD
  rate: number; // % annual
  note?: string;
}

export interface DepositOperation {
  id: string;
  depositId: string;
  date: string;
  type: 'INTEREST' | 'TOPUP' | 'WITHDRAW';
  amount: number;
  balanceAfter: number;
  note?: string;
}

export interface BankDeposit {
  id: string;
  name: string;
  bankName: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number; // % annual
  currency: Currency;
  startDate: string;
  endDate?: string;
  isCapitalized: boolean;
  payoutFrequency: DepositPayoutFrequency;
  totalInterestEarned: number;
  notes?: string;
  rateHistory?: DepositRateChange[];
  operations?: DepositOperation[];
}

export type LoanType = 'mortgage' | 'consumer' | 'auto' | 'credit_card' | 'other';

export interface LoanPayment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  isEarly: boolean;
  note?: string;
}

export interface Loan {
  id: string;
  name: string;
  bankName: string;
  type: LoanType;
  initialAmount: number;
  remainingDebt: number;
  interestRate: number; // % annual
  monthlyPayment: number;
  paymentDayOfMonth: number;
  currency: Currency;
  startDate: string;
  endDate: string;
  totalPaid: number;
  notes?: string;
  payments?: LoanPayment[];
}

