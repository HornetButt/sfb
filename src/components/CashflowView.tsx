import React, { useState, useMemo } from 'react';
import { CashflowEntry, Currency } from '../types';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { COMMON_EXPENSE_CATEGORIES, COMMON_INCOME_CATEGORIES } from '../data/tickerDatabase';
import { CashflowTrendChart } from './CashflowTrendChart';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag, 
  PieChart, 
  DollarSign,
  TrendingUp,
  Percent,
  Edit3
} from 'lucide-react';

interface CashflowViewProps {
  cashflow: CashflowEntry[];
  currency: Currency;
  onAddEntry: (entry: Omit<CashflowEntry, 'id'>) => void;
  onUpdateEntry: (entry: CashflowEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  cashflow,
  currency,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // New entry modal / inline form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashflowEntry | null>(null);
  const [entryType, setEntryType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(COMMON_EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  const startEditEntry = (entry: CashflowEntry) => {
    setEditingEntry(entry);
    setEntryType(entry.type);
    setAmount(entry.amount.toString());
    const isCustom = !COMMON_EXPENSE_CATEGORIES.includes(entry.category) && !COMMON_INCOME_CATEGORIES.includes(entry.category);
    if (isCustom) {
      setCategory('CUSTOM');
      setCustomCategory(entry.category);
    } else {
      setCategory(entry.category);
      setCustomCategory('');
    }
    setDate(entry.date);
    setNote(entry.note || '');
    setIsFormOpen(true);
  };

  const startCreateEntry = (type: 'INCOME' | 'EXPENSE' = 'EXPENSE') => {
    setEditingEntry(null);
    setEntryType(type);
    setAmount('');
    setCategory(type === 'EXPENSE' ? COMMON_EXPENSE_CATEGORIES[0] : COMMON_INCOME_CATEGORIES[0]);
    setCustomCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setIsFormOpen(true);
  };

  // Extract available months in cashflow
  const months = useMemo(() => {
    const set = new Set<string>();
    cashflow.forEach(c => {
      const ym = c.date.slice(0, 7); // YYYY-MM
      set.add(ym);
    });
    return Array.from(set).sort().reverse();
  }, [cashflow]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return cashflow
      .filter(c => {
        const matchesType = filterType === 'ALL' || c.type === filterType;
        const matchesMonth = selectedMonth === 'ALL' || c.date.startsWith(selectedMonth);
        return matchesType && matchesMonth;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [cashflow, filterType, selectedMonth]);

  // Aggregate metrics
  const totalIncome = useMemo(() => {
    return cashflow
      .filter(c => c.type === 'INCOME' && (selectedMonth === 'ALL' || c.date.startsWith(selectedMonth)))
      .reduce((sum, c) => sum + c.amount, 0);
  }, [cashflow, selectedMonth]);

  const totalExpense = useMemo(() => {
    return cashflow
      .filter(c => c.type === 'EXPENSE' && (selectedMonth === 'ALL' || c.date.startsWith(selectedMonth)))
      .reduce((sum, c) => sum + c.amount, 0);
  }, [cashflow, selectedMonth]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Expense categories breakdown
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    cashflow
      .filter(c => c.type === 'EXPENSE' && (selectedMonth === 'ALL' || c.date.startsWith(selectedMonth)))
      .forEach(c => {
        map[c.category] = (map[c.category] || 0) + c.amount;
      });

    const total = Object.values(map).reduce((sum, v) => sum + v, 0) || 1;
    return Object.entries(map)
      .map(([cat, val]) => ({
        category: cat,
        amount: val,
        percent: (val / total) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [cashflow, selectedMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.abs(parseFloat(amount) || 0);
    if (parsedAmount <= 0) return;

    const finalCategory = category === 'CUSTOM' ? (customCategory.trim() || 'Прочее') : category;

    if (editingEntry) {
      onUpdateEntry({
        ...editingEntry,
        type: entryType,
        category: finalCategory,
        amount: parsedAmount,
        currency: editingEntry.currency || currency,
        date,
        note: note.trim() || undefined
      });
      setEditingEntry(null);
    } else {
      onAddEntry({
        type: entryType,
        category: finalCategory,
        amount: parsedAmount,
        currency,
        date,
        note: note.trim() || undefined
      });
    }

    setAmount('');
    setNote('');
    setCustomCategory('');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Cashflow summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Incomes */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Доходы</span>
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            +{formatCurrency(totalIncome, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {selectedMonth === 'ALL' ? 'За все время' : `За ${selectedMonth}`}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Расходы</span>
            <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-rose-400 tabular-nums">
            -{formatCurrency(totalExpense, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Все траты за период
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Остаток / Сбережения</div>
          <div className={`mt-1.5 text-xl sm:text-2xl font-bold font-mono tabular-nums ${
            netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Чистый кэшфлоу
          </div>
        </div>

        {/* Savings Rate % */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Норма сбережений</div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-teal-400 tabular-nums">
            {savingsRate.toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            Доля дохода, направленная в накопления
          </div>
        </div>
      </div>

      {/* Linear Trend Chart for Incomes and Expenses */}
      <CashflowTrendChart
        cashflow={cashflow}
        currency={currency}
        selectedMonth={selectedMonth}
      />

      {/* Main Controls & Log Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Все месяцы</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilterType('INCOME')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                filterType === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Доходы
            </button>
            <button
              onClick={() => setFilterType('EXPENSE')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                filterType === 'EXPENSE' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Расходы
            </button>
          </div>
        </div>

        {/* Add Entry Button */}
        <button
          onClick={() => startCreateEntry('EXPENSE')}
          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Записать операцию</span>
        </button>
      </div>

      {/* Quick Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {editingEntry && <Edit3 className="w-4 h-4 text-teal-400" />}
                <span>{editingEntry ? 'Редактировать запись' : 'Новая запись доходов / расходов'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingEntry(null);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('EXPENSE');
                    setCategory(COMMON_EXPENSE_CATEGORIES[0]);
                  }}
                  className={`py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    entryType === 'EXPENSE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Расход (Потратил)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('INCOME');
                    setCategory(COMMON_INCOME_CATEGORIES[0]);
                  }}
                  className={`py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    entryType === 'INCOME'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Доход (Получил)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="text-slate-400 block mb-1">Сумма ({currency})</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-slate-400 block mb-1">Категория</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {(entryType === 'EXPENSE' ? COMMON_EXPENSE_CATEGORIES : COMMON_INCOME_CATEGORIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="CUSTOM">+ Своя категория...</option>
                </select>
              </div>

              {category === 'CUSTOM' && (
                <div>
                  <label className="text-slate-400 block mb-1">Название категории</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Кастомный расход"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Date */}
              <div>
                <label className="text-slate-400 block mb-1">Дата</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Note */}
              <div>
                <label className="text-slate-400 block mb-1">Заметка / Описание</label>
                <input
                  type="text"
                  placeholder="На что конкретно потратил или откуда пришли деньги..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold cursor-pointer"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense categories breakdown */}
      {expenseByCategory.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <h4 className="text-xs font-bold text-white mb-3">
            Структура расходов по категориям
          </h4>
          <div className="space-y-2">
            {expenseByCategory.slice(0, 6).map(item => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.category}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-rose-400">-{formatCurrency(item.amount, currency)}</span>
                    <span className="text-slate-500 text-[11px]">({item.percent.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cashflow Feed */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-white">
            История операций ({filteredEntries.length})
          </h4>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Записей не найдено. Нажмите «Записать операцию», чтобы внести доход или расход.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredEntries.map(entry => {
              const isIncome = entry.type === 'INCOME';
              return (
                <div
                  key={entry.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {entry.category}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {entry.note ? `${entry.note} · ` : ''}{entry.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className={`font-mono font-bold text-xs sm:text-sm tabular-nums mr-1 ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(entry.amount, entry.currency || currency)}
                    </span>

                    <button
                      onClick={() => startEditEntry(entry)}
                      title="Редактировать запись"
                      className="p-1 text-slate-500 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      title="Удалить запись"
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
    </div>
  );
};
