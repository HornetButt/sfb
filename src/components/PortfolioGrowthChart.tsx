import React, { useState, useMemo } from 'react';
import { Currency } from '../types';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';

interface PortfolioGrowthChartProps {
  currentValue: number;
  totalInvested: number;
  currency: Currency;
  annualDividend: number;
}

type Timeframe = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const PortfolioGrowthChart: React.FC<PortfolioGrowthChartProps> = ({
  currentValue,
  totalInvested,
  currency,
  annualDividend
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('6M');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Generate realistic data points based on timeframe, totalInvested, and currentValue
  const points = useMemo(() => {
    let count = 24;
    let daysStep = 7;
    if (timeframe === '1M') {
      count = 20;
      daysStep = 1.5;
    } else if (timeframe === '3M') {
      count = 24;
      daysStep = 3.5;
    } else if (timeframe === '6M') {
      count = 26;
      daysStep = 7;
    } else if (timeframe === '1Y') {
      count = 32;
      daysStep = 11;
    } else {
      count = 36;
      daysStep = 18;
    }

    const now = new Date();
    const result = [];
    const profitRatio = totalInvested > 0 ? (currentValue - totalInvested) / totalInvested : 0.15;
    const baseInvested = Math.max(100, totalInvested);

    for (let i = 0; i < count; i++) {
      const daysAgo = (count - 1 - i) * daysStep;
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const progress = i / (count - 1); // 0 to 1

      // Gradually ramping invested capital and market return
      const investedAtStep = baseInvested * (0.6 + 0.4 * Math.pow(progress, 0.8));
      // Organic fluctuation
      const noise = Math.sin(i * 1.3) * 0.03 + Math.cos(i * 0.7) * 0.02;
      const growthFactor = 1 + profitRatio * progress + (i === count - 1 ? profitRatio : noise);
      
      const val = i === count - 1 ? currentValue : Math.max(0, +(investedAtStep * growthFactor).toFixed(2));
      const inv = i === count - 1 ? totalInvested : +investedAtStep.toFixed(2);

      result.push({
        date: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        value: val,
        invested: inv,
        profit: +(val - inv).toFixed(2)
      });
    }

    return result;
  }, [timeframe, currentValue, totalInvested]);

  const minVal = useMemo(() => {
    return Math.min(...points.map(p => Math.min(p.value, p.invested))) * 0.95;
  }, [points]);

  const maxVal = useMemo(() => {
    return Math.max(...points.map(p => Math.max(p.value, p.invested))) * 1.05;
  }, [points]);

  const width = 800;
  const height = 240;
  const paddingX = 20;
  const paddingY = 24;

  const getX = (index: number) => {
    return paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    return height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
  };

  // Build SVG path
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${getX(0)} ${getY(points[0].value)}`;
    for (let i = 1; i < points.length; i++) {
      const prevX = getX(i - 1);
      const prevY = getY(points[i - 1].value);
      const currX = getX(i);
      const currY = getY(points[i].value);
      const midX = (prevX + currX) / 2;
      d += ` C ${midX} ${prevY}, ${midX} ${currY}, ${currX} ${currY}`;
    }
    const bottomY = height - paddingY;
    d += ` L ${getX(points.length - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`;
    return d;
  }, [points, minVal, maxVal]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${getX(0)} ${getY(points[0].value)}`;
    for (let i = 1; i < points.length; i++) {
      const prevX = getX(i - 1);
      const prevY = getY(points[i - 1].value);
      const currX = getX(i);
      const currY = getY(points[i].value);
      const midX = (prevX + currX) / 2;
      d += ` C ${midX} ${prevY}, ${midX} ${currY}, ${currX} ${currY}`;
    }
    return d;
  }, [points, minVal, maxVal]);

  const investedLinePath = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${getX(0)} ${getY(points[0].invested)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${getX(i)} ${getY(points[i].invested)}`;
    }
    return d;
  }, [points, minVal, maxVal]);

  const activePoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : points[points.length - 1];

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Стоимость портфеля</span>
            <span className="text-[11px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Динамика доходности
            </span>
          </div>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {formatCurrency(activePoint ? activePoint.value : currentValue, currency)}
            </span>
            {activePoint && (
              <span className={`text-xs sm:text-sm font-mono font-medium tabular-nums ${
                activePoint.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {activePoint.profit >= 0 ? '+' : ''}{formatCurrency(activePoint.profit, currency)} ({formatPercent((activePoint.profit / (activePoint.invested || 1)) * 100)})
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {activePoint ? `По состоянию на ${activePoint.date}` : 'Текущая оценка'} · Вложено {formatCurrency(activePoint?.invested || totalInvested, currency)}
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800/80 p-1 rounded-xl self-start sm:self-auto">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full h-44 sm:h-56">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          <defs>
            <linearGradient id="snowballGrowthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#065f46" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#1e293b" />

          {/* Invested capital baseline (dashed subtle line) */}
          <path
            d={investedLinePath}
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-70"
          />

          {/* Area Fill */}
          <path d={areaPath} fill="url(#snowballGrowthGrad)" />

          {/* Main Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover indicator */}
          {hoveredPointIndex !== null && (
            <>
              <line
                x1={getX(hoveredPointIndex)}
                y1={paddingY}
                x2={getX(hoveredPointIndex)}
                y2={height - paddingY}
                stroke="#34d399"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredPointIndex)}
                cy={getY(points[hoveredPointIndex].value)}
                r="5"
                fill="#10b981"
                stroke="#022c22"
                strokeWidth="2.5"
              />
            </>
          )}

          {/* Interactive touch/hover invisible rects */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const w = (width - paddingX * 2) / points.length;
            return (
              <rect
                key={idx}
                x={x - w / 2}
                y={0}
                width={w}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredPointIndex(idx)}
                onTouchStart={() => setHoveredPointIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Рыночная стоимость</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-slate-500 inline-block border-b border-dashed" />
              <span>Вложенный капитал</span>
            </span>
          </div>
          <span className="font-mono text-slate-400">
            Годовые дивы: ~{formatCurrency(annualDividend, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
