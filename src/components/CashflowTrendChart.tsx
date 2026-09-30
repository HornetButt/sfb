import React, { useState, useMemo } from 'react';
import { CashflowEntry, Currency } from '../types';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  Eye, 
  EyeOff,
  Calendar,
  Sparkles,
  BarChart2
} from 'lucide-react';

interface CashflowTrendChartProps {
  cashflow: CashflowEntry[];
  currency: Currency;
  selectedMonth?: string;
}

type Timeframe = '3M' | '6M' | '1Y' | 'ALL';
type ChartMode = 'comparison' | 'net' | 'cumulative';

interface MonthDataPoint {
  key: string; // YYYY-MM
  label: string; // "Май 24"
  income: number;
  expense: number;
  net: number;
  cumulativeNet: number;
  savingsRate: number;
}

export const CashflowTrendChart: React.FC<CashflowTrendChartProps> = ({
  cashflow,
  currency,
  selectedMonth
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('6M');
  const [chartMode, setChartMode] = useState<ChartMode>('comparison');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Line toggles
  const [showIncomeLine, setShowIncomeLine] = useState(true);
  const [showExpenseLine, setShowExpenseLine] = useState(true);
  const [showNetLine, setShowNetLine] = useState(true);

  // Aggregate cashflow by month
  const monthlyData = useMemo(() => {
    if (cashflow.length === 0) return [];

    // Find date range
    const sorted = [...cashflow].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const now = new Date();

    // Use at least up to current month
    const endDate = lastDate > now ? lastDate : now;

    // Generate monthly sequence
    const monthKeys: string[] = [];
    const cur = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (cur <= end) {
      const ym = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(ym);
      cur.setMonth(cur.getMonth() + 1);
    }

    // Ensure we have at least 6 months for a nice graph
    while (monthKeys.length < 6) {
      const [year, month] = monthKeys[0].split('-').map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const ym = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.unshift(ym);
    }

    // Sum entries per month
    const incMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};

    cashflow.forEach(c => {
      const ym = c.date.slice(0, 7);
      if (c.type === 'INCOME') {
        incMap[ym] = (incMap[ym] || 0) + c.amount;
      } else {
        expMap[ym] = (expMap[ym] || 0) + c.amount;
      }
    });

    let runningCumulative = 0;
    const allPoints: MonthDataPoint[] = monthKeys.map(ym => {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      const label = d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
      const inc = incMap[ym] || 0;
      const exp = expMap[ym] || 0;
      const net = inc - exp;
      runningCumulative += net;
      const savingsRate = inc > 0 ? (net / inc) * 100 : 0;

      return {
        key: ym,
        label,
        income: inc,
        expense: exp,
        net,
        cumulativeNet: runningCumulative,
        savingsRate
      };
    });

    // Filter by timeframe
    let sliceCount = allPoints.length;
    if (timeframe === '3M') sliceCount = 3;
    else if (timeframe === '6M') sliceCount = 6;
    else if (timeframe === '1Y') sliceCount = 12;

    return allPoints.slice(-sliceCount);
  }, [cashflow, timeframe]);

  // Overall stats for the current timeframe window
  const stats = useMemo(() => {
    if (monthlyData.length === 0) {
      return { avgIncome: 0, avgExpense: 0, avgNet: 0, totalNet: 0 };
    }
    const totalInc = monthlyData.reduce((s, p) => s + p.income, 0);
    const totalExp = monthlyData.reduce((s, p) => s + p.expense, 0);
    const totalNet = totalInc - totalExp;
    const len = monthlyData.length;

    return {
      avgIncome: totalInc / len,
      avgExpense: totalExp / len,
      avgNet: totalNet / len,
      totalNet
    };
  }, [monthlyData]);

  // Chart coordinates calculation
  const width = 860;
  const height = 260;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartInnerWidth = width - paddingLeft - paddingRight;
  const chartInnerHeight = height - paddingTop - paddingBottom;

  const { minVal, maxVal } = useMemo(() => {
    if (monthlyData.length === 0) return { minVal: 0, maxVal: 100 };

    let values: number[] = [];
    if (chartMode === 'comparison') {
      monthlyData.forEach(p => {
        if (showIncomeLine) values.push(p.income);
        if (showExpenseLine) values.push(p.expense);
        if (showNetLine) values.push(p.net);
      });
    } else if (chartMode === 'net') {
      values = monthlyData.map(p => p.net);
    } else {
      values = monthlyData.map(p => p.cumulativeNet);
    }

    if (values.length === 0) {
      values = [0, 1000];
    }

    let min = Math.min(0, ...values);
    let max = Math.max(100, ...values);

    // Add 15% headroom
    const buffer = (max - min) * 0.15 || 500;
    max += buffer;
    if (min < 0) min -= buffer;

    return { minVal: min, maxVal: max };
  }, [monthlyData, chartMode, showIncomeLine, showExpenseLine, showNetLine]);

  const getX = (index: number) => {
    if (monthlyData.length <= 1) return paddingLeft + chartInnerWidth / 2;
    return paddingLeft + (index / (monthlyData.length - 1)) * chartInnerWidth;
  };

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    return height - paddingBottom - ((val - minVal) / range) * chartInnerHeight;
  };

  const zeroY = getY(0);

  // SVG Smooth Bezier Curve generator
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const incomePoints = useMemo(() => {
    return monthlyData.map((p, i) => ({ x: getX(i), y: getY(p.income) }));
  }, [monthlyData, minVal, maxVal]);

  const expensePoints = useMemo(() => {
    return monthlyData.map((p, i) => ({ x: getX(i), y: getY(p.expense) }));
  }, [monthlyData, minVal, maxVal]);

  const netPoints = useMemo(() => {
    return monthlyData.map((p, i) => ({ x: getX(i), y: getY(p.net) }));
  }, [monthlyData, minVal, maxVal]);

  const cumulativePoints = useMemo(() => {
    return monthlyData.map((p, i) => ({ x: getX(i), y: getY(p.cumulativeNet) }));
  }, [monthlyData, minVal, maxVal]);

  // Curves
  const incomePath = useMemo(() => createSmoothPath(incomePoints), [incomePoints]);
  const expensePath = useMemo(() => createSmoothPath(expensePoints), [expensePoints]);
  const netPath = useMemo(() => createSmoothPath(netPoints), [netPoints]);
  const cumulativePath = useMemo(() => createSmoothPath(cumulativePoints), [cumulativePoints]);

  // Area under Income
  const incomeArea = useMemo(() => {
    if (incomePoints.length === 0) return '';
    const lastX = incomePoints[incomePoints.length - 1].x;
    const firstX = incomePoints[0].x;
    return `${incomePath} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
  }, [incomePath, incomePoints, zeroY]);

  // Area under Expense
  const expenseArea = useMemo(() => {
    if (expensePoints.length === 0) return '';
    const lastX = expensePoints[expensePoints.length - 1].x;
    const firstX = expensePoints[0].x;
    return `${expensePath} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
  }, [expensePath, expensePoints, zeroY]);

  // Y-Axis Horizontal Gridlines
  const yTicks = useMemo(() => {
    const steps = 4;
    const ticks = [];
    const stepVal = (maxVal - minVal) / steps;
    for (let i = 0; i <= steps; i++) {
      const val = minVal + stepVal * i;
      ticks.push({
        val,
        y: getY(val)
      });
    }
    return ticks;
  }, [minVal, maxVal]);

  const activePoint = hoveredIdx !== null && monthlyData[hoveredIdx] ? monthlyData[hoveredIdx] : null;

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Динамика доходов и расходов</span>
                <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full">
                  Линейный график
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Наглядный тренд денежного потока, расходов и нормы сбережений
              </p>
            </div>
          </div>
        </div>

        {/* Filters: Mode & Timeframe */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartMode('comparison')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                chartMode === 'comparison'
                  ? 'bg-slate-800 text-teal-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Доходы vs Расходы
            </button>
            <button
              onClick={() => setChartMode('net')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                chartMode === 'net'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Чистое сальдо
            </button>
            <button
              onClick={() => setChartMode('cumulative')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                chartMode === 'cumulative'
                  ? 'bg-slate-800 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Накопительно
            </button>
          </div>

          {/* Timeframe */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['3M', '6M', '1Y', 'ALL'] as Timeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Run-Rate Summary Pill Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div className="text-[10px] text-slate-500">Средний доход / мес</div>
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
            +{formatCurrency(stats.avgIncome, currency)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div className="text-[10px] text-slate-500">Средний расход / мес</div>
          <div className="text-sm sm:text-base font-bold font-mono text-rose-400 mt-0.5 tabular-nums">
            -{formatCurrency(stats.avgExpense, currency)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div className="text-[10px] text-slate-500">Чистый поток в мес (Сальдо)</div>
          <div className={`text-sm sm:text-base font-bold font-mono mt-0.5 tabular-nums ${
            stats.avgNet >= 0 ? 'text-cyan-400' : 'text-rose-400'
          }`}>
            {stats.avgNet >= 0 ? '+' : ''}{formatCurrency(stats.avgNet, currency)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div className="text-[10px] text-slate-500">Накоплено за период ({timeframe})</div>
          <div className={`text-sm sm:text-base font-bold font-mono mt-0.5 tabular-nums ${
            stats.totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {stats.totalNet >= 0 ? '+' : ''}{formatCurrency(stats.totalNet, currency)}
          </div>
        </div>
      </div>

      {/* Legend & Line Toggles (When in comparison mode) */}
      {chartMode === 'comparison' && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowIncomeLine(!showIncomeLine)}
              className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${showIncomeLine ? 'opacity-100 font-semibold' : 'opacity-40'}`}
            >
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
              <span className="text-slate-200">Доходы</span>
            </button>

            <button
              onClick={() => setShowExpenseLine(!showExpenseLine)}
              className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${showExpenseLine ? 'opacity-100 font-semibold' : 'opacity-40'}`}
            >
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50" />
              <span className="text-slate-200">Расходы</span>
            </button>

            <button
              onClick={() => setShowNetLine(!showNetLine)}
              className={`flex items-center gap-1.5 transition-opacity cursor-pointer ${showNetLine ? 'opacity-100 font-semibold' : 'opacity-40'}`}
            >
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
              <span className="text-slate-200">Чистый остаток (Сальдо)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Наведите курсор на точку для точных сумм
          </div>
        </div>
      )}

      {/* The Interactive SVG Line Chart */}
      <div className="relative w-full overflow-hidden bg-slate-950/60 rounded-2xl border border-slate-800/80 p-1 sm:p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-72 overflow-visible select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Income Gradient */}
            <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Expense Gradient */}
            <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>

            {/* Net / Cumulative Gradient */}
            <linearGradient id="cyanAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={t.y}
                x2={width - paddingRight}
                y2={t.y}
                stroke="#1e293b"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={t.y + 3}
                fill="#64748b"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                {formatCurrency(t.val, currency, true)}
              </text>
            </g>
          ))}

          {/* Zero Baseline (if in range) */}
          {minVal < 0 && maxVal > 0 && (
            <line
              x1={paddingLeft}
              y1={zeroY}
              x2={width - paddingRight}
              y2={zeroY}
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}

          {/* CHART MODE: COMPARISON */}
          {chartMode === 'comparison' && (
            <>
              {/* Income Area & Line */}
              {showIncomeLine && (
                <>
                  <path d={incomeArea} fill="url(#incomeAreaGrad)" />
                  <path
                    d={incomePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Expense Area & Line */}
              {showExpenseLine && (
                <>
                  <path d={expenseArea} fill="url(#expenseAreaGrad)" />
                  <path
                    d={expensePath}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Net Balance Line */}
              {showNetLine && (
                <path
                  d={netPath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dots on points */}
              {monthlyData.map((p, i) => {
                const x = getX(i);
                return (
                  <g key={i}>
                    {showIncomeLine && (
                      <circle
                        cx={x}
                        cy={getY(p.income)}
                        r={hoveredIdx === i ? 5 : 3.5}
                        fill="#10b981"
                        stroke="#0f172a"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                    )}
                    {showExpenseLine && (
                      <circle
                        cx={x}
                        cy={getY(p.expense)}
                        r={hoveredIdx === i ? 5 : 3.5}
                        fill="#f43f5e"
                        stroke="#0f172a"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* CHART MODE: NET (ЧИСТОЕ САЛЬДО) */}
          {chartMode === 'net' && (
            <>
              <path
                d={`${netPath} L ${getX(monthlyData.length - 1)} ${zeroY} L ${getX(0)} ${zeroY} Z`}
                fill="url(#cyanAreaGrad)"
              />
              <path
                d={netPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {monthlyData.map((p, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(p.net)}
                  r={hoveredIdx === i ? 5.5 : 4}
                  fill={p.net >= 0 ? '#10b981' : '#f43f5e'}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              ))}
            </>
          )}

          {/* CHART MODE: CUMULATIVE (НАКОПИТЕЛЬНЫЙ ИТОГ) */}
          {chartMode === 'cumulative' && (
            <>
              <path
                d={`${cumulativePath} L ${getX(monthlyData.length - 1)} ${zeroY} L ${getX(0)} ${zeroY} Z`}
                fill="url(#incomeAreaGrad)"
              />
              <path
                d={cumulativePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {monthlyData.map((p, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(p.cumulativeNet)}
                  r={hoveredIdx === i ? 6 : 4}
                  fill="#10b981"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              ))}
            </>
          )}

          {/* Interactive Hover Guides & Capture Columns */}
          {monthlyData.map((p, i) => {
            const x = getX(i);
            const colWidth = chartInnerWidth / Math.max(1, monthlyData.length - 1);
            return (
              <g key={i}>
                {/* Invisible hover capture rect */}
                <rect
                  x={x - colWidth / 2}
                  y={paddingTop}
                  width={colWidth}
                  height={chartInnerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onTouchStart={() => setHoveredIdx(i)}
                />

                {/* X-Axis Month Label */}
                <text
                  x={x}
                  y={height - 12}
                  fill={hoveredIdx === i ? '#f8fafc' : '#64748b'}
                  fontSize="11"
                  fontWeight={hoveredIdx === i ? 'bold' : 'normal'}
                  textAnchor="middle"
                  className="font-mono transition-colors"
                >
                  {p.label}
                </text>

                {/* Vertical hover indicator */}
                {hoveredIdx === i && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={height - paddingBottom}
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip Card */}
        {activePoint && hoveredIdx !== null && (
          <div
            className="absolute top-3 pointer-events-none z-30 transition-all duration-150"
            style={{
              left: `${Math.min(
                Math.max(12, (getX(hoveredIdx) / width) * 100),
                74
              )}%`
            }}
          >
            <div className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-md rounded-2xl p-3 shadow-2xl space-y-1.5 text-xs min-w-[210px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-semibold text-white">
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>{activePoint.label}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {activePoint.key}
                </span>
              </div>

              <div className="space-y-1 pt-0.5 font-mono text-[11px]">
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Доходы:</span>
                  <span className="font-bold">+{formatCurrency(activePoint.income, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-rose-400">
                  <span>Расходы:</span>
                  <span className="font-bold">-{formatCurrency(activePoint.expense, currency)}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-bold">
                  <span className="text-slate-300">Сальдо (остаток):</span>
                  <span className={activePoint.net >= 0 ? 'text-cyan-400' : 'text-rose-400'}>
                    {activePoint.net >= 0 ? '+' : ''}{formatCurrency(activePoint.net, currency)}
                  </span>
                </div>

                {chartMode === 'cumulative' && (
                  <div className="flex items-center justify-between text-emerald-300 text-[10px] pt-0.5">
                    <span>Накоплено всего:</span>
                    <span>{formatCurrency(activePoint.cumulativeNet, currency)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>Норма сбережений:</span>
                  <span className="text-teal-300">{activePoint.savingsRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
