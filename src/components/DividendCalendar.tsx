import React, { useState, useMemo } from 'react';
import { 
  MonthlyDividendProjection, 
  HoldingPosition, 
  Currency 
} from '../types';
import { formatCurrency, formatPercent, MONTH_SHORT_RU } from '../utils/portfolioCalculations';
import { 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Repeat, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DividendCalendarProps {
  monthlyDividends: MonthlyDividendProjection[];
  holdings: HoldingPosition[];
  currency: Currency;
  onRecordDividend: (ticker: string, isCoupon?: boolean) => void;
}

export const DividendCalendar: React.FC<DividendCalendarProps> = ({
  monthlyDividends,
  holdings,
  currency,
  onRecordDividend
}) => {
  const currentMonthIdx = new Date().getMonth();
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(currentMonthIdx);

  // Snowball Simulator inputs
  const [monthlyTopUp, setMonthlyTopUp] = useState<number>(currency === 'RUB' ? 25000 : 250);
  const [reinvestDividends, setReinvestDividends] = useState<boolean>(true);
  const [expectedYieldRate, setExpectedYieldRate] = useState<number>(7.5);

  const activeHoldings = useMemo(() => {
    return holdings.filter(h => h.shares > 0 && h.annualDividendIncome > 0);
  }, [holdings]);

  const totalAnnualDividends = useMemo(() => {
    return monthlyDividends.reduce((sum, m) => sum + m.projectedAmount, 0);
  }, [monthlyDividends]);

  const monthlyAverage = totalAnnualDividends / 12;
  const dailyAverage = totalAnnualDividends / 365;

  const maxMonthAmount = useMemo(() => {
    return Math.max(...monthlyDividends.map(m => m.projectedAmount), 1);
  }, [monthlyDividends]);

  const selectedMonth = monthlyDividends[selectedMonthIdx];

  // Snowball Compounding Projection Engine (1, 3, 5, 10 years)
  const currentTotalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  const snowballProjections = useMemo(() => {
    const years = [1, 3, 5, 10];
    const rate = expectedYieldRate / 100;

    return years.map(yr => {
      let cap = currentTotalValue;
      let annualDiv = totalAnnualDividends;

      for (let y = 1; y <= yr; y++) {
        // Yearly additions
        cap += monthlyTopUp * 12;
        // Dividend generated
        const yearDiv = cap * rate;
        if (reinvestDividends) {
          cap += yearDiv;
        }
        annualDiv = cap * rate;
      }

      return {
        years: yr,
        projectedCapital: cap,
        projectedAnnualDividends: annualDiv,
        projectedMonthlyDividends: annualDiv / 12
      };
    });
  }, [currentTotalValue, totalAnnualDividends, monthlyTopUp, reinvestDividends, expectedYieldRate]);

  return (
    <div className="space-y-6">
      {/* Top Dividend Run-Rate Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Годовой доход</span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Forward run-rate
            </span>
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {formatCurrency(totalAnnualDividends, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Ожидаемые выплаты за 12 месяцев
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">В среднем в месяц</div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {formatCurrency(monthlyAverage, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Пассивный кэшфлоу
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">В среднем в день</div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {formatCurrency(dailyAverage, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Пока вы спите или работаете
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-slate-400 text-xs">Дивидендных активов</div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {activeHoldings.length} из {holdings.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            {((activeHoldings.length / Math.max(1, holdings.length)) * 100).toFixed(0)}% позиций платят дивы
          </div>
        </div>
      </div>

      {/* 12-Month Dividend Payout Bar Chart */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Дивидендный календарь по месяцам</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Нажмите на столбец любого месяца, чтобы увидеть список компаний и сумму выплат
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Выбран: <span className="text-emerald-400 font-semibold">{selectedMonth.monthName}</span>
          </div>
        </div>

        {/* Bar chart grid */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2 h-44 sm:h-52 pt-6 items-end border-b border-slate-800/80 pb-2">
          {monthlyDividends.map((m) => {
            const isSelected = selectedMonthIdx === m.monthIndex;
            const isCurrentMonth = currentMonthIdx === m.monthIndex;
            const heightPercent = maxMonthAmount > 0 
              ? Math.max(8, (m.projectedAmount / maxMonthAmount) * 100) 
              : 8;

            return (
              <button
                key={m.monthIndex}
                onClick={() => setSelectedMonthIdx(m.monthIndex)}
                className="group relative flex flex-col items-center h-full justify-end cursor-pointer focus:outline-none"
              >
                {/* Value on hover or selected */}
                <div className={`absolute -top-6 text-[10px] font-mono font-medium whitespace-nowrap transition-opacity ${
                  isSelected ? 'opacity-100 text-emerald-300' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                }`}>
                  {formatCurrency(m.projectedAmount, currency, true)}
                </div>

                {/* The Bar */}
                <div className="w-full max-w-[28px] h-full flex items-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20'
                        : isCurrentMonth
                        ? 'bg-slate-700 hover:bg-emerald-500/50 border border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  />
                </div>

                {/* Month Label */}
                <span className={`text-[10px] font-mono mt-1.5 ${
                  isSelected 
                    ? 'text-emerald-400 font-bold' 
                    : isCurrentMonth 
                    ? 'text-slate-200 font-medium' 
                    : 'text-slate-500'
                }`}>
                  {MONTH_SHORT_RU[m.monthIndex]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Month Detail Box */}
        <div className="mt-4 pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-200">
              Выплаты в {selectedMonth.monthName}:{' '}
              <span className="text-emerald-400 font-mono font-bold text-sm">
                {formatCurrency(selectedMonth.projectedAmount, currency)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {selectedMonth.items.length} выплаты запланировано
            </div>
          </div>

          {selectedMonth.items.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              В этом месяце нет запланированных дивидендных отсечек
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {selectedMonth.items.map((item, idx) => {
                const holding = holdings.find(h => h.ticker === item.ticker);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                        style={{ backgroundColor: holding?.asset.logoColor || '#334155' }}
                      >
                        {item.ticker.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs font-mono text-white">{item.ticker}</span>
                          {holding?.asset.assetType === 'bond' && (
                            <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                              Купон
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.shares} шт. · {formatCurrency(item.amountPerShare, currency)}/{holding?.asset.assetType === 'bond' ? 'обл.' : 'акц.'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(item.totalAmount, currency)}
                      </div>
                      <button
                        onClick={() => onRecordDividend(item.ticker, holding?.asset.assetType === 'bond')}
                        className={`text-[10px] underline cursor-pointer transition-colors ${
                          holding?.asset.assetType === 'bond'
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-slate-400 hover:text-emerald-300'
                        }`}
                      >
                        {holding?.asset.assetType === 'bond' ? 'Записать купон' : 'Записать факт'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Snowball Compounding Effect Simulator (Эффект снежного кома) */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Эффект снежного кома (Snowball Simulator)
              </h3>
              <p className="text-xs text-slate-400">
                Моделирование экспоненциального роста дивидендов при регулярных довложениях и DRIP
              </p>
            </div>
          </div>
        </div>

        {/* Simulator controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl mb-4 text-xs">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Ежемесячное пополнение: <span className="text-white font-mono font-semibold">{formatCurrency(monthlyTopUp, currency)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={currency === 'RUB' ? 200000 : 2000}
              step={currency === 'RUB' ? 5000 : 50}
              value={monthlyTopUp}
              onChange={(e) => setMonthlyTopUp(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Ожидаемая див. доходность: <span className="text-emerald-400 font-mono font-semibold">{expectedYieldRate}% годовых</span>
            </label>
            <input
              type="range"
              min={3}
              max={18}
              step={0.5}
              value={expectedYieldRate}
              onChange={(e) => setExpectedYieldRate(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 sm:pt-0">
            <div>
              <div className="text-[11px] text-slate-200 font-medium">Реинвестирование (DRIP)</div>
              <div className="text-[10px] text-slate-500">Автоматически покупать акции на дивы</div>
            </div>
            <button
              onClick={() => setReinvestDividends(!reinvestDividends)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                reinvestDividends ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                reinvestDividends ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Projection Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {snowballProjections.map((p) => (
            <div
              key={p.years}
              className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl relative overflow-hidden"
            >
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Через {p.years} {p.years === 1 ? 'год' : p.years < 5 ? 'года' : 'лет'}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                  +{p.years * 12} мес
                </span>
              </div>
              <div className="mt-2">
                <div className="text-[10px] text-slate-500">Капитал портфеля</div>
                <div className="text-sm sm:text-base font-bold font-mono text-white tabular-nums">
                  {formatCurrency(p.projectedCapital, currency, true)}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] text-emerald-400/80">Дивидендный доход</div>
                <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 tabular-nums">
                  {formatCurrency(p.projectedMonthlyDividends, currency)} / мес
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  ({formatCurrency(p.projectedAnnualDividends, currency, true)} / год)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
