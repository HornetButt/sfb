import React, { useState } from 'react';
import { BankDeposit, Loan, LoanPayment, Currency, LoanType, DepositPayoutFrequency } from '../types';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { FREQUENCY_LABELS, getEffectiveRate } from '../utils/depositCalculations';
import { DepositDetailModal } from './DepositDetailModal';
import { 
  Landmark, 
  CreditCard, 
  Plus, 
  Minus, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Percent, 
  Calendar, 
  Sparkles, 
  Trash2, 
  ShieldCheck, 
  TrendingUp,
  AlertCircle,
  Home,
  Car,
  ReceiptText,
  ChevronRight,
  ExternalLink,
  History,
  Edit3
} from 'lucide-react';

interface DepositsAndLoansViewProps {
  deposits: BankDeposit[];
  loans: Loan[];
  currency: Currency;
  depositsSummary: {
    totalBalance: number;
    annualInterest: number;
    monthlyInterest: number;
    avgRate: number;
    totalInterestEarnedAllTime: number;
    count: number;
  };
  loansSummary: {
    totalDebt: number;
    totalMonthlyPayment: number;
    totalPaidAllTime: number;
    weightedRate: number;
    count: number;
  };
  portfolioTotalValue: number;
  portfolioMonthlyDividends: number;
  netWorth: number;
  onAddDeposit: (d: Omit<BankDeposit, 'id' | 'totalInterestEarned'>) => void;
  onDeleteDeposit: (id: string) => void;
  onAccrueInterest: (id: string, amount: number, addToBalance: boolean, date?: string) => void;
  onTopUpDeposit: (id: string, amount: number, date?: string, note?: string) => void;
  onWithdrawDeposit: (id: string, amount: number, date?: string, note?: string) => void;
  onAddDepositRateChange: (id: string, effectiveDate: string, newRate: number, note?: string) => void;
  onDeleteDepositRateChange?: (id: string, rateChangeId: string) => void;
  onDeleteDepositOperation?: (id: string, operationId: string) => void;
  onUpdateDepositOperation?: (depositId: string, operation: import('../types').DepositOperation) => void;
  onUpdateDeposit: (updated: BankDeposit) => void;
  onAddLoan: (l: Omit<Loan, 'id' | 'totalPaid'>) => void;
  onUpdateLoan: (updated: Loan) => void;
  onDeleteLoan: (id: string) => void;
  onMakeLoanPayment: (id: string, amount: number, isEarly: boolean, date?: string, note?: string) => void;
  onUpdateLoanPayment?: (loanId: string, payment: import('../types').LoanPayment) => void;
  onDeleteLoanPayment?: (loanId: string, paymentId: string) => void;
}

export const DepositsAndLoansView: React.FC<DepositsAndLoansViewProps> = ({
  deposits,
  loans,
  currency,
  depositsSummary,
  loansSummary,
  portfolioTotalValue,
  portfolioMonthlyDividends,
  netWorth,
  onAddDeposit,
  onDeleteDeposit,
  onAccrueInterest,
  onTopUpDeposit,
  onWithdrawDeposit,
  onAddDepositRateChange,
  onDeleteDepositRateChange,
  onDeleteDepositOperation,
  onUpdateDepositOperation,
  onUpdateDeposit,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  onMakeLoanPayment,
  onUpdateLoanPayment,
  onDeleteLoanPayment
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'deposits' | 'loans'>('deposits');

  // Selected deposit for full modal view (Payment schedule, rate changes, history)
  const [selectedDetailDepositId, setSelectedDetailDepositId] = useState<string | null>(null);

  // Modal / form states
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<BankDeposit | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Interest payout modal state
  const [accrueTargetDeposit, setAccrueTargetDeposit] = useState<BankDeposit | null>(null);
  const [interestPayoutAmount, setInterestPayoutAmount] = useState<string>('');
  const [capitalizeInterest, setCapitalizeInterest] = useState<boolean>(true);

  // Loan payment modal state
  const [paymentTargetLoan, setPaymentTargetLoan] = useState<Loan | null>(null);
  const [loanPaymentAmount, setLoanPaymentAmount] = useState<string>('');
  const [isEarlyPayment, setIsEarlyPayment] = useState<boolean>(false);

  // New Deposit Form State
  const [depName, setDepName] = useState('');
  const [depBank, setDepBank] = useState('');
  const [depAmount, setDepAmount] = useState('');
  const [depRate, setDepRate] = useState('18.5');
  const [depStartDate, setDepStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [depEndDate, setDepEndDate] = useState('');
  const [depFreq, setDepFreq] = useState<DepositPayoutFrequency>('monthly');
  const [depCapitalized, setDepCapitalized] = useState(true);
  const [depNotes, setDepNotes] = useState('');

  // New Loan Form State
  const [loanName, setLoanName] = useState('');
  const [loanBank, setLoanBank] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('consumer');
  const [loanInitialAmount, setLoanInitialAmount] = useState('');
  const [loanRemainingDebt, setLoanRemainingDebt] = useState('');
  const [loanRate, setLoanRate] = useState('14.5');
  const [loanMonthlyPayment, setLoanMonthlyPayment] = useState('');
  const [loanDayOfMonth, setLoanDayOfMonth] = useState('15');
  const [loanStartDate, setLoanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanEndDate, setLoanEndDate] = useState('');
  const [loanNotes, setLoanNotes] = useState('');

  // Get active selected detail deposit object
  const selectedDetailDeposit = deposits.find(d => d.id === selectedDetailDepositId) || null;

  const startEditDeposit = (d: BankDeposit) => {
    setEditingDeposit(d);
    setDepName(d.name);
    setDepBank(d.bankName);
    setDepAmount(d.currentBalance.toString());
    setDepRate(d.interestRate.toString());
    setDepFreq(d.payoutFrequency);
    setDepStartDate(d.startDate);
    setDepEndDate(d.endDate || '');
    setDepCapitalized(d.isCapitalized);
    setDepNotes(d.notes || '');
    setIsDepositModalOpen(true);
  };

  const startCreateDeposit = () => {
    setEditingDeposit(null);
    setDepName('');
    setDepBank('');
    setDepAmount('');
    setDepRate('18.5');
    setDepFreq('monthly');
    setDepStartDate(new Date().toISOString().split('T')[0]);
    setDepEndDate('');
    setDepCapitalized(true);
    setDepNotes('');
    setIsDepositModalOpen(true);
  };

  const startEditLoan = (l: Loan) => {
    setEditingLoan(l);
    setLoanName(l.name);
    setLoanBank(l.bankName);
    setLoanType(l.type);
    setLoanInitialAmount(l.initialAmount.toString());
    setLoanRemainingDebt(l.remainingDebt.toString());
    setLoanRate(l.interestRate.toString());
    setLoanMonthlyPayment(l.monthlyPayment.toString());
    setLoanDayOfMonth(l.paymentDayOfMonth.toString());
    setLoanStartDate(l.startDate);
    setLoanEndDate(l.endDate || '');
    setLoanNotes(l.notes || '');
    setIsLoanModalOpen(true);
  };

  const startCreateLoan = () => {
    setEditingLoan(null);
    setLoanName('');
    setLoanBank('');
    setLoanType('consumer');
    setLoanInitialAmount('');
    setLoanRemainingDebt('');
    setLoanRate('14.5');
    setLoanMonthlyPayment('');
    setLoanDayOfMonth('15');
    setLoanStartDate(new Date().toISOString().split('T')[0]);
    setLoanEndDate('');
    setLoanNotes('');
    setIsLoanModalOpen(true);
  };

  // Handle deposit submit (create or update)
  const handleCreateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.abs(parseFloat(depAmount) || 0);
    const rate = Math.abs(parseFloat(depRate) || 0);
    if (!depName.trim() || amount <= 0) return;

    if (editingDeposit) {
      onUpdateDeposit({
        ...editingDeposit,
        name: depName.trim(),
        bankName: depBank.trim() || 'Банк',
        currentBalance: amount,
        interestRate: rate,
        startDate: depStartDate,
        endDate: depEndDate.trim() || undefined,
        isCapitalized: depCapitalized,
        payoutFrequency: depFreq,
        notes: depNotes.trim() || undefined
      });
      setEditingDeposit(null);
    } else {
      onAddDeposit({
        name: depName.trim(),
        bankName: depBank.trim() || 'Банк',
        principalAmount: amount,
        currentBalance: amount,
        interestRate: rate,
        currency,
        startDate: depStartDate,
        endDate: depEndDate.trim() || undefined,
        isCapitalized: depCapitalized,
        payoutFrequency: depFreq,
        notes: depNotes.trim() || undefined
      });
    }

    setDepName('');
    setDepBank('');
    setDepAmount('');
    setDepRate('18.5');
    setDepNotes('');
    setIsDepositModalOpen(false);
  };

  // Handle loan submit (create or update)
  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const initialAmt = Math.abs(parseFloat(loanInitialAmount) || 0);
    const remDebt = Math.abs(parseFloat(loanRemainingDebt) || initialAmt);
    const rate = Math.abs(parseFloat(loanRate) || 0);
    const monthlyPay = Math.abs(parseFloat(loanMonthlyPayment) || 0);
    if (!loanName.trim() || initialAmt <= 0) return;

    if (editingLoan) {
      onUpdateLoan({
        ...editingLoan,
        name: loanName.trim(),
        bankName: loanBank.trim() || 'Банк',
        type: loanType,
        initialAmount: initialAmt,
        remainingDebt: remDebt,
        interestRate: rate,
        monthlyPayment: monthlyPay,
        paymentDayOfMonth: Math.min(31, Math.max(1, parseInt(loanDayOfMonth) || 15)),
        startDate: loanStartDate,
        endDate: loanEndDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes: loanNotes.trim() || undefined
      });
      setEditingLoan(null);
    } else {
      onAddLoan({
        name: loanName.trim(),
        bankName: loanBank.trim() || 'Банк',
        type: loanType,
        initialAmount: initialAmt,
        remainingDebt: remDebt,
        interestRate: rate,
        monthlyPayment: monthlyPay,
        paymentDayOfMonth: Math.min(31, Math.max(1, parseInt(loanDayOfMonth) || 15)),
        currency,
        startDate: loanStartDate,
        endDate: loanEndDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes: loanNotes.trim() || undefined
      });
    }

    setLoanName('');
    setLoanBank('');
    setLoanInitialAmount('');
    setLoanRemainingDebt('');
    setLoanRate('14.5');
    setLoanMonthlyPayment('');
    setLoanNotes('');
    setIsLoanModalOpen(false);
  };

  // Net Passive Monthly Cashflow
  const totalPassiveIn = portfolioMonthlyDividends + depositsSummary.monthlyInterest;
  const totalDebtOut = loansSummary.totalMonthlyPayment;
  const netMonthlyPassive = totalPassiveIn - totalDebtOut;

  const loanTypeIcons: Record<LoanType, any> = {
    mortgage: Home,
    auto: Car,
    consumer: ReceiptText,
    credit_card: CreditCard,
    other: CreditCard
  };

  const loanTypeLabels: Record<LoanType, string> = {
    mortgage: 'Ипотека',
    auto: 'Автокредит',
    consumer: 'Потребительский',
    credit_card: 'Кредитная карта',
    other: 'Кредит / Долг'
  };

  return (
    <div className="space-y-6">
      {/* Net Worth & Financial Balance Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Чистый капитал (Net Worth)</span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                Активы − Обязательства
              </span>
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold font-mono text-white tracking-tight mt-1.5 tabular-nums">
              {formatCurrency(netWorth, currency)}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 mt-2 font-mono">
              <span className="text-slate-300">
                Инвестиции: <strong className="text-white">{formatCurrency(portfolioTotalValue, currency, true)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-teal-300">
                Вклады: <strong className="text-white">{formatCurrency(depositsSummary.totalBalance, currency, true)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-rose-400">
                Кредиты: <strong className="text-rose-300">-{formatCurrency(loansSummary.totalDebt, currency, true)}</strong>
              </span>
            </div>
          </div>

          {/* Monthly Net Passive Flow Box */}
          <div className="p-3.5 sm:p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between shrink-0 lg:w-72">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Пассивный баланс / мес</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${netMonthlyPassive >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {netMonthlyPassive >= 0 ? 'В плюсе' : 'Долговая нагрузка'}
              </span>
            </div>
            <div className={`text-lg sm:text-xl font-bold font-mono mt-1 tabular-nums ${netMonthlyPassive >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netMonthlyPassive >= 0 ? '+' : ''}{formatCurrency(netMonthlyPassive, currency)}/мес
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono flex items-center justify-between">
              <span>Дивы+Проценты: +{formatCurrency(totalPassiveIn, currency, true)}</span>
              <span>Платежи: -{formatCurrency(totalDebtOut, currency, true)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Segment Switcher & Add Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl self-start">
          <button
            onClick={() => setActiveSubTab('deposits')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'deposits'
                ? 'bg-slate-800 text-teal-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Landmark className="w-4 h-4 text-teal-400" />
            <span>Вклады & Счета ({deposits.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('loans')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'loans'
                ? 'bg-slate-800 text-rose-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4 text-rose-400" />
            <span>Кредиты & Долги ({loans.length})</span>
          </button>
        </div>

        <div>
          {activeSubTab === 'deposits' ? (
            <button
              onClick={startCreateDeposit}
              className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Добавить вклад</span>
            </button>
          ) : (
            <button
              onClick={startCreateLoan}
              className="px-3.5 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Добавить кредит</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW: DEPOSITS */}
      {activeSubTab === 'deposits' && (
        <div className="space-y-5">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-slate-400 text-xs">Общая сумма на вкладах</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                {formatCurrency(depositsSummary.totalBalance, currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {depositsSummary.count} активных вкладов
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-slate-400 text-xs">Средняя ставка</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-teal-400 tabular-nums">
                {depositsSummary.avgRate.toFixed(2)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Годовая доходность вкладов
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-slate-400 text-xs">Доход в месяц (проценты)</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                +{formatCurrency(depositsSummary.monthlyInterest, currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                +{formatCurrency(depositsSummary.annualInterest, currency, true)} / год
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-slate-400 text-xs">Всего выплачено процентов</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                {formatCurrency(depositsSummary.totalInterestEarnedAllTime, currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                За все время удержания
              </div>
            </div>
          </div>

          {/* Deposits List */}
          {deposits.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
              <Landmark className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white">Вклады не добавлены</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Добавьте банковские вклады или накопительные счета с ежедневной, ежемесячной или годовой выплатой.
              </p>
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Открыть вклад</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {deposits.map(d => {
                const effectiveRate = getEffectiveRate(d, new Date().toISOString().split('T')[0]);
                const monthEstimated = (d.currentBalance * (effectiveRate / 100)) / 12;

                return (
                  <div
                    key={d.id}
                    className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-teal-500/40 transition-all cursor-pointer group"
                    onClick={() => setSelectedDetailDepositId(d.id)}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-500/25 transition-colors">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                              {d.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {d.bankName} · {FREQUENCY_LABELS[d.payoutFrequency]}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                            {effectiveRate}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-slate-400">Текущий баланс:</span>
                          <span className="text-base font-bold font-mono text-white tabular-nums">
                            {formatCurrency(d.currentBalance, d.currency || currency)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Ожидаемый доход в мес:</span>
                          <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                            +{formatCurrency(monthEstimated, d.currency || currency)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Выплачено всего:</span>
                          <span className="font-mono text-slate-300 tabular-nums">
                            {formatCurrency(d.totalInterestEarned, d.currency || currency)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>{d.isCapitalized ? 'С капитализацией' : 'На отдельный счет'}</span>
                          <span className="text-teal-400 group-hover:underline flex items-center gap-0.5">
                            График и история →
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div 
                      className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setAccrueTargetDeposit(d);
                            setInterestPayoutAmount(monthEstimated.toFixed(2));
                            setCapitalizeInterest(d.isCapitalized);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          title="Начислить проценты по вкладу"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Начислить %</span>
                        </button>
                        <button
                          onClick={() => setSelectedDetailDepositId(d.id)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer"
                        >
                          Детали
                        </button>
                        <button
                          onClick={() => startEditDeposit(d)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                          title="Редактировать параметры вклада"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить вклад "${d.name}"?`)) {
                            onDeleteDeposit(d.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: LOANS */}
      {activeSubTab === 'loans' && (
        <div className="space-y-5">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-slate-400 text-xs">Общий остаток долга</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-rose-400 tabular-nums">
                {formatCurrency(loansSummary.totalDebt, currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {loansSummary.count} активных обязательств
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-slate-400 text-xs">Платежи по кредитам в месяц</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-rose-300 tabular-nums">
                -{formatCurrency(loansSummary.totalMonthlyPayment, currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Обязательная ежемесячная нагрузка
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-slate-400 text-xs">Средневзвешенная ставка</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
                {loansSummary.weightedRate.toFixed(2)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Стоимость заемных средств
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-slate-400 text-xs">Всего выплачено по долгам</div>
              <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-slate-300 tabular-nums">
                {formatCurrency(loansSummary.totalPaidAllTime, currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Погашено основного долга и %
              </div>
            </div>
          </div>

          {/* Loans List */}
          {loans.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
              <CreditCard className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white">Кредитов и долгов нет</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Здесь можно отслеживать ипотеку, автокредиты или кредитные карты с графиком платежей и погашением.
              </p>
              <button
                onClick={() => setIsLoanModalOpen(true)}
                className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Добавить кредит</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {loans.map(l => {
                const Icon = loanTypeIcons[l.type] || CreditCard;
                const paidOffPercent = l.initialAmount > 0
                  ? Math.min(100, Math.max(0, ((l.initialAmount - l.remainingDebt) / l.initialAmount) * 100))
                  : 0;

                return (
                  <div
                    key={l.id}
                    className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">{l.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {l.bankName} · {loanTypeLabels[l.type]}
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full shrink-0">
                          {l.interestRate}%
                        </span>
                      </div>

                      {/* Progress Bar of Loan Repayment */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Остаток долга:</span>
                          <span className="text-base font-bold font-mono text-rose-400 tabular-nums">
                            {formatCurrency(l.remainingDebt, l.currency || currency)}
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${paidOffPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Погашено: {paidOffPercent.toFixed(1)}%</span>
                          <span>Из {formatCurrency(l.initialAmount, l.currency || currency, true)}</span>
                        </div>

                        <div className="pt-1 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Платеж в месяц:</span>
                            <span className="font-mono text-white font-semibold tabular-nums">
                              {formatCurrency(l.monthlyPayment, l.currency || currency)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">День списания:</span>
                            <span className="font-mono text-slate-300">
                              {l.paymentDayOfMonth}-е число каждого месяца
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>Всего выплачено: {formatCurrency(l.totalPaid, l.currency || currency)}</span>
                            <span>до {l.endDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => {
                          setPaymentTargetLoan(l);
                          setLoanPaymentAmount(l.monthlyPayment.toString());
                          setIsEarlyPayment(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Внести платеж</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить кредит "${l.name}"?`)) {
                            onDeleteLoan(l.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR SELECTED DEPOSIT */}
      {selectedDetailDeposit && (
        <DepositDetailModal
          deposit={selectedDetailDeposit}
          isOpen={!!selectedDetailDeposit}
          onClose={() => setSelectedDetailDepositId(null)}
          currency={currency}
          onTopUp={onTopUpDeposit}
          onWithdraw={onWithdrawDeposit}
          onAccrueInterest={onAccrueInterest}
          onAddRateChange={onAddDepositRateChange}
          onDeleteRateChange={onDeleteDepositRateChange}
          onDeleteOperation={onDeleteDepositOperation}
          onUpdateDeposit={onUpdateDeposit}
        />
      )}

      {/* MODAL: ACCRUE INTEREST ON DEPOSIT */}
      {accrueTargetDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Выплата процентов по вкладу</h3>
                <p className="text-xs text-slate-400">{accrueTargetDeposit.name}</p>
              </div>
              <button
                onClick={() => setAccrueTargetDeposit(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Сумма начисленных процентов ({accrueTargetDeposit.currency})</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={interestPayoutAmount}
                  onChange={(e) => setInterestPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base font-mono text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Капитализировать проценты</div>
                  <div className="text-[10px] text-slate-500">Добавить к телу вклада для увеличения доходности</div>
                </div>
                <input
                  type="checkbox"
                  checked={capitalizeInterest}
                  onChange={(e) => setCapitalizeInterest(e.target.checked)}
                  className="w-4 h-4 accent-teal-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-300 text-[11px]">
                💡 Эта сумма также автоматически запишется в журнал «Доходов и расходов» в категорию «Проценты по вкладам».
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAccrueTargetDeposit(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const amt = Math.abs(parseFloat(interestPayoutAmount) || 0);
                    if (amt > 0) {
                      onAccrueInterest(accrueTargetDeposit.id, amt, capitalizeInterest);
                      setAccrueTargetDeposit(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold cursor-pointer"
                >
                  Начислить проценты
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MAKE LOAN PAYMENT */}
      {paymentTargetLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Внесение платежа по кредиту</h3>
                <p className="text-xs text-slate-400">{paymentTargetLoan.name} ({paymentTargetLoan.bankName})</p>
              </div>
              <button
                onClick={() => setPaymentTargetLoan(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Сумма платежа ({paymentTargetLoan.currency})</label>
                <input
                  type="number"
                  step="any"
                  value={loanPaymentAmount}
                  onChange={(e) => setLoanPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Досрочное погашение</div>
                  <div className="text-[10px] text-slate-500">Внесение суммы сверх обязательного платежа</div>
                </div>
                <input
                  type="checkbox"
                  checked={isEarlyPayment}
                  onChange={(e) => setIsEarlyPayment(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-[11px]">
                💳 Платеж уменьшит остаток задолженности и автоматически зафиксируется в расходах бюджета («Кредиты и долги»).
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentTargetLoan(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const amt = Math.abs(parseFloat(loanPaymentAmount) || 0);
                    if (amt > 0) {
                      onMakeLoanPayment(paymentTargetLoan.id, amt, isEarlyPayment);
                      setPaymentTargetLoan(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold cursor-pointer"
                >
                  Внести платеж
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DEPOSIT */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Добавить вклад или накопительный счет</h3>
              <button onClick={() => setIsDepositModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeposit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Название вклада</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: ВТБ Вклад Доходный"
                    value={depName}
                    onChange={(e) => setDepName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Банк</label>
                  <input
                    type="text"
                    required
                    placeholder="Т-Банк, Сбер, ВТБ, Альфа"
                    value={depBank}
                    onChange={(e) => setDepBank(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Сумма вклада ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="100000"
                    value={depAmount}
                    onChange={(e) => setDepAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Процентная ставка (% год.)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="19.5"
                    value={depRate}
                    onChange={(e) => setDepRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Frequency selection: daily, monthly, quarterly, annual, end_of_term */}
              <div>
                <label className="text-slate-400 block mb-1">Периодичность выплат процентов</label>
                <select
                  value={depFreq}
                  onChange={(e) => setDepFreq(e.target.value as DepositPayoutFrequency)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="daily">Каждый день (накопительные счета)</option>
                  <option value="monthly">Раз в месяц</option>
                  <option value="quarterly">Раз в квартал (каждые 3 месяца)</option>
                  <option value="annual">Раз в год</option>
                  <option value="end_of_term">В конце срока</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Дата открытия</label>
                  <input
                    type="date"
                    required
                    value={depStartDate}
                    onChange={(e) => setDepStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Дата окончания (опционально)</label>
                  <input
                    type="date"
                    value={depEndDate}
                    onChange={(e) => setDepEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Капитализация процентов</div>
                  <div className="text-[10px] text-slate-500">Начисленные проценты прибавляются к телу вклада</div>
                </div>
                <input
                  type="checkbox"
                  checked={depCapitalized}
                  onChange={(e) => setDepCapitalized(e.target.checked)}
                  className="w-4 h-4 accent-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Заметка / Примечание</label>
                <input
                  type="text"
                  placeholder="Условия досрочного снятия или промо-ставка"
                  value={depNotes}
                  onChange={(e) => setDepNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold cursor-pointer"
                >
                  Создать вклад
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE LOAN */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Добавить кредит или ипотеку</h3>
              <button onClick={() => setIsLoanModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Название обязательства</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Ипотека на квартиру"
                    value={loanName}
                    onChange={(e) => setLoanName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Банк / Кредитор</label>
                  <input
                    type="text"
                    required
                    placeholder="Сбер, ВТБ, Т-Банк, Райф"
                    value={loanBank}
                    onChange={(e) => setLoanBank(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Тип кредита</label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value as LoanType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="mortgage">Ипотека</option>
                    <option value="consumer">Потребительский</option>
                    <option value="auto">Автокредит</option>
                    <option value="credit_card">Кредитная карта</option>
                    <option value="other">Другой долг</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Процентная ставка (% год.)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="12.5"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Начальная сумма кредита ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="2000000"
                    value={loanInitialAmount}
                    onChange={(e) => setLoanInitialAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Текущий остаток долга ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="1850000"
                    value={loanRemainingDebt}
                    onChange={(e) => setLoanRemainingDebt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Ежемесячный платеж ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="25000"
                    value={loanMonthlyPayment}
                    onChange={(e) => setLoanMonthlyPayment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">День платежа в месяце</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    placeholder="15"
                    value={loanDayOfMonth}
                    onChange={(e) => setLoanDayOfMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Дата оформления</label>
                  <input
                    type="date"
                    required
                    value={loanStartDate}
                    onChange={(e) => setLoanStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Дата окончания (погашения)</label>
                  <input
                    type="date"
                    required
                    value={loanEndDate}
                    onChange={(e) => setLoanEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Заметка</label>
                <input
                  type="text"
                  placeholder="Страховка, льготная ставка или условия"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold cursor-pointer"
                >
                  Сохранить кредит
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
