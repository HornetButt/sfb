import { HoldingPosition, Transaction, CashflowEntry, Portfolio, AssetQuote, Currency } from '../types';

export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportHoldingsToCSV(holdings: HoldingPosition[], portfolioName: string, currency: Currency) {
  const headers = [
    'Тикер',
    'Название компании',
    'Сектор',
    'Количество акций',
    'Средняя цена покупки',
    'Текущая цена',
    'Стоимость позиции',
    'Прибыль/Убыток ($/₽)',
    'Доходность (%)',
    'Годовой дивидендный доход',
    'Дивидендная доходность (%)',
    'Yield on Cost (%)',
    'Доля в портфеле (%)',
    'Валюта'
  ];

  const rows = holdings.map(h => [
    `"${h.ticker}"`,
    `"${h.asset.name}"`,
    `"${h.asset.sector}"`,
    h.shares,
    h.averageBuyPrice.toFixed(2),
    h.currentPrice.toFixed(2),
    h.currentValue.toFixed(2),
    h.unrealizedPnL.toFixed(2),
    h.unrealizedPnLPercent.toFixed(2),
    h.annualDividendIncome.toFixed(2),
    h.currentDividendYield.toFixed(2),
    h.yieldOnCost.toFixed(2),
    h.portfolioWeight.toFixed(2),
    currency
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const safeName = portfolioName.replace(/\s+/g, '_').toLowerCase();
  downloadFile(csvContent, `snowball_holdings_${safeName}_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportTransactionsToCSV(transactions: Transaction[], portfolioName: string) {
  const headers = [
    'ID',
    'Дата',
    'Тикер',
    'Тип операции',
    'Количество',
    'Цена за акцию',
    'Комиссия',
    'Общая сумма сделки',
    'Заметки'
  ];

  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.ticker}"`,
    `"${t.type}"`,
    t.shares,
    t.price.toFixed(2),
    t.fee.toFixed(2),
    t.totalAmount.toFixed(2),
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const safeName = portfolioName.replace(/\s+/g, '_').toLowerCase();
  downloadFile(csvContent, `snowball_deals_${safeName}_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportCashflowToCSV(cashflows: CashflowEntry[]) {
  const headers = [
    'ID',
    'Дата',
    'Тип',
    'Категория',
    'Сумма',
    'Валюта',
    'Заметка'
  ];

  const rows = cashflows.map(c => [
    `"${c.id}"`,
    `"${c.date}"`,
    `"${c.type === 'INCOME' ? 'Доход' : 'Расход'}"`,
    `"${c.category}"`,
    c.amount.toFixed(2),
    c.currency,
    `"${(c.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `snowball_cashflow_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportDepositsToCSV(deposits: import('../types').BankDeposit[]) {
  const headers = [
    'ID',
    'Название вклада',
    'Банк',
    'Начальная сумма',
    'Текущий баланс',
    'Ставка (%)',
    'Валюта',
    'Дата открытия',
    'Дата окончания',
    'Капитализация',
    'Периодичность выплат',
    'Выплачено процентов',
    'Заметки'
  ];

  const rows = deposits.map(d => [
    `"${d.id}"`,
    `"${d.name}"`,
    `"${d.bankName}"`,
    d.principalAmount.toFixed(2),
    d.currentBalance.toFixed(2),
    d.interestRate.toFixed(2),
    d.currency,
    d.startDate,
    d.endDate || '',
    d.isCapitalized ? 'Да' : 'Нет',
    d.payoutFrequency,
    d.totalInterestEarned.toFixed(2),
    `"${(d.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `snowball_deposits_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportLoansToCSV(loans: import('../types').Loan[]) {
  const headers = [
    'ID',
    'Название кредита',
    'Банк',
    'Тип',
    'Сумма кредита',
    'Остаток долга',
    'Ставка (%)',
    'Ежемесячный платеж',
    'День платежа',
    'Валюта',
    'Дата оформления',
    'Дата погашения',
    'Всего выплачено',
    'Заметки'
  ];

  const rows = loans.map(l => [
    `"${l.id}"`,
    `"${l.name}"`,
    `"${l.bankName}"`,
    l.type,
    l.initialAmount.toFixed(2),
    l.remainingDebt.toFixed(2),
    l.interestRate.toFixed(2),
    l.monthlyPayment.toFixed(2),
    l.paymentDayOfMonth,
    l.currency,
    l.startDate,
    l.endDate,
    l.totalPaid.toFixed(2),
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `snowball_loans_${new Date().toISOString().split('T')[0]}.csv`);
}

export interface BackupData {
  version: number;
  exportedAt: string;
  portfolios: Portfolio[];
  transactions: Transaction[];
  quotes: Record<string, AssetQuote>;
  cashflow: CashflowEntry[];
  deposits?: import('../types').BankDeposit[];
  loans?: import('../types').Loan[];
}

export function exportFullBackupJSON(
  portfolios: Portfolio[],
  transactions: Transaction[],
  quotes: Record<string, AssetQuote>,
  cashflow: CashflowEntry[],
  deposits?: import('../types').BankDeposit[],
  loans?: import('../types').Loan[]
) {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    portfolios,
    transactions,
    quotes,
    cashflow,
    deposits: deposits || [],
    loans: loans || []
  };

  const jsonStr = JSON.stringify(data, null, 2);
  downloadFile(jsonStr, `snowball_invest_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

export function parseBackupJSON(jsonStr: string): BackupData | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && Array.isArray(parsed.portfolios) && Array.isArray(parsed.transactions)) {
      return parsed as BackupData;
    }
    return null;
  } catch {
    return null;
  }
}
