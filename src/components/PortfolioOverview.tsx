import React from 'react';
import { 
  Currency, 
  HoldingPosition, 
  Portfolio,
  TransactionType 
} from '../types';
import { formatCurrency, formatPercent } from '../utils/portfolioCalculations';
import { PortfolioGrowthChart } from './PortfolioGrowthChart';
import { HoldingsList } from './HoldingsList';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  Target, 
  Plus, 
  Minus,
  Sparkles,
  PieChart,
  Edit3,
  Database
} from 'lucide-react';

interface PortfolioOverviewProps {
  portfolio: Portfolio | null;
  summary: ReturnType<typeof import('../utils/portfolioCalculations').calculatePortfolioSummary>;
  holdings: HoldingPosition[];
  currency: Currency;
  onOpenNewTransaction: (type?: TransactionType, ticker?: string) => void;
  onOpenBrokerImport: () => void;
  onOpenNewAssetModal: () => void;
  onOpenPriceEditor: (ticker?: string) => void;
  onOpenTickerManager: () => void;
  onNavigateToDividends: () => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolio,
  summary,
  holdings,
  currency,
  onOpenNewTransaction,
  onOpenBrokerImport,
  onOpenNewAssetModal,
  onOpenPriceEditor,
  onOpenTickerManager,
  onNavigateToDividends
}) => {
  const isOverallProfit = summary.unrealizedPnL >= 0;
  const isDayProfit = summary.dayChangeValue >= 0;

  // Monthly target calculation
  const targetMonthly = portfolio?.targetMonthlyDividend || 0;
  const targetProgress = targetMonthly > 0 ? Math.min(100, (summary.monthlyAverageDividend / targetMonthly) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Portfolio Value */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Стоимость портфеля</span>
            <div className={`flex items-center gap-0.5 text-[11px] font-mono font-medium ${isDayProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isDayProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{formatPercent(summary.dayChangePercent)}</span>
            </div>
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {formatCurrency(summary.totalValue, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>День: {isDayProfit ? '+' : ''}{formatCurrency(summary.dayChangeValue, currency)}</span>
            <span className="font-mono text-slate-400">{summary.activePositionsCount} поз.</span>
          </div>
        </div>

        {/* Card 2: Total Return & Profit */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Прибыль / Убыток</span>
            <span className={`text-[11px] font-mono font-medium ${isOverallProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPercent(summary.unrealizedPnLPercent)}
            </span>
          </div>
          <div className={`mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums ${isOverallProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isOverallProfit ? '+' : ''}{formatCurrency(summary.unrealizedPnL, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            Вложено: {formatCurrency(summary.totalInvested, currency)}
          </div>
        </div>

        {/* Card 3: Annual Dividend Forecast */}
        <div 
          onClick={onNavigateToDividends}
          className="bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-3.5 sm:p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="group-hover:text-emerald-300 transition-colors">Дивидендный доход</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              В год
            </span>
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums group-hover:text-emerald-400 transition-colors">
            {formatCurrency(summary.annualDividendIncome, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>~{formatCurrency(summary.monthlyAverageDividend, currency)}/мес</span>
            <span className="text-emerald-400 font-mono text-[10px] underline">календарь →</span>
          </div>
        </div>

        {/* Card 4: Dividend Yield & YoC */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Доходность к цене (YoC)</span>
            <span className="text-[11px] font-mono text-emerald-400">
              {formatPercent(summary.averageYieldOnCost, false)}
            </span>
          </div>
          <div className="mt-1.5 text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
            {formatPercent(summary.averageYieldOnCost, false)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Тек. див. доходность:</span>
            <span className="font-mono text-slate-300">{formatPercent(summary.currentDividendYield, false)}</span>
          </div>
        </div>
      </div>

      {/* Target Monthly Goal Banner (Snowball effect progress) */}
      {targetMonthly > 0 && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-900/40 rounded-2xl p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Цель дивидендного дохода</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {targetProgress.toFixed(1)}% выполнено
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatCurrency(summary.monthlyAverageDividend, currency)} из {formatCurrency(targetMonthly, currency)} / месяц
                </div>
              </div>
            </div>

            <div className="text-right sm:max-w-xs w-full sm:w-auto">
              <div className="w-full sm:w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Осталось: {formatCurrency(Math.max(0, targetMonthly - summary.monthlyAverageDividend), currency)} / мес
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Growth Chart */}
      <PortfolioGrowthChart
        currentValue={summary.totalValue}
        totalInvested={summary.totalInvested}
        currency={currency}
        annualDividend={summary.annualDividendIncome}
      />

      {/* Quick Action Bar for Portfolio */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Активы портфеля</span>
            <span className="text-xs font-normal text-slate-400">
              ({holdings.length})
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTickerManager}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-teal-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Менеджер тикеров: размеры лотов, сплиты, база активов"
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>Тикеры & Лоты</span>
          </button>
          <button
            onClick={() => onOpenPriceEditor()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-teal-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Задать или изменить текущую цену актива (котировку)"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-400" />
            <span>Задать цену</span>
          </button>
          <button
            onClick={() => onOpenNewTransaction('BUY')}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Купить актив</span>
          </button>
          <button
            onClick={() => onOpenNewTransaction('SELL')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 text-slate-300 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Продать</span>
          </button>
        </div>
      </div>

      {/* Holdings List Component */}
      <HoldingsList
        holdings={holdings}
        currency={currency}
        onBuy={(ticker) => onOpenNewTransaction('BUY', ticker)}
        onSell={(ticker) => onOpenNewTransaction('SELL', ticker)}
        onDividend={(ticker) => onOpenNewTransaction('DIVIDEND', ticker)}
        onCoupon={(ticker) => onOpenNewTransaction('COUPON', ticker)}
        onEditPrice={(ticker) => onOpenPriceEditor(ticker)}
        onAddNewAsset={onOpenNewAssetModal}
      />
    </div>
  );
};
