import React, { useState } from 'react';
import { AssetQuote, Currency } from '../types';
import { INITIAL_TICKER_DATABASE } from '../data/tickerDatabase';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { Plus, Search, Sparkles, Check, Edit3, Database } from 'lucide-react';

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAssetQuote: (quote: AssetQuote) => void;
  onSelectAssetToBuy: (ticker: string) => void;
  onEditPrice?: (ticker: string) => void;
  onOpenTickerManager?: () => void;
  currency: Currency;
  existingQuotes: Record<string, AssetQuote>;
}

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  isOpen,
  onClose,
  onSaveAssetQuote,
  onSelectAssetToBuy,
  onEditPrice,
  onOpenTickerManager,
  currency,
  existingQuotes
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  const [search, setSearch] = useState('');

  // Custom asset form state
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('Акции');
  const [price, setPrice] = useState('');
  const [dividendYield, setDividendYield] = useState('4.5');
  const [annualDivPerShare, setAnnualDivPerShare] = useState('');
  const [payoutFreq, setPayoutFreq] = useState<'monthly' | 'quarterly' | 'semi-annual' | 'annual'>('quarterly');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([3, 6, 9, 12]);

  if (!isOpen) return null;

  // Catalog items
  const catalogList = Object.values({ ...INITIAL_TICKER_DATABASE, ...existingQuotes })
    .filter(q => 
      q.ticker.toLowerCase().includes(search.toLowerCase()) ||
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.sector.toLowerCase().includes(search.toLowerCase())
    );

  const toggleMonth = (m: number) => {
    setSelectedMonths(prev => 
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.toUpperCase().trim();
    if (!cleanTicker) return;

    const numPrice = Math.abs(parseFloat(price) || 100);
    const numYield = Math.abs(parseFloat(dividendYield) || 0);
    const numDiv = annualDivPerShare 
      ? Math.abs(parseFloat(annualDivPerShare)) 
      : (numPrice * (numYield / 100));

    const quote: AssetQuote = {
      ticker: cleanTicker,
      name: name.trim() || cleanTicker,
      sector: sector.trim() || 'Инвестиции',
      currency,
      price: numPrice,
      previousClose: numPrice,
      changePercent: 0,
      dividendYield: numYield,
      annualDividendPerShare: numDiv,
      payoutFrequency: payoutFreq,
      payoutMonths: selectedMonths.length > 0 ? selectedMonths : [3, 6, 9, 12],
      assetType: 'stock',
      logoColor: '#0ea5e9'
    };

    onSaveAssetQuote(quote);
    onSelectAssetToBuy(cleanTicker);
    onClose();
  };

  const MONTHS_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Добавление актива
              </h3>
              <p className="text-xs text-slate-400">
                Выберите из каталога или создайте свой кастомный тикер
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Каталог акций & ETF
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ввести свой тикер вручную
          </button>
          {onOpenTickerManager && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTickerManager();
              }}
              className="sm:ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Менеджер тикеров</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {activeTab === 'catalog' ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск по тикеру, названию или сектору..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Catalog Grid */}
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {catalogList.map(q => (
                  <div
                    key={q.ticker}
                    onClick={() => {
                      onSelectAssetToBuy(q.ticker);
                      onClose();
                    }}
                    className="p-3 bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                        style={{ backgroundColor: q.logoColor || '#334155' }}
                      >
                        {q.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-white text-sm group-hover:text-emerald-300">
                            {q.ticker}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {q.sector}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {q.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-xs">
                          {formatCurrency(q.price, q.currency)}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400">
                          Див: {q.dividendYield}%
                        </div>
                      </div>

                      {onEditPrice && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPrice(q.ticker);
                          }}
                          title="Задать текущую цену этого актива"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-teal-400 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Тикер (Код)</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: SFIN, NVTK"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Название актива</label>
                  <input
                    type="text"
                    required
                    placeholder="Название компании или фонда"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Сектор экономики</label>
                  <input
                    type="text"
                    placeholder="Финансы, IT, Нефть и газ..."
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Текущая цена ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="100.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Дивидендная доходность (%)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="8.5"
                    value={dividendYield}
                    onChange={(e) => setDividendYield(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Периодичность выплат</label>
                  <select
                    value={payoutFreq}
                    onChange={(e) => {
                      const f = e.target.value as any;
                      setPayoutFreq(f);
                      if (f === 'monthly') setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
                      else if (f === 'quarterly') setSelectedMonths([3, 6, 9, 12]);
                      else if (f === 'semi-annual') setSelectedMonths([6, 12]);
                      else if (f === 'annual') setSelectedMonths([7]);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="monthly">Ежемесячно</option>
                    <option value="quarterly">Ежеквартально</option>
                    <option value="semi-annual">Раз в полгода</option>
                    <option value="annual">Раз в год</option>
                  </select>
                </div>
              </div>

              {/* Month selector checkboxes */}
              <div>
                <label className="text-slate-400 block mb-1.5">
                  Месяцы выплаты дивидендов:
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {MONTHS_NAMES.map((mName, i) => {
                    const mNum = i + 1;
                    const isSelected = selectedMonths.includes(mNum);
                    return (
                      <button
                        type="button"
                        key={mNum}
                        onClick={() => toggleMonth(mNum)}
                        className={`py-1.5 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                            : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Сохранить и купить
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
