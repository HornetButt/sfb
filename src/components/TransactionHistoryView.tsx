import React, { useState, useMemo } from 'react';
import { Transaction, Currency, TransactionType } from '../types';
import { formatCurrency } from '../utils/portfolioCalculations';
import { 
  Clock, 
  Search, 
  Plus, 
  Minus, 
  DollarSign, 
  ArrowDownLeft, 
  Trash2,
  FileSpreadsheet,
  ReceiptText,
  Edit3
} from 'lucide-react';

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  currency: Currency;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onNewTransaction: () => void;
  onExportCSV: () => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  currency,
  onDeleteTransaction,
  onEditTransaction,
  onNewTransaction,
  onExportCSV
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
        const matchesSearch = 
          t.ticker.toLowerCase().includes(search.toLowerCase()) ||
          (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));
        return matchesType && matchesSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, search, typeFilter]);

  const typeConfig: Record<TransactionType, { label: string; color: string; icon: any }> = {
    BUY: { label: 'Покупка', color: 'text-emerald-400 bg-emerald-500/10', icon: Plus },
    SELL: { label: 'Продажа', color: 'text-rose-400 bg-rose-500/10', icon: Minus },
    DIVIDEND: { label: 'Дивиденд', color: 'text-teal-400 bg-teal-500/10', icon: DollarSign },
    COUPON: { label: 'Купон', color: 'text-amber-400 bg-amber-500/10', icon: ReceiptText },
    DEPOSIT: { label: 'Пополнение', color: 'text-blue-400 bg-blue-500/10', icon: ArrowDownLeft },
    WITHDRAW: { label: 'Вывод', color: 'text-amber-400 bg-amber-500/10', icon: ArrowDownLeft }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по сделке или тикеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(['ALL', 'BUY', 'SELL', 'DIVIDEND', 'COUPON', 'DEPOSIT', 'WITHDRAW'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'ALL' 
                  ? 'Все' 
                  : t === 'BUY' 
                  ? 'Покупки' 
                  : t === 'SELL' 
                  ? 'Продажи' 
                  : t === 'DIVIDEND' 
                  ? 'Дивиденды' 
                  : t === 'COUPON' 
                  ? 'Купоны' 
                  : t === 'DEPOSIT'
                  ? 'Пополнения'
                  : 'Выводы'}
              </button>
            ))}
          </div>

          <button
            onClick={onExportCSV}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Экспорт сделок</span>
          </button>

          <button
            onClick={onNewTransaction}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Новая сделка</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Сделок не найдено
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map(tx => {
              const cfg = typeConfig[tx.type] || typeConfig.BUY;
              const Icon = cfg.icon;

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-sm text-white">
                          {tx.ticker}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tx.type === 'DEPOSIT' || tx.type === 'WITHDRAW' 
                          ? `${tx.date} · ${cfg.label} счета`
                          : `${tx.date} · ${tx.shares} шт. по ${formatCurrency(tx.price, currency)}`}
                        {tx.fee > 0 ? ` · комиссия ${formatCurrency(tx.fee, currency)}` : ''}
                      </div>
                      {tx.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">
                          "{tx.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="text-right mr-1">
                      <div className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
                        {formatCurrency(tx.totalAmount, currency)}
                      </div>
                    </div>

                    <button
                      onClick={() => onEditTransaction(tx)}
                      title="Редактировать сделку"
                      className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      title="Удалить сделку"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
