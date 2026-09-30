import React, { useState, useEffect } from 'react';
import { TransactionType, Currency, AssetQuote, Transaction } from '../types';
import { INITIAL_TICKER_DATABASE } from '../data/tickerDatabase';
import { formatCurrency } from '../utils/portfolioCalculations';
import { Plus, Minus, DollarSign, ArrowDownLeft, Search, ReceiptText, Edit3, Check } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tx: {
    id?: string;
    portfolioId: string;
    ticker: string;
    type: TransactionType;
    date: string;
    shares: number;
    price: number;
    fee: number;
    notes?: string;
  }) => void;
  portfolioId: string;
  currency: Currency;
  initialType?: TransactionType;
  initialTicker?: string;
  editingTransaction?: Transaction | null;
  quotes: Record<string, AssetQuote>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  portfolioId,
  currency,
  initialType = 'BUY',
  initialTicker = '',
  editingTransaction = null,
  quotes
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [ticker, setTicker] = useState<string>(initialTicker);
  const [shares, setShares] = useState<string>('1');
  const [price, setPrice] = useState<string>('');
  const [fee, setFee] = useState<string>('0');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [tickerSuggestionsOpen, setTickerSuggestionsOpen] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setTicker(editingTransaction.ticker);
      setShares(editingTransaction.shares.toString());
      setPrice(editingTransaction.price.toString());
      setFee(editingTransaction.fee.toString());
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
      return;
    }

    if (initialType) setType(initialType);
    if (initialTicker) {
      setTicker(initialTicker);
      const q = quotes[initialTicker];
      if (q) {
        if (initialType === 'COUPON' || initialType === 'DIVIDEND') {
          const divPerPayout = (q.annualDividendPerShare || 0) / (q.payoutMonths.length || 2);
          setPrice(divPerPayout > 0 ? divPerPayout.toFixed(2) : '1');
        } else {
          setPrice(q.price.toString());
        }
      }
    }
  }, [editingTransaction, initialType, initialTicker, quotes, isOpen]);

  if (!isOpen) return null;

  const handleSelectTicker = (selectedTicker: string) => {
    setTicker(selectedTicker);
    const q = quotes[selectedTicker];
    if (q) {
      if (type === 'DIVIDEND' || type === 'COUPON') {
        const divPerPayout = (q.annualDividendPerShare || 0) / (q.payoutMonths.length || (q.assetType === 'bond' ? 2 : 4));
        setPrice(divPerPayout > 0 ? divPerPayout.toFixed(2) : '1');
        if (q.assetType === 'bond' && type !== 'COUPON') {
          setType('COUPON');
        }
      } else {
        setPrice(q.price.toString());
      }
    }
    setTickerSuggestionsOpen(false);
  };

  const numShares = Math.abs(parseFloat(shares) || 0);
  const numPrice = Math.abs(parseFloat(price) || 0);
  const numFee = Math.abs(parseFloat(fee) || 0);

  const totalCalculated = type === 'BUY'
    ? numShares * numPrice + numFee
    : type === 'SELL'
    ? Math.max(0, numShares * numPrice - numFee)
    : (type === 'DEPOSIT' || type === 'WITHDRAW')
    ? numPrice
    : numShares * numPrice;

  const filteredQuotes = Object.values(quotes).filter(q => 
    q.ticker.toLowerCase().includes(ticker.toLowerCase()) ||
    q.name.toLowerCase().includes(ticker.toLowerCase())
  ).slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || numShares <= 0 || numPrice <= 0) return;

    onSubmit({
      id: editingTransaction ? editingTransaction.id : undefined,
      portfolioId: editingTransaction ? editingTransaction.portfolioId : portfolioId,
      ticker: ticker.toUpperCase().trim(),
      type,
      date,
      shares: numShares,
      price: numPrice,
      fee: numFee,
      notes: notes.trim() || (type === 'COUPON' ? 'Выплата купона по облигации' : undefined)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingTransaction && (
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">
                {editingTransaction ? `Редактирование сделки` : 'Новая сделка / транзакция'}
              </h3>
              {editingTransaction && (
                <p className="text-xs text-slate-400">Корректировка параметров сделки {editingTransaction.ticker}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Type Selector Segment (BUY, SELL, DIVIDEND, COUPON, DEPOSIT, WITHDRAW) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-2xl text-[11px]">
          <button
            type="button"
            onClick={() => {
              setType('BUY');
              if (ticker === 'CASH' || ticker === 'RUB') setTicker('');
            }}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              type === 'BUY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Покупка</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('SELL');
              if (ticker === 'CASH' || ticker === 'RUB') setTicker('');
            }}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              type === 'SELL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Продажа</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('DIVIDEND');
              if (ticker === 'CASH' || ticker === 'RUB') setTicker('');
            }}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              type === 'DIVIDEND'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Дивиденд</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('COUPON');
              if (ticker === 'CASH' || ticker === 'RUB') setTicker('');
            }}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              type === 'COUPON'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Купон</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('DEPOSIT');
              if (!ticker || ticker === 'CASH') setTicker(currency);
              setShares('1');
            }}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              type === 'DEPOSIT'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Пополнение</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('WITHDRAW');
              if (!ticker || ticker === 'CASH') setTicker(currency);
              setShares('1');
            }}
            className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              type === 'WITHDRAW'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 rotate-180" />
            <span>Вывод</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Ticker Input & Suggestions */}
          <div className="relative">
            <label className="text-slate-400 block mb-1">
              {type === 'COUPON' ? 'Тикер / Код облигации (ОФЗ, корпоративная)' : 'Тикер акции / фонда / облигации'}
            </label>
            <input
              type="text"
              required
              placeholder={type === 'COUPON' ? 'Например: OFZ-26238, SU26238' : 'Например: O, SCHD, SBER, AAPL...'}
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value.toUpperCase());
                setTickerSuggestionsOpen(true);
              }}
              onFocus={() => setTickerSuggestionsOpen(true)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
            />

            {tickerSuggestionsOpen && filteredQuotes.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-30 max-h-48 overflow-y-auto">
                {filteredQuotes.map(q => (
                  <button
                    type="button"
                    key={q.ticker}
                    onClick={() => handleSelectTicker(q.ticker)}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/80 rounded-lg text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-bold font-mono text-white mr-2">{q.ticker}</span>
                      <span className="text-slate-400 text-[11px]">{q.name}</span>
                      {q.assetType === 'bond' && (
                        <span className="ml-2 text-[10px] text-amber-400 font-mono">Облигация</span>
                      )}
                    </div>
                    <span className="font-mono text-emerald-400 text-[11px]">
                      {formatCurrency(q.price, currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shares and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 block text-xs">
                  {type === 'COUPON' ? 'Количество (шт)' : type === 'DIVIDEND' ? 'Количество акций' : 'Количество (шт)'}
                </label>
                {quotes[ticker.toUpperCase().trim()]?.lotSize && (quotes[ticker.toUpperCase().trim()]?.lotSize || 1) > 1 && (
                  <span className="text-[10px] text-cyan-300 font-mono">
                    1 лот = {quotes[ticker.toUpperCase().trim()]?.lotSize} шт.
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                required
                min="0.0001"
                placeholder="10"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              {quotes[ticker.toUpperCase().trim()]?.lotSize && (quotes[ticker.toUpperCase().trim()]?.lotSize || 1) > 1 && (
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono">
                  <span className="text-slate-500">Лоты:</span>
                  {[1, 5, 10, 50].map(lots => {
                    const lotSz = quotes[ticker.toUpperCase().trim()]?.lotSize || 1;
                    return (
                      <button
                        key={lots}
                        type="button"
                        onClick={() => setShares((lots * lotSz).toString())}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title={`Установить ${lots} лот(ов) = ${lots * lotSz} шт.`}
                      >
                        {lots}л
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">
                {type === 'COUPON' 
                  ? `Купон на 1 облигацию (${currency})` 
                  : type === 'DIVIDEND' 
                  ? 'Дивиденд на акцию' 
                  : type === 'DEPOSIT'
                  ? `Сумма пополнения (${currency})`
                  : type === 'WITHDRAW'
                  ? `Сумма вывода (${currency})`
                  : `Цена за шт (${currency})`}
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.0001"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fee & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">
                {(type === 'DEPOSIT' || type === 'WITHDRAW') ? 'Комиссия перевода' : 'Комиссия брокера'}
              </label>
              <input
                type="number"
                step="any"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Дата сделки / операции</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-400 block mb-1">Заметка / Обоснование</label>
            <input
              type="text"
              placeholder={type === 'COUPON' 
                ? 'Выплата купона за полугодие' 
                : type === 'DEPOSIT'
                ? 'Например: Пополнение с карты Т-Банк'
                : type === 'WITHDRAW'
                ? 'Например: Вывод средств на банковский счет'
                : 'Например: Покупка под дивидендную отсечку'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Calculated Total Bar */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <span className="text-slate-400">
              {type === 'COUPON' 
                ? 'Итоговая выплата купона:' 
                : type === 'DIVIDEND' 
                ? 'Итоговая сумма дивидендов:' 
                : type === 'DEPOSIT'
                ? 'Сумма пополнения:'
                : type === 'WITHDRAW'
                ? 'Сумма к выводу:'
                : 'Итоговая сумма сделки:'}
            </span>
            <span className="font-mono font-bold text-base text-white">
              {formatCurrency(totalCalculated, currency)}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {editingTransaction
                  ? 'Сохранить изменения'
                  : type === 'BUY' ? 'Купить в портфель' : type === 'SELL' ? 'Зафиксировать продажу' : type === 'COUPON' ? 'Записать выплату купона' : type === 'DIVIDEND' ? 'Записать дивиденд' : type === 'DEPOSIT' ? 'Внести пополнение' : 'Зафиксировать вывод'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
