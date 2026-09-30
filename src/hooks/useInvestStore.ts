import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Portfolio, 
  Transaction, 
  AssetQuote, 
  CashflowEntry, 
  BankDeposit, 
  Loan, 
  Currency 
} from '../types';
import { 
  INITIAL_PORTFOLIOS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_CASHFLOW, 
  INITIAL_DEPOSITS, 
  INITIAL_LOANS 
} from '../data/demoData';
import { INITIAL_TICKER_DATABASE } from '../data/tickerDatabase';
import { calculateHoldings, calculatePortfolioSummary, calculateMonthlyDividendProjections } from '../utils/portfolioCalculations';
import { BackupData } from '../utils/exportImport';

const STORAGE_KEYS = {
  PORTFOLIOS: 'sb_portfolios_v1',
  SELECTED_PORTFOLIO: 'sb_selected_portfolio_v1',
  TRANSACTIONS: 'sb_transactions_v1',
  QUOTES: 'sb_quotes_v1',
  CASHFLOW: 'sb_cashflow_v1',
  DEPOSITS: 'sb_deposits_v1',
  LOANS: 'sb_loans_v1'
};

export function useInvestStore() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
      return saved ? JSON.parse(saved) : INITIAL_PORTFOLIOS;
    } catch {
      return INITIAL_PORTFOLIOS;
    }
  });

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_PORTFOLIO);
      return saved || 'port-1';
    } catch {
      return 'port-1';
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [quotes, setQuotes] = useState<Record<string, AssetQuote>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUOTES);
      return saved ? { ...INITIAL_TICKER_DATABASE, ...JSON.parse(saved) } : INITIAL_TICKER_DATABASE;
    } catch {
      return INITIAL_TICKER_DATABASE;
    }
  });

  const [cashflow, setCashflow] = useState<CashflowEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
      return saved ? JSON.parse(saved) : INITIAL_CASHFLOW;
    } catch {
      return INITIAL_CASHFLOW;
    }
  });

  const [deposits, setDeposits] = useState<BankDeposit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
      return saved ? JSON.parse(saved) : INITIAL_DEPOSITS;
    } catch {
      return INITIAL_DEPOSITS;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));
  }, [portfolios]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PORTFOLIO, selectedPortfolioId);
  }, [selectedPortfolioId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(cashflow));
  }, [cashflow]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }, [loans]);

  // Current selected portfolio object
  const currentPortfolio = useMemo(() => {
    return portfolios.find(p => p.id === selectedPortfolioId) || portfolios[0] || null;
  }, [portfolios, selectedPortfolioId]);

  // Filtered transactions for current portfolio (or all)
  const currentTransactions = useMemo(() => {
    if (selectedPortfolioId === 'all') {
      return transactions;
    }
    return transactions.filter(t => t.portfolioId === selectedPortfolioId);
  }, [transactions, selectedPortfolioId]);

  // Calculated holdings
  const holdings = useMemo(() => {
    return calculateHoldings(currentTransactions, quotes);
  }, [currentTransactions, quotes]);

  // Portfolio summary
  const summary = useMemo(() => {
    return calculatePortfolioSummary(holdings);
  }, [holdings]);

  // Monthly dividend projections
  const monthlyDividends = useMemo(() => {
    return calculateMonthlyDividendProjections(holdings);
  }, [holdings]);

  // Active currency
  const activeCurrency: Currency = currentPortfolio ? currentPortfolio.currency : 'USD';

  // Deposits & Loans aggregations
  const depositsSummary = useMemo(() => {
    const totalBalance = deposits.reduce((sum, d) => sum + d.currentBalance, 0);
    const annualInterest = deposits.reduce((sum, d) => sum + (d.currentBalance * (d.interestRate / 100)), 0);
    const monthlyInterest = annualInterest / 12;
    const avgRate = totalBalance > 0 ? (annualInterest / totalBalance) * 100 : 0;
    const totalInterestEarnedAllTime = deposits.reduce((sum, d) => sum + d.totalInterestEarned, 0);

    return {
      totalBalance,
      annualInterest,
      monthlyInterest,
      avgRate,
      totalInterestEarnedAllTime,
      count: deposits.length
    };
  }, [deposits]);

  const loansSummary = useMemo(() => {
    const totalDebt = loans.reduce((sum, l) => sum + l.remainingDebt, 0);
    const totalMonthlyPayment = loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
    const totalPaidAllTime = loans.reduce((sum, l) => sum + l.totalPaid, 0);
    const weightedRate = totalDebt > 0 
      ? loans.reduce((sum, l) => sum + l.remainingDebt * (l.interestRate / 100), 0) / totalDebt * 100 
      : 0;

    return {
      totalDebt,
      totalMonthlyPayment,
      totalPaidAllTime,
      weightedRate,
      count: loans.length
    };
  }, [loans]);

  // Total Net Worth (Чистый капитал)
  const netWorth = useMemo(() => {
    return summary.totalValue + depositsSummary.totalBalance - loansSummary.totalDebt;
  }, [summary.totalValue, depositsSummary.totalBalance, loansSummary.totalDebt]);

  // Net Passive Cashflow (Дивиденды + Проценты по вкладам - Платежи по кредитам)
  const netPassiveCashflow = useMemo(() => {
    const passiveIn = summary.monthlyAverageDividend + depositsSummary.monthlyInterest;
    const debtOut = loansSummary.totalMonthlyPayment;
    return {
      totalIn: passiveIn,
      totalOut: debtOut,
      net: passiveIn - debtOut
    };
  }, [summary.monthlyAverageDividend, depositsSummary.monthlyInterest, loansSummary.totalMonthlyPayment]);

  // Portfolio CRUD
  const addPortfolio = useCallback((newPort: Omit<Portfolio, 'id' | 'createdAt'>) => {
    const id = 'port-' + Date.now();
    const created: Portfolio = {
      ...newPort,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPortfolios(prev => [...prev, created]);
    setSelectedPortfolioId(id);
    return id;
  }, []);

  const updatePortfolio = useCallback((updated: Portfolio) => {
    setPortfolios(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, []);

  const deletePortfolio = useCallback((id: string) => {
    setPortfolios(prev => {
      const remaining = prev.filter(p => p.id !== id);
      if (selectedPortfolioId === id && remaining.length > 0) {
        setSelectedPortfolioId(remaining[0].id);
      }
      return remaining;
    });
    setTransactions(prev => prev.filter(t => t.portfolioId !== id));
  }, [selectedPortfolioId]);

  // Transaction CRUD
  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'totalAmount'>) => {
    const id = 'tx-' + Date.now();
    const totalAmount = tx.type === 'BUY'
      ? tx.shares * tx.price + (tx.fee || 0)
      : tx.type === 'SELL'
      ? tx.shares * tx.price - (tx.fee || 0)
      : tx.shares * tx.price;

    const newTx: Transaction = {
      ...tx,
      id,
      totalAmount
    };
    setTransactions(prev => [newTx, ...prev]);

    // Ensure asset quote exists or register default
    if (!quotes[tx.ticker]) {
      setQuotes(prev => ({
        ...prev,
        [tx.ticker]: {
          ticker: tx.ticker,
          name: tx.ticker,
          sector: 'Инвестиции',
          currency: activeCurrency,
          price: tx.price,
          previousClose: tx.price,
          changePercent: 0,
          dividendYield: 0,
          annualDividendPerShare: 0,
          payoutFrequency: 'quarterly',
          payoutMonths: [3, 6, 9, 12],
          assetType: 'stock'
        }
      }));
    }
  }, [quotes, activeCurrency]);

  const addTransactionsBatch = useCallback((txList: Omit<Transaction, 'id' | 'totalAmount'>[]) => {
    const newItems: Transaction[] = txList.map((tx, idx) => {
      const totalAmount = tx.type === 'BUY'
        ? tx.shares * tx.price + (tx.fee || 0)
        : tx.type === 'SELL'
        ? tx.shares * tx.price - (tx.fee || 0)
        : tx.shares * tx.price;

      return {
        ...tx,
        id: `tx-batch-${Date.now()}-${idx}`,
        totalAmount
      };
    });

    setTransactions(prev => [...newItems, ...prev]);

    // Ensure quotes exist
    setQuotes(prev => {
      const updated = { ...prev };
      for (const tx of txList) {
        if (!updated[tx.ticker]) {
          updated[tx.ticker] = {
            ticker: tx.ticker,
            name: tx.ticker,
            sector: 'Инвестиции',
            currency: activeCurrency,
            price: tx.price,
            previousClose: tx.price,
            changePercent: 0,
            dividendYield: 0,
            annualDividendPerShare: 0,
            payoutFrequency: 'quarterly',
            payoutMonths: [3, 6, 9, 12],
            assetType: 'stock'
          };
        }
      }
      return updated;
    });
  }, [activeCurrency]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransaction = useCallback((updated: Transaction) => {
    const totalAmount = updated.type === 'BUY'
      ? updated.shares * updated.price + (updated.fee || 0)
      : updated.type === 'SELL'
      ? updated.shares * updated.price - (updated.fee || 0)
      : updated.shares * updated.price;
    const finalTx: Transaction = {
      ...updated,
      ticker: updated.ticker.toUpperCase().trim(),
      totalAmount
    };
    setTransactions(prev => prev.map(t => t.id === updated.id ? finalTx : t));
  }, []);

  // Quotes management
  const updateQuote = useCallback((quote: AssetQuote) => {
    setQuotes(prev => ({
      ...prev,
      [quote.ticker]: quote
    }));
  }, []);

  const setAssetPrice = useCallback((ticker: string, newPrice: number, previousClose?: number) => {
    const cleanTicker = ticker.toUpperCase().trim();
    if (!cleanTicker || newPrice <= 0) return;

    setQuotes(prev => {
      const existing = prev[cleanTicker];
      const prevClose = previousClose !== undefined ? previousClose : (existing ? existing.price : newPrice);
      const changePercent = prevClose > 0 ? +(((newPrice - prevClose) / prevClose) * 100).toFixed(2) : 0;
      
      const divPerShare = existing ? (existing.annualDividendPerShare || 0) : 0;
      const newDivYield = newPrice > 0 && divPerShare > 0 ? +((divPerShare / newPrice) * 100).toFixed(2) : (existing?.dividendYield || 0);

      const updated: AssetQuote = existing ? {
        ...existing,
        price: newPrice,
        previousClose: prevClose,
        changePercent,
        dividendYield: newDivYield
      } : {
        ticker: cleanTicker,
        name: cleanTicker,
        sector: 'Акции',
        currency: activeCurrency,
        price: newPrice,
        previousClose: prevClose,
        changePercent,
        dividendYield: 0,
        annualDividendPerShare: 0,
        payoutFrequency: 'quarterly',
        payoutMonths: [3, 6, 9, 12],
        assetType: 'stock'
      };

      return {
        ...prev,
        [cleanTicker]: updated
      };
    });
  }, [activeCurrency]);

  const saveQuote = useCallback((quote: AssetQuote, oldTicker?: string) => {
    const cleanTicker = quote.ticker.toUpperCase().trim();
    if (!cleanTicker) return;

    const normalizedQuote: AssetQuote = {
      ...quote,
      ticker: cleanTicker,
      lotSize: Math.max(1, quote.lotSize || 1)
    };

    setQuotes(prev => {
      const next = { ...prev };
      if (oldTicker && oldTicker.toUpperCase() !== cleanTicker) {
        delete next[oldTicker.toUpperCase()];
      }
      next[cleanTicker] = normalizedQuote;
      return next;
    });

    // If ticker was renamed, update all transactions with oldTicker
    if (oldTicker && oldTicker.toUpperCase() !== cleanTicker) {
      const oldUpper = oldTicker.toUpperCase();
      setTransactions(prev => prev.map(t => {
        if (t.ticker.toUpperCase() === oldUpper) {
          return { ...t, ticker: cleanTicker };
        }
        return t;
      }));
    }
  }, []);

  const deleteQuote = useCallback((ticker: string) => {
    const cleanTicker = ticker.toUpperCase().trim();
    setQuotes(prev => {
      const next = { ...prev };
      delete next[cleanTicker];
      return next;
    });
  }, []);

  const splitTicker = useCallback((ticker: string, splitRatio: number) => {
    const cleanTicker = ticker.toUpperCase().trim();
    if (!cleanTicker || splitRatio <= 0 || splitRatio === 1) return;

    // 1. Update quote
    setQuotes(prev => {
      const existing = prev[cleanTicker];
      if (!existing) return prev;

      const newPrice = +(existing.price / splitRatio).toFixed(4);
      const newPrevClose = +(existing.previousClose / splitRatio).toFixed(4);
      const newDiv = existing.annualDividendPerShare ? +(existing.annualDividendPerShare / splitRatio).toFixed(4) : 0;

      return {
        ...prev,
        [cleanTicker]: {
          ...existing,
          price: newPrice,
          previousClose: newPrevClose,
          annualDividendPerShare: newDiv
        }
      };
    });

    // 2. Update transactions for this ticker
    setTransactions(prev => prev.map(t => {
      if (t.ticker.toUpperCase() === cleanTicker) {
        const newShares = +(t.shares * splitRatio).toFixed(4);
        const newPrice = +(t.price / splitRatio).toFixed(4);
        const splitNote = `Сплит ${splitRatio >= 1 ? `${splitRatio}:1` : `1:${Math.round(1 / splitRatio)}`}`;
        return {
          ...t,
          shares: newShares,
          price: newPrice,
          notes: t.notes ? `${t.notes} (${splitNote})` : splitNote
        };
      }
      return t;
    }));
  }, []);

  const refreshMarketQuotes = useCallback(() => {
    setQuotes(prev => {
      const next: Record<string, AssetQuote> = {};
      for (const [ticker, q] of Object.entries(prev)) {
        const deltaPercent = (Math.random() * 2.4 - 1.1) / 100;
        const newPrice = Math.max(0.01, +(q.price * (1 + deltaPercent)).toFixed(2));
        const changePercent = +(((newPrice - q.previousClose) / q.previousClose) * 100).toFixed(2);
        next[ticker] = {
          ...q,
          price: newPrice,
          changePercent
        };
      }
      return next;
    });
  }, []);

  // Cashflow CRUD
  const addCashflowEntry = useCallback((entry: Omit<CashflowEntry, 'id'>) => {
    const id = 'cf-' + Date.now();
    setCashflow(prev => [{ ...entry, id }, ...prev]);
  }, []);

  const deleteCashflowEntry = useCallback((id: string) => {
    setCashflow(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateCashflowEntry = useCallback((updated: CashflowEntry) => {
    setCashflow(prev => prev.map(c => c.id === updated.id ? updated : c));
  }, []);

  // Deposits Management
  const addDeposit = useCallback((dep: Omit<BankDeposit, 'id' | 'totalInterestEarned'>) => {
    const id = 'dep-' + Date.now();
    const newDep: BankDeposit = {
      ...dep,
      id,
      totalInterestEarned: 0
    };
    setDeposits(prev => [newDep, ...prev]);
  }, []);

  const updateDeposit = useCallback((updated: BankDeposit) => {
    setDeposits(prev => prev.map(d => d.id === updated.id ? updated : d));
  }, []);

  const deleteDeposit = useCallback((id: string) => {
    setDeposits(prev => prev.filter(d => d.id !== id));
  }, []);

  // Accrue interest on deposit (выплата процентов по вкладу)
  const accrueDepositInterest = useCallback((id: string, interestAmount: number, addToBalance: boolean, date?: string) => {
    const opDate = date || new Date().toISOString().split('T')[0];
    setDeposits(prev => prev.map(d => {
      if (d.id !== id) return d;
      const newBalance = addToBalance ? d.currentBalance + interestAmount : d.currentBalance;
      const newOp: import('../types').DepositOperation = {
        id: 'op-' + Date.now(),
        depositId: id,
        date: opDate,
        type: 'INTEREST',
        amount: interestAmount,
        balanceAfter: newBalance,
        note: addToBalance ? 'Начисление с капитализацией' : 'Выплата на счет'
      };
      return {
        ...d,
        currentBalance: newBalance,
        totalInterestEarned: d.totalInterestEarned + interestAmount,
        operations: [newOp, ...(d.operations || [])]
      };
    }));

    const dep = deposits.find(d => d.id === id);
    // Automatically log into Cashflow as Income!
    addCashflowEntry({
      type: 'INCOME',
      category: 'Проценты по вкладам',
      amount: interestAmount,
      currency: dep?.currency || activeCurrency,
      date: opDate,
      note: `Начисление процентов: ${dep?.name || 'Вклад'}`
    });
  }, [deposits, activeCurrency, addCashflowEntry]);

  const topUpDeposit = useCallback((id: string, topUpAmount: number, date?: string, note?: string) => {
    const opDate = date || new Date().toISOString().split('T')[0];
    setDeposits(prev => prev.map(d => {
      if (d.id !== id) return d;
      const newBalance = d.currentBalance + topUpAmount;
      const newOp: import('../types').DepositOperation = {
        id: 'op-' + Date.now(),
        depositId: id,
        date: opDate,
        type: 'TOPUP',
        amount: topUpAmount,
        balanceAfter: newBalance,
        note: note || 'Пополнение вклада'
      };
      return {
        ...d,
        currentBalance: newBalance,
        operations: [newOp, ...(d.operations || [])]
      };
    }));

    const dep = deposits.find(d => d.id === id);
    addCashflowEntry({
      type: 'EXPENSE',
      category: 'Инвестиции (пополнение)',
      amount: topUpAmount,
      currency: dep?.currency || activeCurrency,
      date: opDate,
      note: `Пополнение вклада: ${dep?.name || 'Вклад'}${note ? ` (${note})` : ''}`
    });
  }, [deposits, activeCurrency, addCashflowEntry]);

  const withdrawDeposit = useCallback((id: string, withdrawAmount: number, date?: string, note?: string) => {
    const opDate = date || new Date().toISOString().split('T')[0];
    setDeposits(prev => prev.map(d => {
      if (d.id !== id) return d;
      const newBalance = Math.max(0, d.currentBalance - withdrawAmount);
      const newOp: import('../types').DepositOperation = {
        id: 'op-' + Date.now(),
        depositId: id,
        date: opDate,
        type: 'WITHDRAW',
        amount: withdrawAmount,
        balanceAfter: newBalance,
        note: note || 'Частичное снятие'
      };
      return {
        ...d,
        currentBalance: newBalance,
        operations: [newOp, ...(d.operations || [])]
      };
    }));

    const dep = deposits.find(d => d.id === id);
    addCashflowEntry({
      type: 'INCOME',
      category: 'Снятие с вклада',
      amount: withdrawAmount,
      currency: dep?.currency || activeCurrency,
      date: opDate,
      note: `Частичное снятие: ${dep?.name || 'Вклад'}${note ? ` (${note})` : ''}`
    });
  }, [deposits, activeCurrency, addCashflowEntry]);

  const addDepositRateChange = useCallback((id: string, effectiveDate: string, newRate: number, note?: string) => {
    setDeposits(prev => prev.map(d => {
      if (d.id !== id) return d;
      const newChange: import('../types').DepositRateChange = {
        id: 'rh-' + Date.now(),
        effectiveDate,
        rate: newRate,
        note
      };
      const updatedHistory = [...(d.rateHistory || []), newChange].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
      
      // If the effective date is today or in the past, update active interestRate
      const today = new Date().toISOString().split('T')[0];
      const shouldUpdateActive = effectiveDate <= today;

      return {
        ...d,
        interestRate: shouldUpdateActive ? newRate : d.interestRate,
        rateHistory: updatedHistory
      };
    }));
  }, []);

  const deleteDepositRateChange = useCallback((depositId: string, rateChangeId: string) => {
    setDeposits(prev => prev.map(d => {
      if (d.id !== depositId) return d;
      const updatedHistory = (d.rateHistory || []).filter(r => r.id !== rateChangeId);
      return {
        ...d,
        rateHistory: updatedHistory
      };
    }));
  }, []);

  const deleteDepositOperation = useCallback((depositId: string, operationId: string) => {
    setDeposits(prev => prev.map(d => {
      if (d.id !== depositId) return d;
      const updatedOps = (d.operations || []).filter(o => o.id !== operationId);
      return {
        ...d,
        operations: updatedOps
      };
    }));
  }, []);

  const updateDepositOperation = useCallback((depositId: string, updatedOp: import('../types').DepositOperation) => {
    setDeposits(prev => prev.map(d => {
      if (d.id !== depositId) return d;
      const updatedOps = (d.operations || []).map(o => o.id === updatedOp.id ? updatedOp : o);
      
      let runningBalance = d.initialAmount;
      let totalEarned = 0;
      const sorted = [...updatedOps].sort((a, b) => a.date.localeCompare(b.date));
      const replayedOps = sorted.map(o => {
        if (o.type === 'TOPUP') {
          runningBalance += o.amount;
        } else if (o.type === 'WITHDRAW') {
          runningBalance = Math.max(0, runningBalance - o.amount);
        } else if (o.type === 'INTEREST') {
          totalEarned += o.amount;
          if (o.note?.includes('капитализацией') || d.isCapitalized) {
            runningBalance += o.amount;
          }
        }
        return {
          ...o,
          balanceAfter: runningBalance
        };
      });

      return {
        ...d,
        currentBalance: runningBalance,
        totalInterestEarned: totalEarned,
        operations: replayedOps.reverse()
      };
    }));
  }, []);

  // Loans Management
  const addLoan = useCallback((loan: Omit<Loan, 'id' | 'totalPaid'>) => {
    const id = 'loan-' + Date.now();
    const newLoan: Loan = {
      ...loan,
      id,
      totalPaid: 0
    };
    setLoans(prev => [newLoan, ...prev]);
  }, []);

  const updateLoan = useCallback((updated: Loan) => {
    setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
  }, []);

  const deleteLoan = useCallback((id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
  }, []);

  // Make loan payment (внести платеж по кредиту)
  const makeLoanPayment = useCallback((id: string, paymentAmount: number, isEarlyPayment: boolean = false, paymentDate?: string, customNote?: string) => {
    const finalDate = paymentDate || new Date().toISOString().split('T')[0];
    const targetLoan = loans.find(l => l.id === id);
    const newPayment: import('../types').LoanPayment = {
      id: 'lp-' + Date.now(),
      loanId: id,
      date: finalDate,
      amount: paymentAmount,
      isEarly: isEarlyPayment,
      note: customNote || (isEarlyPayment ? 'Досрочный платеж' : 'Ежемесячный платеж')
    };

    setLoans(prev => prev.map(l => {
      if (l.id !== id) return l;
      return {
        ...l,
        remainingDebt: Math.max(0, l.remainingDebt - paymentAmount),
        totalPaid: l.totalPaid + paymentAmount,
        payments: [newPayment, ...(l.payments || [])]
      };
    }));

    // Automatically log into Cashflow as Expense!
    addCashflowEntry({
      type: 'EXPENSE',
      category: 'Кредиты и долги',
      amount: paymentAmount,
      currency: targetLoan?.currency || activeCurrency,
      date: finalDate,
      note: `${isEarlyPayment ? 'Досрочный платеж' : 'Ежемесячный платеж'}: ${targetLoan?.name || 'Кредит'}${customNote ? ` (${customNote})` : ''}`
    });
  }, [loans, activeCurrency, addCashflowEntry]);

  const updateLoanPayment = useCallback((loanId: string, updatedPayment: import('../types').LoanPayment) => {
    setLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;
      const currentPayments = l.payments || [];
      const oldPayment = currentPayments.find(p => p.id === updatedPayment.id);
      const oldAmount = oldPayment ? oldPayment.amount : 0;
      const amountDiff = updatedPayment.amount - oldAmount;

      const updatedPayments = currentPayments.map(p => p.id === updatedPayment.id ? updatedPayment : p);
      return {
        ...l,
        remainingDebt: Math.max(0, l.remainingDebt - amountDiff),
        totalPaid: Math.max(0, l.totalPaid + amountDiff),
        payments: updatedPayments
      };
    }));
  }, []);

  const deleteLoanPayment = useCallback((loanId: string, paymentId: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;
      const currentPayments = l.payments || [];
      const paymentToDelete = currentPayments.find(p => p.id === paymentId);
      const deletedAmount = paymentToDelete ? paymentToDelete.amount : 0;

      return {
        ...l,
        remainingDebt: l.remainingDebt + deletedAmount,
        totalPaid: Math.max(0, l.totalPaid - deletedAmount),
        payments: currentPayments.filter(p => p.id !== paymentId)
      };
    }));
  }, []);

  // Restore backup
  const restoreBackup = useCallback((data: BackupData) => {
    if (data.portfolios) setPortfolios(data.portfolios);
    if (data.transactions) setTransactions(data.transactions);
    if (data.quotes) setQuotes(data.quotes);
    if (data.cashflow) setCashflow(data.cashflow);
    if (data.deposits) setDeposits(data.deposits);
    if (data.loans) setLoans(data.loans);
    if (data.portfolios && data.portfolios.length > 0) {
      setSelectedPortfolioId(data.portfolios[0].id);
    }
  }, []);

  // Reset to initial demo data
  const resetToDemoData = useCallback(() => {
    setPortfolios(INITIAL_PORTFOLIOS);
    setSelectedPortfolioId('port-1');
    setTransactions(INITIAL_TRANSACTIONS);
    setQuotes(INITIAL_TICKER_DATABASE);
    setCashflow(INITIAL_CASHFLOW);
    setDeposits(INITIAL_DEPOSITS);
    setLoans(INITIAL_LOANS);
    localStorage.clear();
  }, []);

  return {
    portfolios,
    selectedPortfolioId,
    setSelectedPortfolioId,
    currentPortfolio,
    transactions: currentTransactions,
    allTransactions: transactions,
    quotes,
    cashflow,
    deposits,
    loans,
    holdings,
    summary,
    monthlyDividends,
    depositsSummary,
    loansSummary,
    netWorth,
    netPassiveCashflow,
    activeCurrency,
    addPortfolio,
    updatePortfolio,
    deletePortfolio,
    addTransaction,
    addTransactionsBatch,
    updateTransaction,
    deleteTransaction,
    updateQuote,
    saveQuote,
    deleteQuote,
    splitTicker,
    setAssetPrice,
    refreshMarketQuotes,
    addCashflowEntry,
    updateCashflowEntry,
    deleteCashflowEntry,
    addDeposit,
    updateDeposit,
    deleteDeposit,
    accrueDepositInterest,
    topUpDeposit,
    withdrawDeposit,
    addDepositRateChange,
    deleteDepositRateChange,
    deleteDepositOperation,
    updateDepositOperation,
    addLoan,
    updateLoan,
    deleteLoan,
    makeLoanPayment,
    updateLoanPayment,
    deleteLoanPayment,
    restoreBackup,
    resetToDemoData
  };
}
