import { Portfolio, Transaction, CashflowEntry } from '../types';

export const INITIAL_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port-1',
    name: 'Snowball Dividends (USD)',
    currency: 'USD',
    description: 'Дивидендные аристократы США и ежемесячный доход (REIT & ETF)',
    targetMonthlyDividend: 350,
    createdAt: '2024-01-15'
  },
  {
    id: 'port-2',
    name: 'Дивиденды Мосбиржи (RUB)',
    currency: 'RUB',
    description: 'Высокодоходные дивидендные акции РФ и ОФЗ',
    targetMonthlyDividend: 25000,
    createdAt: '2024-02-10'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Portfolio 1 (USD)
  {
    id: 'tx-1',
    portfolioId: 'port-1',
    ticker: 'O',
    type: 'BUY',
    date: '2024-03-12',
    shares: 45,
    price: 51.50,
    fee: 1.50,
    notes: 'Ежемесячный REIT дивидендный аристократ',
    totalAmount: 45 * 51.50 + 1.50
  },
  {
    id: 'tx-2',
    portfolioId: 'port-1',
    ticker: 'SCHD',
    type: 'BUY',
    date: '2024-04-05',
    shares: 35,
    price: 76.20,
    fee: 1.00,
    notes: 'Ключевой дивидендный фонд ETF',
    totalAmount: 35 * 76.20 + 1.00
  },
  {
    id: 'tx-3',
    portfolioId: 'port-1',
    ticker: 'KO',
    type: 'BUY',
    date: '2024-05-18',
    shares: 40,
    price: 59.80,
    fee: 1.00,
    notes: 'Coca-Cola стабильный дивидендный кэшфлоу',
    totalAmount: 40 * 59.80 + 1.00
  },
  {
    id: 'tx-4',
    portfolioId: 'port-1',
    ticker: 'JNJ',
    type: 'BUY',
    date: '2024-06-20',
    shares: 18,
    price: 148.50,
    fee: 1.20,
    notes: 'Здравоохранение, 60+ лет роста дивидендов',
    totalAmount: 18 * 148.50 + 1.20
  },
  {
    id: 'tx-5',
    portfolioId: 'port-1',
    ticker: 'MAIN',
    type: 'BUY',
    date: '2024-07-10',
    shares: 30,
    price: 46.80,
    fee: 1.00,
    notes: 'Ежемесячные дивиденды BDC',
    totalAmount: 30 * 46.80 + 1.00
  },
  {
    id: 'tx-6',
    portfolioId: 'port-1',
    ticker: 'AAPL',
    type: 'BUY',
    date: '2024-08-01',
    shares: 15,
    price: 195.00,
    fee: 1.00,
    notes: 'Ростовой дивидендный актив',
    totalAmount: 15 * 195.00 + 1.00
  },
  {
    id: 'tx-7',
    portfolioId: 'port-1',
    ticker: 'AAPL',
    type: 'SELL',
    date: '2024-11-15',
    shares: 5,
    price: 225.00,
    fee: 1.00,
    notes: 'Частичная фиксация прибыли по Apple',
    totalAmount: 5 * 225.00 - 1.00
  },
  {
    id: 'tx-8',
    portfolioId: 'port-1',
    ticker: 'O',
    type: 'DIVIDEND',
    date: '2024-09-15',
    shares: 45,
    price: 0.263,
    fee: 0,
    notes: 'Сентябрьский дивиденд Realty Income',
    totalAmount: 11.83
  },
  {
    id: 'tx-9',
    portfolioId: 'port-1',
    ticker: 'SCHD',
    type: 'DIVIDEND',
    date: '2024-09-25',
    shares: 35,
    price: 0.75,
    fee: 0,
    notes: 'Квартальный дивиденд SCHD',
    totalAmount: 26.25
  },

  // Portfolio 2 (RUB)
  {
    id: 'tx-10',
    portfolioId: 'port-2',
    ticker: 'SBER',
    type: 'BUY',
    date: '2024-02-20',
    shares: 600,
    price: 242.00,
    fee: 45.00,
    notes: 'Покупка акций Сбера под дивы',
    totalAmount: 600 * 242.00 + 45.00
  },
  {
    id: 'tx-11',
    portfolioId: 'port-2',
    ticker: 'LKOH',
    type: 'BUY',
    date: '2024-03-15',
    shares: 20,
    price: 6400.00,
    fee: 40.00,
    notes: 'Дивидендный локомотив Лукойл',
    totalAmount: 20 * 6400.00 + 40.00
  },
  {
    id: 'tx-12',
    portfolioId: 'port-2',
    ticker: 'TATN',
    type: 'BUY',
    date: '2024-04-10',
    shares: 150,
    price: 520.00,
    fee: 25.00,
    notes: 'Татнефть ежеквартальные выплаты',
    totalAmount: 150 * 520.00 + 25.00
  },
  {
    id: 'tx-13',
    portfolioId: 'port-2',
    ticker: 'OFZ-26238',
    type: 'BUY',
    date: '2024-05-02',
    shares: 100,
    price: 495.00,
    fee: 20.00,
    notes: 'Длинные ОФЗ с фиксацией высокого купона',
    totalAmount: 100 * 495.00 + 20.00
  },
  {
    id: 'tx-14',
    portfolioId: 'port-2',
    ticker: 'SBER',
    type: 'DIVIDEND',
    date: '2024-07-15',
    shares: 600,
    price: 33.30,
    fee: 0,
    notes: 'Годовой дивиденд Сбербанка 2024',
    totalAmount: 19980.00
  },
  {
    id: 'tx-15',
    portfolioId: 'port-2',
    ticker: 'OFZ-26238',
    type: 'COUPON',
    date: '2024-06-19',
    shares: 100,
    price: 40.56,
    fee: 0,
    notes: 'Выплата полугодового купона по ОФЗ 26238',
    totalAmount: 4056.00
  }
];

export const INITIAL_CASHFLOW: CashflowEntry[] = [
  // September 2024
  {
    id: 'cf-1',
    type: 'INCOME',
    category: 'Заработная плата',
    amount: 180000,
    currency: 'RUB',
    date: '2024-09-05',
    note: 'Основная выплата за август'
  },
  {
    id: 'cf-3',
    type: 'INCOME',
    category: 'Фриланс / Подработка',
    amount: 35000,
    currency: 'RUB',
    date: '2024-09-18',
    note: 'Консультация по архитектуре'
  },
  {
    id: 'cf-4',
    type: 'EXPENSE',
    category: 'Жилье и коммуналка',
    amount: 45000,
    currency: 'RUB',
    date: '2024-09-02',
    note: 'Аренда квартиры + ЖКХ'
  },
  {
    id: 'cf-5',
    type: 'EXPENSE',
    category: 'Инвестиции (пополнение)',
    amount: 50000,
    currency: 'RUB',
    date: '2024-09-06',
    note: 'Пополнение брокерского счета'
  },
  {
    id: 'cf-6',
    type: 'EXPENSE',
    category: 'Продукты и супермаркеты',
    amount: 28400,
    currency: 'RUB',
    date: '2024-09-22',
    note: 'Еженедельные покупки продуктов'
  },
  {
    id: 'cf-7',
    type: 'EXPENSE',
    category: 'Кафе и рестораны',
    amount: 11200,
    currency: 'RUB',
    date: '2024-09-24',
    note: 'Встречи и обеды'
  },
  {
    id: 'cf-8',
    type: 'EXPENSE',
    category: 'Транспорт и авто',
    amount: 8500,
    currency: 'RUB',
    date: '2024-09-26',
    note: 'Бензин и парковки'
  },

  // August 2024
  {
    id: 'cf-9',
    type: 'INCOME',
    category: 'Заработная плата',
    amount: 180000,
    currency: 'RUB',
    date: '2024-08-05',
    note: 'Зарплата за июль'
  },
  {
    id: 'cf-10',
    type: 'INCOME',
    category: 'Премия / Бонус',
    amount: 45000,
    currency: 'RUB',
    date: '2024-08-20',
    note: 'Квартальная премия за проект'
  },
  {
    id: 'cf-11',
    type: 'EXPENSE',
    category: 'Жилье и коммуналка',
    amount: 45000,
    currency: 'RUB',
    date: '2024-08-02',
    note: 'Аренда квартиры'
  },
  {
    id: 'cf-12',
    type: 'EXPENSE',
    category: 'Путешествия',
    amount: 55000,
    currency: 'RUB',
    date: '2024-08-14',
    note: 'Отпуск и билеты'
  },
  {
    id: 'cf-13',
    type: 'EXPENSE',
    category: 'Продукты и супермаркеты',
    amount: 26000,
    currency: 'RUB',
    date: '2024-08-25',
    note: 'Продукты'
  },

  // July 2024
  {
    id: 'cf-14',
    type: 'INCOME',
    category: 'Заработная плата',
    amount: 175000,
    currency: 'RUB',
    date: '2024-07-05',
    note: 'Зарплата'
  },
  {
    id: 'cf-2',
    type: 'INCOME',
    category: 'Дивиденды и купоны',
    amount: 19980,
    currency: 'RUB',
    date: '2024-07-15',
    note: 'Выплата дивидендов Сбербанка',
    relatedPortfolioId: 'port-2'
  },
  {
    id: 'cf-15',
    type: 'EXPENSE',
    category: 'Жилье и коммуналка',
    amount: 45000,
    currency: 'RUB',
    date: '2024-07-02',
    note: 'Аренда'
  },
  {
    id: 'cf-16',
    type: 'EXPENSE',
    category: 'Продукты и супермаркеты',
    amount: 24500,
    currency: 'RUB',
    date: '2024-07-20',
    note: 'Супермаркет'
  },
  {
    id: 'cf-17',
    type: 'EXPENSE',
    category: 'Развлечения и подписки',
    amount: 14000,
    currency: 'RUB',
    date: '2024-07-28',
    note: 'Кино, театр и подписки'
  },

  // June 2024
  {
    id: 'cf-18',
    type: 'INCOME',
    category: 'Заработная плата',
    amount: 175000,
    currency: 'RUB',
    date: '2024-06-05',
    note: 'Зарплата'
  },
  {
    id: 'cf-19',
    type: 'INCOME',
    category: 'Дивиденды и купоны',
    amount: 4056,
    currency: 'RUB',
    date: '2024-06-19',
    note: 'Купон по ОФЗ-26238'
  },
  {
    id: 'cf-20',
    type: 'EXPENSE',
    category: 'Жилье и коммуналка',
    amount: 45000,
    currency: 'RUB',
    date: '2024-06-02',
    note: 'Аренда'
  },
  {
    id: 'cf-21',
    type: 'EXPENSE',
    category: 'Одежда и шопинг',
    amount: 32000,
    currency: 'RUB',
    date: '2024-06-15',
    note: 'Летний гардероб'
  },
  {
    id: 'cf-22',
    type: 'EXPENSE',
    category: 'Продукты и супермаркеты',
    amount: 23800,
    currency: 'RUB',
    date: '2024-06-25',
    note: 'Продукты'
  },

  // May 2024
  {
    id: 'cf-23',
    type: 'INCOME',
    category: 'Заработная плата',
    amount: 170000,
    currency: 'RUB',
    date: '2024-05-05',
    note: 'Зарплата'
  },
  {
    id: 'cf-24',
    type: 'INCOME',
    category: 'Фриланс / Подработка',
    amount: 25000,
    currency: 'RUB',
    date: '2024-05-20',
    note: 'Дизайн веб-сайта'
  },
  {
    id: 'cf-25',
    type: 'EXPENSE',
    category: 'Жилье и коммуналка',
    amount: 45000,
    currency: 'RUB',
    date: '2024-05-02',
    note: 'Аренда'
  },
  {
    id: 'cf-26',
    type: 'EXPENSE',
    category: 'Продукты и супермаркеты',
    amount: 25000,
    currency: 'RUB',
    date: '2024-05-18',
    note: 'Продукты'
  },

  // April 2024
  {
    id: 'cf-27',
    type: 'INCOME',
    category: 'Заработная плата',
    amount: 170000,
    currency: 'RUB',
    date: '2024-04-05',
    note: 'Зарплата'
  },
  {
    id: 'cf-28',
    type: 'EXPENSE',
    category: 'Жилье и коммуналка',
    amount: 45000,
    currency: 'RUB',
    date: '2024-04-02',
    note: 'Аренда'
  },
  {
    id: 'cf-29',
    type: 'EXPENSE',
    category: 'Здоровье и медицина',
    amount: 18500,
    currency: 'RUB',
    date: '2024-04-12',
    note: 'Стоматология и анализы'
  },
  {
    id: 'cf-30',
    type: 'EXPENSE',
    category: 'Продукты и супермаркеты',
    amount: 22000,
    currency: 'RUB',
    date: '2024-04-24',
    note: 'Продукты'
  }
];

export const INITIAL_DEPOSITS: import('../types').BankDeposit[] = [
  {
    id: 'dep-1',
    name: 'ВТБ Вклад «Максимум»',
    bankName: 'Банк ВТБ',
    principalAmount: 350000,
    currentBalance: 362450,
    interestRate: 19.5,
    currency: 'RUB',
    startDate: '2024-06-01',
    endDate: '2025-06-01',
    isCapitalized: true,
    payoutFrequency: 'monthly',
    totalInterestEarned: 12450,
    notes: 'Фиксация высокой ключевой ставки на 1 год',
    rateHistory: [
      { id: 'rh-1', effectiveDate: '2024-06-01', rate: 18.0, note: 'Начальная ставка при открытии' },
      { id: 'rh-2', effectiveDate: '2024-09-01', rate: 19.5, note: 'Повышение ставки банком' }
    ],
    operations: [
      { id: 'op-1', depositId: 'dep-1', date: '2024-07-01', type: 'INTEREST', amount: 5250, balanceAfter: 355250, note: 'Выплата процентов за июнь' },
      { id: 'op-2', depositId: 'dep-1', date: '2024-08-01', type: 'INTEREST', amount: 5328, balanceAfter: 360578, note: 'Выплата процентов за июль' },
      { id: 'op-3', depositId: 'dep-1', date: '2024-09-01', type: 'INTEREST', amount: 5410, balanceAfter: 365988, note: 'Выплата процентов за август' }
    ]
  },
  {
    id: 'dep-2',
    name: 'Накопительный счет Т-Банк',
    bankName: 'Т-Банк',
    principalAmount: 150000,
    currentBalance: 154800,
    interestRate: 16.0,
    currency: 'RUB',
    startDate: '2024-07-01',
    isCapitalized: true,
    payoutFrequency: 'daily',
    totalInterestEarned: 4800,
    notes: 'Подушка безопасности с ежедневным начислением',
    rateHistory: [
      { id: 'rh-3', effectiveDate: '2024-07-01', rate: 14.0, note: 'Базовая ставка' },
      { id: 'rh-4', effectiveDate: '2024-08-15', rate: 16.0, note: 'Подключение подписки Pro' }
    ],
    operations: [
      { id: 'op-4', depositId: 'dep-2', date: '2024-08-01', type: 'INTEREST', amount: 1800, balanceAfter: 151800, note: 'Ежедневные проценты за июль' },
      { id: 'op-5', depositId: 'dep-2', date: '2024-08-10', type: 'TOPUP', amount: 20000, balanceAfter: 171800, note: 'Пополнение с зарплаты' },
      { id: 'op-6', depositId: 'dep-2', date: '2024-09-01', type: 'INTEREST', amount: 2200, balanceAfter: 174000, note: 'Ежедневные проценты за август' },
      { id: 'op-7', depositId: 'dep-2', date: '2024-09-15', type: 'WITHDRAW', amount: 19200, balanceAfter: 154800, note: 'Частичное снятие на покупки' }
    ]
  },
  {
    id: 'dep-3',
    name: 'High Yield Savings USD',
    bankName: 'Interactive / Wise',
    principalAmount: 5000,
    currentBalance: 5120,
    interestRate: 5.25,
    currency: 'USD',
    startDate: '2024-04-10',
    isCapitalized: true,
    payoutFrequency: 'monthly',
    totalInterestEarned: 120,
    notes: 'Долларовый резерв',
    operations: [
      { id: 'op-8', depositId: 'dep-3', date: '2024-05-10', type: 'INTEREST', amount: 21.8, balanceAfter: 5021.8, note: 'Monthly yield payout' },
      { id: 'op-9', depositId: 'dep-3', date: '2024-06-10', type: 'INTEREST', amount: 21.9, balanceAfter: 5043.7, note: 'Monthly yield payout' },
      { id: 'op-10', depositId: 'dep-3', date: '2024-07-10', type: 'INTEREST', amount: 22.0, balanceAfter: 5065.7, note: 'Monthly yield payout' }
    ]
  },
  {
    id: 'dep-4',
    name: 'Сбер Вклад «Лидер»',
    bankName: 'Сбербанк',
    principalAmount: 200000,
    currentBalance: 200000,
    interestRate: 20.0,
    currency: 'RUB',
    startDate: '2024-05-15',
    endDate: '2025-05-15',
    isCapitalized: false,
    payoutFrequency: 'end_of_term',
    totalInterestEarned: 0,
    notes: 'Фиксация 20% годовых с выплатой всей суммы в конце срока'
  }
];

export const INITIAL_LOANS: import('../types').Loan[] = [
  {
    id: 'loan-1',
    name: 'Ипотека на квартиру',
    bankName: 'Сбербанк',
    type: 'mortgage',
    initialAmount: 4200000,
    remainingDebt: 3680000,
    interestRate: 11.4,
    monthlyPayment: 42500,
    paymentDayOfMonth: 15,
    currency: 'RUB',
    startDate: '2022-08-15',
    endDate: '2037-08-15',
    totalPaid: 520000,
    notes: 'Льготная ипотечная программа',
    payments: [
      { id: 'lp-1', loanId: 'loan-1', date: '2026-09-15', amount: 42500, isEarly: false, note: 'Ежемесячный платеж по графику' },
      { id: 'lp-2', loanId: 'loan-1', date: '2026-08-15', amount: 42500, isEarly: false, note: 'Ежемесячный платеж по графику' },
      { id: 'lp-3', loanId: 'loan-1', date: '2026-07-15', amount: 50000, isEarly: true, note: 'Платеж с частичным досрочным погашением' }
    ]
  },
  {
    id: 'loan-2',
    name: 'Автокредит',
    bankName: 'Т-Банк',
    type: 'auto',
    initialAmount: 750000,
    remainingDebt: 320000,
    interestRate: 14.9,
    monthlyPayment: 21800,
    paymentDayOfMonth: 24,
    currency: 'RUB',
    startDate: '2023-09-24',
    endDate: '2026-09-24',
    totalPaid: 430000,
    notes: 'Автомобиль для семьи',
    payments: [
      { id: 'lp-4', loanId: 'loan-2', date: '2026-09-24', amount: 21800, isEarly: false, note: 'Ежемесячный платеж' },
      { id: 'lp-5', loanId: 'loan-2', date: '2026-08-24', amount: 21800, isEarly: false, note: 'Ежемесячный платеж' }
    ]
  }
];

