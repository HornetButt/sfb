import React, { useState, useMemo } from 'react';
import { 
  HoldingPosition, 
  Currency, 
  AssetQuote 
} from '../types';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { 
  Search, 
  ArrowUpDown, 
  Plus, 
  Minus, 
  DollarSign, 
  SlidersHorizontal,
  ExternalLink,
  Percent,
  ReceiptText,
  Edit3
} from 'lucide-react';

interface HoldingsListProps {
  holdings: HoldingPosition[];
  currency: Currency;
  onBuy: (ticker: string) => void;
  onSell: (ticker: string) => void;
  onDividend: (ticker: string) => void;
  onCoupon: (ticker: string) => void;
  onEditPrice: (ticker: string) => void;
  onAddNewAsset: () => void;
}

type SortField = 'value' | 'return' | 'yield' | 'yoc' | 'ticker' | 'weight';
type SortOrder = 'asc' | 'desc';

export const HoldingsList: React.FC<HoldingsListProps> = ({
  holdings,
  currency,
  onBuy,
  onSell,
  onDividend,
  onCoupon,
  onEditPrice,
  onAddNewAsset
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Extract unique sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    holdings.forEach(h => {
      if (h.asset.sector) set.add(h.asset.sector);
    });
    return Array.from(set);
  }, [holdings]);

  // Filter & sort
  const filteredHoldings = useMemo(() => {
    return holdings
      .filter(h => {
        const matchesSearch = 
          h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.asset.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = selectedSector === 'ALL' || h.asset.sector === selectedSector;
        return matchesSearch && matchesSector;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'value') diff = a.currentValue - b.currentValue;
        else if (sortField === 'return') diff = a.unrealizedPnLPercent - b.unrealizedPnLPercent;
        else if (sortField === 'yield') diff = a.currentDividendYield - b.currentDividendYield;
        else if (sortField === 'yoc') diff = a.yieldOnCost - b.yieldOnCost;
        else if (sortField === 'weight') diff = a.portfolioWeight - b.portfolioWeight;
        else if (sortField === 'ticker') diff = a.ticker.localeCompare(b.ticker);

        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [holdings, searchQuery, selectedSector, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по тикеру или компании (O, SCHD, SBER)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Sector Filter & Add */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Все секторы ({holdings.length})</option>
            {sectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={onAddNewAsset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить актив</span>
          </button>
        </div>
      </div>

      {/* Holdings Container */}
      {filteredHoldings.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">Позиции не найдены</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            {searchQuery ? 'Попробуйте изменить поисковый запрос или сбросить фильтр' : 'Добавьте первую сделку покупки или импортируйте брокерский отчет'}
          </p>
          <button
            onClick={onAddNewAsset}
            className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Добавить актив</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile List Cards (Visible on mobile screens) */}
          <div className="block lg:hidden space-y-2.5">
            {filteredHoldings.map((h) => {
              const isProfit = h.unrealizedPnL >= 0;
              return (
                <div
                  key={h.ticker}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 transition-all hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: h.asset.logoColor || '#334155' }}
                      >
                        {h.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white font-mono">{h.ticker}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {h.portfolioWeight.toFixed(1)}% портфеля
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {h.asset.name}
                        </div>
                      </div>
                    </div>

                    {/* Value & P&L */}
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-white tabular-nums">
                        {formatCurrency(h.currentValue, currency)}
                      </div>
                      <div className={`text-xs font-mono font-medium tabular-nums ${
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isProfit ? '+' : ''}{formatCurrency(h.unrealizedPnL, currency)} ({formatPercent(h.unrealizedPnLPercent)})
                      </div>
                    </div>
                  </div>

                  {/* Metadata strip without pill badges */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="text-left">
                      <div className="text-[10px] text-slate-500">Количество</div>
                      <div className="font-mono text-slate-300 font-medium">{h.shares} шт.</div>
                      <div className="text-[10px] text-slate-500 font-mono">ср. {formatCurrency(h.averageBuyPrice, currency)}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onEditPrice(h.ticker)}
                      title="Нажмите, чтобы изменить текущую цену актива"
                      className="group/price p-1 rounded-xl hover:bg-slate-800/80 transition-colors text-center cursor-pointer"
                    >
                      <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                        <span>Текущая цена</span>
                        <Edit3 className="w-2.5 h-2.5 text-slate-500 group-hover/price:text-teal-400" />
                      </div>
                      <div className="font-mono text-slate-200 font-medium group-hover/price:text-teal-300 underline decoration-slate-700 underline-offset-2">
                        {formatCurrency(h.currentPrice, currency)}
                      </div>
                      <div className={`text-[10px] font-mono ${h.asset.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatPercent(h.asset.changePercent)}
                      </div>
                    </button>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Див. доход / YoC</div>
                      <div className="font-mono text-emerald-400 font-medium">
                        {formatPercent(h.yieldOnCost, false)} YoC
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatCurrency(h.annualDividendIncome, currency)}/год
                      </div>
                    </div>
                  </div>

                  {/* Fast Action Row */}
                  <div className="mt-3 flex items-center justify-end gap-1.5 pt-1">
                    {h.asset.assetType === 'bond' ? (
                      <button
                        onClick={() => onCoupon(h.ticker)}
                        title="Записать выплату купона по облигации"
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-amber-500/30"
                      >
                        <ReceiptText className="w-3 h-3 text-amber-400" />
                        <span>Купон</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onDividend(h.ticker)}
                        title="Записать полученный дивиденд"
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-emerald-400 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Див.</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSell(h.ticker)}
                      title="Продать часть или полностью"
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-rose-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                      <span>Продать</span>
                    </button>
                    <button
                      onClick={() => onBuy(h.ticker)}
                      title="Докупить позицию"
                      className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Купить</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold select-none">
                    <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('ticker')}>
                      <div className="flex items-center gap-1">
                        <span>Актив</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">Количество</th>
                    <th className="py-3 px-3 text-right">Ср. цена</th>
                    <th className="py-3 px-3 text-right">Тек. цена</th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('value')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Стоимость</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('return')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Прибыль / Убыток</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('yield')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Див. доходность</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('yoc')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Yield on Cost</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('weight')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Доля</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHoldings.map((h) => {
                    const isProfit = h.unrealizedPnL >= 0;
                    return (
                      <tr 
                        key={h.ticker} 
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Asset Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                              style={{ backgroundColor: h.asset.logoColor || '#334155' }}
                            >
                              {h.ticker.slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-bold font-mono text-white text-sm">{h.ticker}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{h.asset.name}</div>
                              <div className="text-[10px] text-slate-500">{h.asset.sector}</div>
                            </div>
                          </div>
                        </td>

                        {/* Shares */}
                        <td className="py-3.5 px-3 text-right font-mono text-slate-200 tabular-nums">
                          {h.shares} шт.
                        </td>

                        {/* Avg Buy */}
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400 tabular-nums">
                          {formatCurrency(h.averageBuyPrice, currency)}
                        </td>

                        {/* Current Price */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onEditPrice(h.ticker)}
                            title="Нажмите, чтобы изменить текущую цену актива"
                            className="group/price text-right inline-block hover:bg-slate-800/80 p-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            <div className="font-mono text-white font-medium tabular-nums flex items-center justify-end gap-1 group-hover/price:text-teal-300">
                              <span className="underline decoration-slate-700 underline-offset-2">{formatCurrency(h.currentPrice, currency)}</span>
                              <Edit3 className="w-3 h-3 text-slate-500 group-hover/price:text-teal-400 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                            </div>
                            <div className={`text-[10px] font-mono tabular-nums ${
                              h.asset.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {formatPercent(h.asset.changePercent)}
                            </div>
                          </button>
                        </td>

                        {/* Current Value */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-white text-sm tabular-nums">
                            {formatCurrency(h.currentValue, currency)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Вложено: {formatCurrency(h.totalInvested, currency)}
                          </div>
                        </td>

                        {/* P&L */}
                        <td className="py-3.5 px-4 text-right">
                          <div className={`font-mono font-semibold tabular-nums ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isProfit ? '+' : ''}{formatCurrency(h.unrealizedPnL, currency)}
                          </div>
                          <div className={`text-[11px] font-mono tabular-nums ${
                            isProfit ? 'text-emerald-400/80' : 'text-rose-400/80'
                          }`}>
                            {formatPercent(h.unrealizedPnLPercent)}
                          </div>
                        </td>

                        {/* Dividend Yield */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          <div className="text-slate-200">{formatPercent(h.currentDividendYield, false)}</div>
                          <div className="text-[10px] text-slate-500">
                            {formatCurrency(h.annualDividendIncome, currency)}/г
                          </div>
                        </td>

                        {/* Yield on Cost */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          <div className="text-emerald-400 font-medium">
                            {formatPercent(h.yieldOnCost, false)}
                          </div>
                        </td>

                        {/* Portfolio Weight */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          <div className="text-slate-300">{h.portfolioWeight.toFixed(1)}%</div>
                          <div className="w-12 h-1 bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, h.portfolioWeight)}%` }}
                            />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {h.asset.assetType === 'bond' ? (
                              <button
                                onClick={() => onCoupon(h.ticker)}
                                title="Записать выплату купона по облигации"
                                className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 transition-colors cursor-pointer border border-amber-500/30"
                              >
                                <ReceiptText className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => onDividend(h.ticker)}
                                title="Записать дивиденд"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onSell(h.ticker)}
                              title="Продать"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onBuy(h.ticker)}
                              title="Купить еще"
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
