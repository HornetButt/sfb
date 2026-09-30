import React, { useState, useEffect, useMemo } from 'react';
import { AssetQuote, HoldingPosition, Currency } from '../types';
import { INITIAL_TICKER_DATABASE } from '../data/tickerDatabase';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Sparkles, 
  Check, 
  Clock,
  Layers,
  Edit3
} from 'lucide-react';

interface EditAssetPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicker?: string;
  quotes: Record<string, AssetQuote>;
  holdings: HoldingPosition[];
  currency: Currency;
  onSetAssetPrice: (ticker: string, newPrice: number, previousClose?: number) => void;
}

export const EditAssetPriceModal: React.FC<EditAssetPriceModalProps> = ({
  isOpen,
  onClose,
  initialTicker = 'SBER',
  quotes,
  holdings,
  currency,
  onSetAssetPrice
}) => {
  const [selectedTicker, setSelectedTicker] = useState<string>(initialTicker);
  const [search, setSearch] = useState<string>('');
  const [newPriceInput, setNewPriceInput] = useState<string>('');
  const [prevPriceInput, setPrevPriceInput] = useState<string>('');
  const [keepPrevAsOldPrice, setKeepPrevAsOldPrice] = useState<boolean>(true);

  // Combine quotes from store and static database
  const allKnownQuotes: Record<string, AssetQuote> = useMemo(() => {
    return {
      ...INITIAL_TICKER_DATABASE,
      ...quotes
    };
  }, [quotes]);

  // When modal opens or initialTicker changes, sync inputs
  useEffect(() => {
    if (initialTicker) {
      setSelectedTicker(initialTicker);
    }
  }, [initialTicker, isOpen]);

  const currentQuote = allKnownQuotes[selectedTicker] || quotes[selectedTicker] || null;

  useEffect(() => {
    if (currentQuote) {
      setNewPriceInput(currentQuote.price.toString());
      setPrevPriceInput(currentQuote.previousClose ? currentQuote.previousClose.toString() : currentQuote.price.toString());
    } else {
      setNewPriceInput('');
      setPrevPriceInput('');
    }
  }, [selectedTicker, currentQuote?.price]);

  if (!isOpen) return null;

  // Search filter
  const searchResults = Object.values(allKnownQuotes).filter(q =>
    q.ticker.toLowerCase().includes(search.toLowerCase()) ||
    q.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  // Holding if owned
  const ownedHolding = holdings.find(h => h.ticker === selectedTicker);

  const parsedNewPrice = Math.abs(parseFloat(newPriceInput) || 0);
  const parsedPrevPrice = keepPrevAsOldPrice
    ? (currentQuote ? currentQuote.price : parsedNewPrice)
    : Math.abs(parseFloat(prevPriceInput) || (currentQuote ? currentQuote.price : parsedNewPrice));

  const priceDiff = parsedNewPrice - parsedPrevPrice;
  const percentDiff = parsedPrevPrice > 0 ? (priceDiff / parsedPrevPrice) * 100 : 0;

  // Impact on position value if owned
  const portfolioImpact = ownedHolding ? ownedHolding.shares * priceDiff : 0;
  const newPositionValue = ownedHolding ? ownedHolding.shares * parsedNewPrice : 0;

  // Impact on dividend yield
  const annualDiv = currentQuote?.annualDividendPerShare || 0;
  const newDividendYield = parsedNewPrice > 0 && annualDiv > 0 ? (annualDiv / parsedNewPrice) * 100 : 0;

  const handleApplyPreset = (percentDelta: number) => {
    if (!currentQuote || currentQuote.price <= 0) return;
    const calculated = +(currentQuote.price * (1 + percentDelta / 100)).toFixed(2);
    setNewPriceInput(calculated.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicker || parsedNewPrice <= 0) return;

    onSetAssetPrice(selectedTicker, parsedNewPrice, parsedPrevPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/10">
              <Edit3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Установка котировки / цены актива
              </h3>
              <p className="text-xs text-slate-400">
                Задайте текущую цену для мониторинга или переоценки портфеля
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Ticker Search & Fast Pick */}
          <div className="space-y-1.5">
            <label className="text-slate-400 block font-medium">Выберите актив (акция, фонд, облигация)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по тикеру или названию: SBER, LKOH, GAZP, AAPL, OFZ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Quick Suggestions / Holdings */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['SBER', 'LKOH', 'GAZP', 'YDEX', 'OFZ-26238', 'O', 'SCHD', 'AAPL'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedTicker(t);
                    setSearch('');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedTicker === t
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search Dropdown Results if searching */}
            {search.trim().length > 0 && (
              <div className="border border-slate-800 rounded-xl bg-slate-950 p-1 divide-y divide-slate-800/60 max-h-36 overflow-y-auto">
                {searchResults.map(q => (
                  <button
                    key={q.ticker}
                    type="button"
                    onClick={() => {
                      setSelectedTicker(q.ticker);
                      setSearch('');
                    }}
                    className="w-full p-2 flex items-center justify-between text-left hover:bg-slate-800/40 rounded-lg cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-white font-mono mr-2">{q.ticker}</span>
                      <span className="text-slate-400 text-[11px]">{q.name}</span>
                    </div>
                    <span className="font-mono text-teal-300">
                      {formatCurrency(q.price, q.currency || currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Asset Info Card */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold font-mono text-white">
                  {selectedTicker}
                </span>
                <span className="text-xs text-slate-400">
                  {currentQuote?.name || selectedTicker}
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {currentQuote?.sector || 'Акции'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Текущая цена в базе:</span>
              <span className="font-mono font-bold text-white text-sm tabular-nums">
                {currentQuote ? formatCurrency(currentQuote.price, currentQuote.currency || currency) : 'Не задана'}
              </span>
            </div>

            {ownedHolding ? (
              <div className="text-[11px] text-teal-300 bg-teal-500/10 p-2 rounded-xl border border-teal-500/20 flex items-center justify-between">
                <span>В вашем портфеле: <strong>{ownedHolding.shares} шт.</strong></span>
                <span>Текущая позиция: <strong>{formatCurrency(ownedHolding.currentValue, currency)}</strong></span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-1.5">
                <span>💡 Актив пока не куплен. Вы можете выставить цену для наблюдения или будущих сделок.</span>
              </div>
            )}
          </div>

          {/* Price Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
                <span>Новая текущая цена ({currentQuote?.currency || currency})</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="250.00"
                value={newPriceInput}
                onChange={(e) => setNewPriceInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-teal-500/40 focus:border-teal-400 rounded-xl text-base font-mono font-bold text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">
                Предыдущая цена (база для % изменения)
              </label>
              <input
                type="number"
                step="any"
                disabled={keepPrevAsOldPrice}
                value={keepPrevAsOldPrice ? (currentQuote ? currentQuote.price : '') : prevPriceInput}
                onChange={(e) => setPrevPriceInput(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-950 border rounded-xl text-base font-mono text-white focus:outline-none ${
                  keepPrevAsOldPrice ? 'border-slate-800 text-slate-400' : 'border-slate-700'
                }`}
              />
            </div>
          </div>

          {/* Checkbox: use current price as previous price */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400">
              <input
                type="checkbox"
                checked={keepPrevAsOldPrice}
                onChange={(e) => setKeepPrevAsOldPrice(e.target.checked)}
                className="w-3.5 h-3.5 accent-teal-500 cursor-pointer"
              />
              <span>Считать текущую цену {currentQuote ? `(${currentQuote.price})` : ''} за вчерашнюю</span>
            </label>
          </div>

          {/* Quick delta buttons (+1%, +5%, +10%, -1%, -5%, -10%) */}
          <div className="space-y-1">
            <div className="text-[11px] text-slate-400">Быстрое изменение цены:</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[+1, +2, +5, +10, -1, -2, -5, -10].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleApplyPreset(pct)}
                  className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-semibold transition-colors cursor-pointer ${
                    pct > 0 
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300' 
                      : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300'
                  }`}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calculation Preview Banner */}
          <div className="p-3.5 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs font-semibold text-white flex items-center justify-between">
              <span>Итог переоценки:</span>
              <span className={`font-mono font-bold text-sm ${priceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceDiff >= 0 ? '+' : ''}{formatCurrency(priceDiff, currentQuote?.currency || currency)} ({formatPercent(percentDiff)})
              </span>
            </div>

            {ownedHolding && (
              <div className="text-[11px] space-y-1 pt-1 border-t border-slate-800/80 font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Новая стоимость позиции ({ownedHolding.shares} шт.):</span>
                  <span className="font-bold text-white">{formatCurrency(newPositionValue, currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Изменение капитала портфеля:</span>
                  <span className={`font-bold ${portfolioImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {portfolioImpact >= 0 ? '+' : ''}{formatCurrency(portfolioImpact, currency)}
                  </span>
                </div>
              </div>
            )}

            {annualDiv > 0 && (
              <div className="text-[11px] flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
                <span>Новая див. доходность:</span>
                <span className="text-emerald-400 font-bold">{newDividendYield.toFixed(2)}% год.</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Сохранить цену {parsedNewPrice > 0 ? `${parsedNewPrice} ${currentQuote?.currency || currency}` : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
