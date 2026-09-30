import React, { useState, useMemo } from 'react';
import { HoldingPosition, Currency } from '../types';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { PieChart, TrendingUp, BarChart2, Layers, Award, AlertCircle } from 'lucide-react';

interface AnalyticsViewProps {
  holdings: HoldingPosition[];
  currency: Currency;
  summary: ReturnType<typeof import('../utils/portfolioCalculations').calculatePortfolioSummary>;
}

const PALETTE = [
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', 
  '#f59e0b', '#14b8a6', '#6366f1', '#f43f5e', '#84cc16'
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  holdings,
  currency,
  summary
}) => {
  const [allocationMode, setAllocationMode] = useState<'asset' | 'sector'>('sector');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const activeHoldings = useMemo(() => {
    return holdings.filter(h => h.shares > 0);
  }, [holdings]);

  // Aggregate slices by asset or sector
  const slices = useMemo(() => {
    const totalVal = summary.totalValue || 1;

    if (allocationMode === 'asset') {
      return activeHoldings.map((h, idx) => ({
        id: h.ticker,
        label: `${h.ticker} (${h.asset.name})`,
        value: h.currentValue,
        percent: (h.currentValue / totalVal) * 100,
        color: h.asset.logoColor || PALETTE[idx % PALETTE.length]
      }));
    } else {
      const map: Record<string, number> = {};
      activeHoldings.forEach(h => {
        const sec = h.asset.sector || 'Другое';
        map[sec] = (map[sec] || 0) + h.currentValue;
      });

      return Object.entries(map)
        .map(([sec, val], idx) => ({
          id: sec,
          label: sec,
          value: val,
          percent: (val / totalVal) * 100,
          color: PALETTE[idx % PALETTE.length]
        }))
        .sort((a, b) => b.value - a.value);
    }
  }, [activeHoldings, allocationMode, summary.totalValue]);

  // Performance ranking
  const topGainers = useMemo(() => {
    return [...activeHoldings]
      .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
      .slice(0, 4);
  }, [activeHoldings]);

  const topYields = useMemo(() => {
    return [...activeHoldings]
      .sort((a, b) => b.yieldOnCost - a.yieldOnCost)
      .slice(0, 4);
  }, [activeHoldings]);

  // SVG Donut calculation
  const donutPaths = useMemo(() => {
    const radius = 70;
    const innerRadius = 45;
    const center = 100;
    let accumulatedAngle = 0;

    return slices.map(s => {
      const angle = (s.percent / 100) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle += angle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const x3 = center + innerRadius * Math.cos(endRad);
      const y3 = center + innerRadius * Math.sin(endRad);
      const x4 = center + innerRadius * Math.cos(startRad);
      const y4 = center + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      const d = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;

      return {
        ...s,
        path: d
      };
    });
  }, [slices]);

  return (
    <div className="space-y-6">
      {/* Return Decomposition Banner */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          <span>Структура совокупной доходности (Total Return)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400">Нереализованная прибыль</div>
            <div className={`text-base font-bold font-mono mt-1 ${summary.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.unrealizedPnL, currency)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Текущий рост позиций
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400">Зафиксированная прибыль</div>
            <div className={`text-base font-bold font-mono mt-1 ${summary.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.realizedPnL >= 0 ? '+' : ''}{formatCurrency(summary.realizedPnL, currency)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              От закрытых сделок продажи
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400">Получено дивидендов</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-1">
              +{formatCurrency(summary.totalDividendsReceived, currency)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Выплачено эмитентами
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Donut & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Donut Chart */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-white">Диверсификация</span>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setAllocationMode('sector')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                  allocationMode === 'sector'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                По секторам
              </button>
              <button
                onClick={() => setAllocationMode('asset')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                  allocationMode === 'asset'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                По активам
              </button>
            </div>
          </div>

          {/* SVG Donut */}
          <div className="relative w-48 h-48 my-2">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {donutPaths.map(s => (
                <path
                  key={s.id}
                  d={s.path}
                  fill={s.color}
                  className={`transition-all duration-200 cursor-pointer ${
                    hoveredSlice === s.id ? 'opacity-100 filter brightness-125' : 'opacity-85 hover:opacity-100'
                  }`}
                  onMouseEnter={() => setHoveredSlice(s.id)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Всего</span>
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {formatCurrency(summary.totalValue, currency, true)}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-center mt-2">
            {hoveredSlice 
              ? slices.find(s => s.id === hoveredSlice)?.label 
              : `${slices.length} сегментов в распределении`}
          </div>
        </div>

        {/* Right: Slices Progress List */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <div className="text-xs font-semibold text-white mb-3">
            Доли и объемы капитала
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {slices.map(s => (
              <div
                key={s.id}
                onMouseEnter={() => setHoveredSlice(s.id)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`p-2.5 rounded-xl transition-colors ${
                  hoveredSlice === s.id ? 'bg-slate-800/80' : 'bg-slate-950/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="font-medium text-slate-200 truncate">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-slate-400">{formatCurrency(s.value, currency)}</span>
                    <span className="text-white font-semibold">{s.percent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${s.percent}%`,
                      backgroundColor: s.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Gainers & Top Yielders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performers */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Лидеры по доходности (Капитал)
            </h4>
          </div>
          <div className="space-y-2">
            {topGainers.map((h, i) => (
              <div key={h.ticker} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 w-4">{i + 1}.</span>
                  <span className="font-bold font-mono text-white">{h.ticker}</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{h.asset.name}</span>
                </div>
                <div className="text-right font-mono">
                  <div className={`font-semibold ${h.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(h.unrealizedPnLPercent)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {h.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(h.unrealizedPnL, currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Dividend Yield on Cost */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Топ по доходности к покупке (Yield on Cost)
            </h4>
          </div>
          <div className="space-y-2">
            {topYields.map((h, i) => (
              <div key={h.ticker} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 w-4">{i + 1}.</span>
                  <span className="font-bold font-mono text-white">{h.ticker}</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{h.asset.name}</span>
                </div>
                <div className="text-right font-mono">
                  <div className="font-semibold text-emerald-400">
                    {formatPercent(h.yieldOnCost, false)} YoC
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {formatCurrency(h.annualDividendIncome, currency)}/год
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
