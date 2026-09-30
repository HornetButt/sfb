import React, { useState, useMemo } from 'react';
import { AssetQuote, Currency, HoldingPosition, Transaction } from '../types';
import { INITIAL_TICKER_DATABASE } from '../data/tickerDatabase';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { 
  Database, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Scissors, 
  Check, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  TrendingUp,
  ReceiptText,
  DollarSign,
  Package
} from 'lucide-react';

interface TickerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: Record<string, AssetQuote>;
  holdings: HoldingPosition[];
  allTransactions: Transaction[];
  currency: Currency;
  onSaveQuote: (quote: AssetQuote, oldTicker?: string) => void;
  onDeleteQuote: (ticker: string) => void;
  onSplitTicker: (ticker: string, splitRatio: number) => void;
  onOpenPriceEditor: (ticker: string) => void;
}

export const TickerManagerModal: React.FC<TickerManagerModalProps> = ({
  isOpen,
  onClose,
  quotes,
  holdings,
  allTransactions,
  currency,
  onSaveQuote,
  onDeleteQuote,
  onSplitTicker,
  onOpenPriceEditor
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'stock' | 'bond' | 'etf' | 'reit'>('ALL');

  // Sub-modal / Drawer state for Create / Edit
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Split Drawer state
  const [splittingTicker, setSplittingTicker] = useState<string | null>(null);
  const [splitRatioInput, setSplitRatioInput] = useState<string>('10');
  const [splitType, setSplitType] = useState<'forward' | 'reverse'>('forward'); // forward (дробление N:1) or reverse (консолидация 1:N)

  // Edit / Create Form state
  const [formTicker, setFormTicker] = useState('');
  const [formName, setFormName] = useState('');
  const [formSector, setFormSector] = useState('Финансы & Банки');
  const [formAssetType, setFormAssetType] = useState<'stock' | 'bond' | 'etf' | 'reit' | 'crypto'>('stock');
  const [formCurrency, setFormCurrency] = useState<Currency>(currency);
  const [formLotSize, setFormLotSize] = useState<string>('1');
  const [formPrice, setFormPrice] = useState<string>('100');
  const [formDivPerShare, setFormDivPerShare] = useState<string>('0');
  const [formDivYield, setFormDivYield] = useState<string>('0');
  const [formPayoutFreq, setFormPayoutFreq] = useState<'monthly' | 'quarterly' | 'semi-annual' | 'annual'>('quarterly');
  const [formPayoutMonths, setFormPayoutMonths] = useState<number[]>([3, 6, 9, 12]);
  const [formDescription, setFormDescription] = useState('');

  // Delete confirmation state
  const [deleteConfirmTicker, setDeleteConfirmTicker] = useState<string | null>(null);

  // Combine quotes with static database
  const combinedQuotes: Record<string, AssetQuote> = useMemo(() => {
    return {
      ...INITIAL_TICKER_DATABASE,
      ...quotes
    };
  }, [quotes]);

  if (!isOpen) return null;

  // Filter list
  const tickerList = Object.values(combinedQuotes)
    .filter(q => {
      const matchesSearch = 
        q.ticker.toLowerCase().includes(search.toLowerCase()) ||
        q.name.toLowerCase().includes(search.toLowerCase()) ||
        q.sector.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'ALL' || q.assetType === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => a.ticker.localeCompare(b.ticker));

  const startEditTicker = (quote: AssetQuote) => {
    setEditingTicker(quote.ticker);
    setIsCreatingNew(false);
    setFormTicker(quote.ticker);
    setFormName(quote.name);
    setFormSector(quote.sector);
    setFormAssetType(quote.assetType);
    setFormCurrency(quote.currency || currency);
    setFormLotSize((quote.lotSize || 1).toString());
    setFormPrice(quote.price.toString());
    setFormDivPerShare((quote.annualDividendPerShare || 0).toString());
    setFormDivYield((quote.dividendYield || 0).toString());
    setFormPayoutFreq(quote.payoutFrequency || 'quarterly');
    setFormPayoutMonths(quote.payoutMonths || [3, 6, 9, 12]);
    setFormDescription(quote.description || '');
  };

  const startCreateNew = () => {
    setIsCreatingNew(true);
    setEditingTicker(null);
    setFormTicker('');
    setFormName('');
    setFormSector('Акции');
    setFormAssetType('stock');
    setFormCurrency(currency);
    setFormLotSize('1');
    setFormPrice('100');
    setFormDivPerShare('0');
    setFormDivYield('0');
    setFormPayoutFreq('quarterly');
    setFormPayoutMonths([3, 6, 9, 12]);
    setFormDescription('');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = formTicker.toUpperCase().trim();
    if (!cleanTicker) return;

    const parsedPrice = Math.abs(parseFloat(formPrice) || 0);
    const parsedLotSize = Math.max(1, parseInt(formLotSize) || 1);
    const parsedYield = Math.abs(parseFloat(formDivYield) || 0);
    const parsedDivPerShare = formDivPerShare 
      ? Math.abs(parseFloat(formDivPerShare) || 0)
      : (parsedPrice * (parsedYield / 100));

    const finalYield = parsedYield > 0 
      ? parsedYield 
      : (parsedPrice > 0 ? +((parsedDivPerShare / parsedPrice) * 100).toFixed(2) : 0);

    const oldQuote = editingTicker ? combinedQuotes[editingTicker] : null;

    const newQuote: AssetQuote = {
      ticker: cleanTicker,
      name: formName.trim() || cleanTicker,
      sector: formSector.trim() || 'Инвестиции',
      assetType: formAssetType,
      currency: formCurrency,
      lotSize: parsedLotSize,
      price: parsedPrice,
      previousClose: oldQuote ? oldQuote.previousClose : parsedPrice,
      changePercent: oldQuote ? oldQuote.changePercent : 0,
      dividendYield: finalYield,
      annualDividendPerShare: parsedDivPerShare,
      payoutFrequency: formPayoutFreq,
      payoutMonths: formPayoutMonths.length > 0 ? formPayoutMonths : [3, 6, 9, 12],
      logoColor: oldQuote?.logoColor || (formAssetType === 'bond' ? '#f59e0b' : '#0284c7'),
      description: formDescription.trim() || undefined
    };

    onSaveQuote(newQuote, editingTicker || undefined);
    setEditingTicker(null);
    setIsCreatingNew(false);
  };

  const handleExecuteSplit = () => {
    if (!splittingTicker) return;
    const ratioVal = parseFloat(splitRatioInput);
    if (!ratioVal || ratioVal <= 0 || ratioVal === 1) return;

    const finalRatio = splitType === 'forward' ? ratioVal : +(1 / ratioVal).toFixed(6);

    onSplitTicker(splittingTicker, finalRatio);
    setSplittingTicker(null);
  };

  const splitQuote = splittingTicker ? combinedQuotes[splittingTicker] : null;
  const splitHolding = splittingTicker ? holdings.find(h => h.ticker === splittingTicker) : null;
  const parsedRatio = parseFloat(splitRatioInput) || 1;
  const effectiveRatio = splitType === 'forward' ? parsedRatio : (parsedRatio > 0 ? 1 / parsedRatio : 1);

  const previewNewPrice = splitQuote ? +(splitQuote.price / effectiveRatio).toFixed(2) : 0;
  const previewNewShares = splitHolding ? +(splitHolding.shares * effectiveRatio).toFixed(2) : 0;
  const previewNewDiv = splitQuote?.annualDividendPerShare ? +(splitQuote.annualDividendPerShare / effectiveRatio).toFixed(2) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/10">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Менеджер тикеров & База активов</span>
                <span className="text-[11px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full">
                  {tickerList.length} тикеров
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Управление списком инструментов, размерами биржевых лотов, котировками и сплитами акций
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startCreateNew}
              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Добавить тикер</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:px-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по коду тикера, названию, сектору..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['ALL', 'stock', 'bond', 'etf', 'reit'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'ALL' ? 'Все' : t === 'stock' ? 'Акции' : t === 'bond' ? 'Облигации' : t === 'etf' ? 'ETF' : 'REIT'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Body: Table & Cards */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {tickerList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Database className="w-8 h-8 text-slate-600 mx-auto opacity-40" />
              <p>Тикеры не найдены по запросу «{search}».</p>
              <button
                onClick={startCreateNew}
                className="text-teal-400 hover:underline cursor-pointer"
              >
                Создать тикер {search ? `«${search.toUpperCase()}»` : ''}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tickerList.map(q => {
                const holding = holdings.find(h => h.ticker === q.ticker);
                const txCount = allTransactions.filter(t => t.ticker === q.ticker).length;
                const lot = q.lotSize || 1;

                return (
                  <div
                    key={q.ticker}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    {/* Left: Ticker identity & details */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: q.logoColor || '#334155' }}
                      >
                        {q.ticker.slice(0, 3)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold font-mono text-white text-base">
                            {q.ticker}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {q.assetType === 'stock' ? 'Акция' : q.assetType === 'bond' ? 'Облигация' : q.assetType === 'etf' ? 'ETF' : 'REIT'}
                          </span>
                          {/* LOT SIZE BADGE */}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                            <Package className="w-2.5 h-2.5" />
                            <span>1 лот = {lot} шт.</span>
                          </span>

                          {holding && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              В портфеле: {holding.shares} шт.
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-slate-300">{q.name}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500 text-[11px]">{q.sector}</span>
                          {txCount > 0 && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-slate-500 text-[11px]">{txCount} сделок</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Metrics & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60">
                      {/* Price & Dividends */}
                      <div className="text-left sm:text-right font-mono">
                        <div className="text-xs sm:text-sm font-bold text-white">
                          {formatCurrency(q.price, q.currency || currency)}
                        </div>
                        <div className="text-[11px] text-emerald-400">
                          {q.dividendYield > 0 ? `Див: ${q.dividendYield}% (${q.annualDividendPerShare} ${q.currency || currency})` : 'Без дивидендов'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Quick Price Editor */}
                        <button
                          onClick={() => onOpenPriceEditor(q.ticker)}
                          title="Изменить текущую котировку"
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-teal-300 transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Split / Reverse Split */}
                        <button
                          onClick={() => {
                            setSplittingTicker(q.ticker);
                            setSplitRatioInput('10');
                            setSplitType('forward');
                          }}
                          title="Провести сплит / дробление акций"
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 transition-colors cursor-pointer"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Properties */}
                        <button
                          onClick={() => startEditTicker(q)}
                          title="Редактировать параметры тикера (размер лота, название, тип)"
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteConfirmTicker(q.ticker)}
                          title="Удалить тикер из базы"
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: CREATE / EDIT TICKER */}
        {(editingTicker || isCreatingNew) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal-400" />
                  <span>{isCreatingNew ? 'Создать новый тикер' : `Редактировать тикер ${editingTicker}`}</span>
                </h4>
                <button
                  onClick={() => {
                    setEditingTicker(null);
                    setIsCreatingNew(false);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
                {/* Ticker Symbol & Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Код тикера</label>
                    <input
                      type="text"
                      required
                      placeholder="SBER, LKOH, NVDA..."
                      value={formTicker}
                      onChange={(e) => setFormTicker(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono uppercase font-bold text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Тип актива</label>
                    <select
                      value={formAssetType}
                      onChange={(e) => setFormAssetType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="stock">Акция (Stock)</option>
                      <option value="bond">Облигация (Bond / ОФЗ)</option>
                      <option value="etf">Фонд (ETF / БПИФ)</option>
                      <option value="reit">Фонд недвижимости (REIT / ЗПИФ)</option>
                      <option value="crypto">Криптоактив</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Полное название</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: ПАО Сбербанк"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Sector & Currency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Сектор экономики</label>
                    <input
                      type="text"
                      placeholder="Финансы, Нефть и газ, Технологии..."
                      value={formSector}
                      onChange={(e) => setFormSector(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Валюта актива</label>
                    <select
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value as Currency)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="RUB">RUB (₽) — Российский рубль</option>
                      <option value="USD">USD ($) — Доллар США</option>
                      <option value="EUR">EUR (€) — Евро</option>
                      <option value="CNY">CNY (¥) — Юань</option>
                    </select>
                  </div>
                </div>

                {/* CRITICAL: LOT SIZE & PRICE */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/70 border border-teal-500/20 rounded-2xl">
                  <div>
                    <label className="text-teal-300 block mb-1 font-bold flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-teal-400" />
                      <span>Количество в 1 лоте</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      placeholder="10"
                      value={formLotSize}
                      onChange={(e) => setFormLotSize(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-teal-500/40 focus:border-teal-400 rounded-xl font-mono text-sm font-bold text-white focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Сбер = 10, Лукойл = 1, Сургут = 100
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-bold">
                      Текущая цена ({formCurrency})
                    </label>
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="268.40"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Рыночная цена за 1 акцию/бумагу
                    </span>
                  </div>
                </div>

                {/* Dividends / Coupons */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      {formAssetType === 'bond' ? 'Купон в год на 1 бумагу' : 'Дивиденд в год на 1 акцию'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="33.42"
                      value={formDivPerShare}
                      onChange={(e) => setFormDivPerShare(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Периодичность выплат</label>
                    <select
                      value={formPayoutFreq}
                      onChange={(e) => setFormPayoutFreq(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="monthly">Каждый месяц</option>
                      <option value="quarterly">Раз в квартал (4 раза в год)</option>
                      <option value="semi-annual">Раз в полгода (2 раза в год)</option>
                      <option value="annual">Раз в год (1 раз в год)</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-slate-400 block mb-1">Заметки / Описание актива</label>
                  <textarea
                    rows={2}
                    placeholder="Например: Высокая ключевая ставка, дивидендный аристократ..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTicker(null);
                      setIsCreatingNew(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Сохранить параметры тикера</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: STOCK SPLIT / ДРОБЛЕНИЕ АКЦИЙ */}
        {splittingTicker && splitQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Сплит / Дробление акций {splitQuote.ticker}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Пропорциональный пересчет количества акций и цены
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSplittingTicker(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Split Mode: Forward vs Reverse */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSplitType('forward');
                    setSplitRatioInput('10');
                  }}
                  className={`py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                    splitType === 'forward'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Дробление (Сплит N:1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSplitType('reverse');
                    setSplitRatioInput('10');
                  }}
                  className={`py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                    splitType === 'reverse'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Консолидация (1:N)
                </button>
              </div>

              {/* Ratio Presets & Input */}
              <div className="space-y-2">
                <label className="text-slate-400 text-xs block">
                  {splitType === 'forward' 
                    ? 'Коэффициент дробления (во сколько раз увеличится количество бумаг)' 
                    : 'Коэффициент консолидации (во сколько бумаг объединится в одну)'}
                </label>

                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="any"
                      min="1.0001"
                      required
                      placeholder="10"
                      value={splitRatioInput}
                      onChange={(e) => setSplitRatioInput(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-purple-500/40 rounded-xl font-mono text-base font-bold text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <span className="font-mono text-slate-400 text-sm font-bold">
                    {splitType === 'forward' ? 'к 1' : 'в 1'}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['2', '3', '4', '5', '10', '100'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSplitRatioInput(r)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                        splitRatioInput === r
                          ? 'bg-purple-500 text-slate-950'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {splitType === 'forward' ? `${r}:1` : `1:${r}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
                <div className="text-[11px] font-sans font-semibold text-slate-400">
                  Результат применения сплита:
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Рыночная цена:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through">{splitQuote.price} {splitQuote.currency || currency}</span>
                    <ArrowRight className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-300 font-bold">{previewNewPrice} {splitQuote.currency || currency}</span>
                  </div>
                </div>

                {splitHolding && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Количество в портфеле:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 line-through">{splitHolding.shares} шт.</span>
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      <span className="text-emerald-400 font-bold">{previewNewShares} шт.</span>
                    </div>
                  </div>
                )}

                {splitQuote.annualDividendPerShare > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Дивиденд на бумагу:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 line-through">{splitQuote.annualDividendPerShare}</span>
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      <span className="text-teal-300 font-bold">{previewNewDiv}</span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] font-sans text-slate-500 pt-1 border-t border-slate-800">
                  💡 Стоимость позиции в деньгах не изменится. Все сделки покупки и продажи в истории пропорционально пересчитаются.
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSplittingTicker(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSplit}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  <Scissors className="w-4 h-4 stroke-[2.5]" />
                  <span>Применить сплит</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION DIALOG */}
        {deleteConfirmTicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Удалить тикер {deleteConfirmTicker}?</h4>
                  <p className="text-xs text-slate-400">Инструмент будет удален из базы котировок</p>
                </div>
              </div>

              {allTransactions.some(t => t.ticker === deleteConfirmTicker) && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                  Внимание: по тикеру {deleteConfirmTicker} есть сделки в истории!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTicker(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteQuote(deleteConfirmTicker);
                    setDeleteConfirmTicker(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
