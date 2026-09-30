import React, { useState } from 'react';
import { BankDeposit, Currency, DepositPayoutFrequency } from '../types';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { 
  generateFuturePaymentSchedule, 
  getEffectiveRate, 
  FREQUENCY_LABELS 
} from '../utils/depositCalculations';
import { 
  Landmark, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Minus, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit3, 
  Sparkles,
  Percent,
  History,
  Trash2
} from 'lucide-react';

interface DepositDetailModalProps {
  deposit: BankDeposit | null;
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onTopUp: (id: string, amount: number, date?: string, note?: string) => void;
  onWithdraw: (id: string, amount: number, date?: string, note?: string) => void;
  onAccrueInterest: (id: string, amount: number, addToBalance: boolean, date?: string) => void;
  onAddRateChange: (id: string, effectiveDate: string, newRate: number, note?: string) => void;
  onDeleteRateChange?: (id: string, rateChangeId: string) => void;
  onDeleteOperation?: (id: string, operationId: string) => void;
  onUpdateOperation?: (depositId: string, operation: import('../types').DepositOperation) => void;
  onUpdateDeposit: (updated: BankDeposit) => void;
}

export const DepositDetailModal: React.FC<DepositDetailModalProps> = ({
  deposit,
  isOpen,
  onClose,
  currency,
  onTopUp,
  onWithdraw,
  onAccrueInterest,
  onAddRateChange,
  onDeleteRateChange,
  onDeleteOperation,
  onUpdateOperation,
  onUpdateDeposit
}) => {
  const [activeTab, setActiveTab] = useState<'future' | 'history' | 'rates' | 'manage'>('future');

  // Quick Action Forms
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDate, setTopUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [topUpNote, setTopUpNote] = useState('');

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [withdrawNote, setWithdrawNote] = useState('');

  const [isRateChangeOpen, setIsRateChangeOpen] = useState(false);
  const [newRateVal, setNewRateVal] = useState('');
  const [rateEffectiveDate, setRateEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateNote, setRateNote] = useState('');

  // Manual Past Payment logging
  const [isManualInterestOpen, setIsManualInterestOpen] = useState(false);
  const [manualInterestAmount, setManualInterestAmount] = useState('');
  const [manualInterestDate, setManualInterestDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualInterestCapitalize, setManualInterestCapitalize] = useState(true);

  // Edit Operation State
  const [editingOp, setEditingOp] = useState<import('../types').DepositOperation | null>(null);
  const [editOpAmount, setEditOpAmount] = useState('');
  const [editOpDate, setEditOpDate] = useState('');
  const [editOpNote, setEditOpNote] = useState('');

  const startEditOp = (op: import('../types').DepositOperation) => {
    setEditingOp(op);
    setEditOpAmount(op.amount.toString());
    setEditOpDate(op.date);
    setEditOpNote(op.note || '');
  };

  const handleSaveOpEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOp || !deposit) return;
    const parsedAmt = Math.abs(parseFloat(editOpAmount) || 0);
    if (parsedAmt <= 0) return;

    if (onUpdateOperation) {
      onUpdateOperation(deposit.id, {
        ...editingOp,
        amount: parsedAmt,
        date: editOpDate,
        note: editOpNote.trim() || undefined
      });
    }
    setEditingOp(null);
  };

  if (!isOpen || !deposit) return null;

  const futureSchedule = generateFuturePaymentSchedule(deposit, 12);
  const effectiveCurrentRate = getEffectiveRate(deposit, new Date().toISOString().split('T')[0]);

  // Handle Top Up
  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.abs(parseFloat(topUpAmount) || 0);
    if (amt <= 0) return;
    onTopUp(deposit.id, amt, topUpDate, topUpNote.trim() || undefined);
    setTopUpAmount('');
    setTopUpNote('');
    setIsTopUpOpen(false);
  };

  // Handle Withdraw
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.abs(parseFloat(withdrawAmount) || 0);
    if (amt <= 0) return;
    onWithdraw(deposit.id, amt, withdrawDate, withdrawNote.trim() || undefined);
    setWithdrawAmount('');
    setWithdrawNote('');
    setIsWithdrawOpen(false);
  };

  // Handle Rate Change
  const handleRateChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = Math.abs(parseFloat(newRateVal) || 0);
    if (r <= 0 || !rateEffectiveDate) return;
    onAddRateChange(deposit.id, rateEffectiveDate, r, rateNote.trim() || undefined);
    setNewRateVal('');
    setRateNote('');
    setIsRateChangeOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/50 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/10">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {deposit.name}
                </h3>
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/15 px-2 py-0.5 rounded-full">
                  {effectiveCurrentRate}% год.
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{deposit.bankName}</span>
                <span aria-hidden="true">·</span>
                <span className="text-teal-300">{FREQUENCY_LABELS[deposit.payoutFrequency]}</span>
                <span aria-hidden="true">·</span>
                <span>{deposit.isCapitalized ? 'С капитализацией' : 'Без капитализации'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Stats Strip */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-500">Текущий баланс</div>
            <div className="text-base font-bold font-mono text-white mt-0.5 tabular-nums">
              {formatCurrency(deposit.currentBalance, deposit.currency || currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Открытие: {formatCurrency(deposit.principalAmount, deposit.currency || currency)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-500">Доход в месяц</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
              +{formatCurrency((deposit.currentBalance * (effectiveCurrentRate / 100)) / 12, deposit.currency || currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              +{formatCurrency(deposit.currentBalance * (effectiveCurrentRate / 100), deposit.currency || currency, true)}/год
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-500">Всего выплачено %</div>
            <div className="text-base font-bold font-mono text-teal-300 mt-0.5 tabular-nums">
              +{formatCurrency(deposit.totalInterestEarned, deposit.currency || currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Чистая прибыль
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-500">Срок вклада</div>
            <div className="text-xs font-semibold text-white mt-1">
              {deposit.endDate ? `до ${deposit.endDate}` : 'Бессрочный'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Открыт: {deposit.startDate}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="px-4 py-2.5 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => {
                setIsTopUpOpen(true);
                setIsWithdrawOpen(false);
                setIsRateChangeOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Пополнить вклад</span>
            </button>

            <button
              onClick={() => {
                setIsWithdrawOpen(true);
                setIsTopUpOpen(false);
                setIsRateChangeOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Снять часть</span>
            </button>

            <button
              onClick={() => {
                setIsRateChangeOpen(true);
                setIsTopUpOpen(false);
                setIsWithdrawOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5 text-teal-400" />
              <span>Изменить ставку с даты</span>
            </button>
          </div>

          <button
            onClick={() => {
              const nextPayment = futureSchedule[0];
              const amt = nextPayment ? nextPayment.amount : (deposit.currentBalance * (effectiveCurrentRate / 100)) / 12;
              onAccrueInterest(deposit.id, amt, deposit.isCapitalized);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Начислить проценты сейчас</span>
          </button>
        </div>

        {/* Inline Drawer Form: Top Up */}
        {isTopUpOpen && (
          <form onSubmit={handleTopUpSubmit} className="p-4 bg-slate-950 border-b border-slate-800 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between font-semibold text-white">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Plus className="w-4 h-4" />
                <span>Пополнение суммы вклада</span>
              </span>
              <button type="button" onClick={() => setIsTopUpOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Сумма пополнения ({deposit.currency})</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="50000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Дата операции</label>
                <input
                  type="date"
                  required
                  value={topUpDate}
                  onChange={(e) => setTopUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Примечание</label>
                <input
                  type="text"
                  placeholder="Премия, кэшбэк или перевод"
                  value={topUpNote}
                  onChange={(e) => setTopUpNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsTopUpOpen(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Отмена</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold">Подтвердить пополнение</button>
            </div>
          </form>
        )}

        {/* Inline Drawer Form: Withdraw */}
        {isWithdrawOpen && (
          <form onSubmit={handleWithdrawSubmit} className="p-4 bg-slate-950 border-b border-slate-800 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between font-semibold text-white">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Minus className="w-4 h-4" />
                <span>Частичное снятие с вклада</span>
              </span>
              <button type="button" onClick={() => setIsWithdrawOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Сумма снятия ({deposit.currency})</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="20000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Дата операции</label>
                <input
                  type="date"
                  required
                  value={withdrawDate}
                  onChange={(e) => setWithdrawDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Примечание</label>
                <input
                  type="text"
                  placeholder="На непредвиденные траты"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsWithdrawOpen(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Отмена</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold">Подтвердить снятие</button>
            </div>
          </form>
        )}

        {/* Inline Drawer Form: Rate Change */}
        {isRateChangeOpen && (
          <form onSubmit={handleRateChangeSubmit} className="p-4 bg-slate-950 border-b border-slate-800 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between font-semibold text-white">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Percent className="w-4 h-4" />
                <span>Изменение процентной ставки с указанной даты</span>
              </span>
              <button type="button" onClick={() => setIsRateChangeOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Новая ставка (% годовых)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="21.0"
                  value={newRateVal}
                  onChange={(e) => setNewRateVal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Действует с даты</label>
                <input
                  type="date"
                  required
                  value={rateEffectiveDate}
                  onChange={(e) => setRateEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Основание / Примечание</label>
                <input
                  type="text"
                  placeholder="Повышение ключевой ставки, смена тарифа"
                  value={rateNote}
                  onChange={(e) => setRateNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsRateChangeOpen(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Отмена</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold">Применить новую ставку</button>
            </div>
          </form>
        )}

        {/* Tab Navigation inside modal */}
        <div className="px-4 pt-3 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('future')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'future'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            График будущих выплат ({futureSchedule.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            История платежей ({deposit.operations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'rates'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            История ставок ({deposit.rateHistory?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Параметры & Периодичность
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: FUTURE PAYMENTS */}
          {activeTab === 'future' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>Прогнозируемые даты и суммы начислений:</span>
                <span className="font-mono text-teal-300">
                  Периодичность: {FREQUENCY_LABELS[deposit.payoutFrequency]}
                </span>
              </div>

              {futureSchedule.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                  Срок вклада завершен или дата окончания в прошлом
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Дата выплаты</th>
                        <th className="py-2.5 px-3">Ставка</th>
                        <th className="py-2.5 px-3 text-right">Начисление %</th>
                        <th className="py-2.5 px-3 text-right">Баланс после</th>
                        <th className="py-2.5 px-3 text-center">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/30 font-mono">
                      {futureSchedule.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-3 text-white font-medium flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{p.date}</span>
                            {p.isEndOfTerm && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded font-sans">
                                В конце срока
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-teal-400 font-semibold">
                            {p.rateApplied}%
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold tabular-nums">
                            +{formatCurrency(p.amount, deposit.currency || currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                            {formatCurrency(p.balanceAfter, deposit.currency || currency)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                onAccrueInterest(deposit.id, p.amount, deposit.isCapitalized, p.date);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-[10px] font-medium font-sans cursor-pointer transition-colors"
                            >
                              Выплатить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREVIOUS PAYMENTS & OPERATIONS */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>История фактических начислений, пополнений и снятий:</span>
                <button
                  onClick={() => setIsManualInterestOpen(!isManualInterestOpen)}
                  className="text-teal-400 hover:text-teal-300 text-xs font-semibold cursor-pointer"
                >
                  {isManualInterestOpen ? '✕ Закрыть форму' : '+ Добавить прошлый платеж'}
                </button>
              </div>

              {/* Form: Add previous payment manually */}
              {isManualInterestOpen && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amt = Math.abs(parseFloat(manualInterestAmount) || 0);
                    if (amt <= 0) return;
                    onAccrueInterest(deposit.id, amt, manualInterestCapitalize, manualInterestDate);
                    setManualInterestAmount('');
                    setIsManualInterestOpen(false);
                  }}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs"
                >
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>Зафиксировать выплату процентов за прошлый период</span>
                    <button type="button" onClick={() => setIsManualInterestOpen(false)} className="text-slate-500 hover:text-white">✕</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Сумма процентов ({deposit.currency})</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="3500"
                        value={manualInterestAmount}
                        onChange={(e) => setManualInterestAmount(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Дата выплаты</label>
                      <input
                        type="date"
                        required
                        value={manualInterestDate}
                        onChange={(e) => setManualInterestDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={manualInterestCapitalize}
                        onChange={(e) => setManualInterestCapitalize(e.target.checked)}
                        className="w-3.5 h-3.5 accent-teal-500"
                      />
                      <span>Капитализировать (прибавить к телу вклада)</span>
                    </label>
                    <button type="submit" className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold">
                      Сохранить выплату
                    </button>
                  </div>
                </form>
              )}

              {(!deposit.operations || deposit.operations.length === 0) ? (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                  Пока не зафиксировано операций. Нажмите «Начислить проценты» или «Пополнить вклад».
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                  {deposit.operations.map(op => {
                    const isInterest = op.type === 'INTEREST';
                    const isTopup = op.type === 'TOPUP';
                    return (
                      <div key={op.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/20">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isInterest 
                              ? 'bg-emerald-500/15 text-emerald-400' 
                              : isTopup 
                              ? 'bg-teal-500/15 text-teal-400' 
                              : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {isInterest ? <DollarSign className="w-4 h-4" /> : isTopup ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {isInterest ? 'Выплата процентов' : isTopup ? 'Пополнение вклада' : 'Снятие средств'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {op.date} {op.note ? `· ${op.note}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <div className={`font-bold text-xs sm:text-sm ${
                              isInterest || isTopup ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {isInterest || isTopup ? '+' : '-'}{formatCurrency(op.amount, deposit.currency || currency)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Баланс: {formatCurrency(op.balanceAfter, deposit.currency || currency)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditOp(op)}
                              className="p-1.5 text-slate-500 hover:text-teal-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Редактировать операцию"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {onDeleteOperation && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Удалить эту операцию из истории вклада?')) {
                                    onDeleteOperation(deposit.id, op.id);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Удалить запись"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Modal to edit operation */}
              {editingOp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-teal-400" />
                        <span>Редактировать операцию вклада</span>
                      </div>
                      <button onClick={() => setEditingOp(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
                    </div>

                    <form onSubmit={handleSaveOpEdit} className="space-y-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Сумма ({deposit.currency})</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={editOpAmount}
                          onChange={(e) => setEditOpAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Дата операции</label>
                        <input
                          type="date"
                          required
                          value={editOpDate}
                          onChange={(e) => setEditOpDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Заметка / Примечание</label>
                        <input
                          type="text"
                          value={editOpNote}
                          onChange={(e) => setEditOpNote(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingOp(null)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold cursor-pointer"
                        >
                          Сохранить
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RATE HISTORY & FUTURE RATE CHANGES */}
          {activeTab === 'rates' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span>Хронология процентных ставок по договору вклада:</span>
                <button
                  onClick={() => setIsRateChangeOpen(true)}
                  className="text-teal-400 hover:text-teal-300 text-xs font-semibold cursor-pointer"
                >
                  + Задать изменение ставки
                </button>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40 divide-y divide-slate-800/60">
                {/* Initial rate */}
                <div className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white text-sm font-mono mr-2">{deposit.interestRate}%</span>
                    <span className="text-slate-400">Действующая ставка</span>
                    {deposit.rateHistory && deposit.rateHistory.length > 0 && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Установлена согласно графику ставок
                      </div>
                    )}
                  </div>
                  <span className="text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    Активна
                  </span>
                </div>

                {deposit.rateHistory?.map(rh => (
                  <div key={rh.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-800/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono text-sm">{rh.rate}%</span>
                        <span className="text-slate-400 font-mono">с {rh.effectiveDate}</span>
                      </div>
                      {rh.note && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rh.note}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {rh.effectiveDate <= new Date().toISOString().split('T')[0] ? 'В силе' : 'Запланировано'}
                      </span>
                      {onDeleteRateChange && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Удалить изменение ставки до ${rh.rate}%?`)) {
                              onDeleteRateChange(deposit.id, rh.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                          title="Удалить ставку"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE FREQUENCY & CAPITALIZATION */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="font-semibold text-white">Периодичность начисления процентов</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['daily', 'monthly', 'quarterly', 'annual', 'end_of_term'] as DepositPayoutFrequency[]).map(freq => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => {
                        onUpdateDeposit({
                          ...deposit,
                          payoutFrequency: freq
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        deposit.payoutFrequency === freq
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs">{FREQUENCY_LABELS[freq]}</div>
                      <div className="text-[10px] text-slate-500">
                        {freq === 'daily' && 'Начисление на остаток каждый день (накопительные счета)'}
                        {freq === 'monthly' && 'Ежемесячный пассивный доход'}
                        {freq === 'quarterly' && 'Выплата каждые 3 месяца'}
                        {freq === 'annual' && 'Выплата раз в 12 месяцев'}
                        {freq === 'end_of_term' && 'Вся сумма процентов при закрытии вклада'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Капитализация процентов</div>
                  <div className="text-slate-400 text-[11px]">
                    При капитализации начисленные проценты прибавляются к остатку вклада
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDeposit({
                      ...deposit,
                      isCapitalized: !deposit.isCapitalized
                    });
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    deposit.isCapitalized ? 'bg-teal-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    deposit.isCapitalized ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Все операции синхронизируются с общим балансом и журналом финансов
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
