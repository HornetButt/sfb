import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  FileUp, 
  Download, 
  RefreshCw, 
  FolderKanban, 
  ChevronDown,
  Layers,
  Sparkles,
  Edit3,
  Database
} from 'lucide-react';
import { Portfolio, Currency } from '../types';
import { formatCurrency } from '../utils/portfolioCalculations';

interface NavbarProps {
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onOpenNewTransaction: () => void;
  onOpenBrokerImport: () => void;
  onOpenExport: () => void;
  onOpenPortfolioManager: () => void;
  onOpenPriceEditor: () => void;
  onOpenTickerManager: () => void;
  onRefreshQuotes: () => void;
  totalPortfoliosValue: number;
  activeCurrency: Currency;
}

export const Navbar: React.FC<NavbarProps> = ({
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onOpenNewTransaction,
  onOpenBrokerImport,
  onOpenExport,
  onOpenPortfolioManager,
  onOpenPriceEditor,
  onOpenTickerManager,
  onRefreshQuotes,
  totalPortfoliosValue,
  activeCurrency
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshQuotes();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Wordmark & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Snowball <span className="text-emerald-400">Invest</span>
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400 -mt-0.5">
              Дивидендный трекер & капитал
            </span>
          </div>
        </div>

        {/* Zone 2: Portfolio Switcher Segment */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            aria-expanded={dropdownOpen}
          >
            <FolderKanban className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="max-w-[120px] sm:max-w-[180px] truncate text-left">
              {currentPortfolio ? currentPortfolio.name : 'Все портфели'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-800 shrink-0">
              {currentPortfolio?.currency || activeCurrency}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                  Мои портфели
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {portfolios.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPortfolio(p.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        p.id === selectedPortfolioId 
                          ? 'bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/20' 
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col text-left truncate">
                        <span className="truncate">{p.name}</span>
                        {p.description && (
                          <span className="text-[10px] text-slate-400 truncate">{p.description}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 shrink-0 ml-2">
                        {p.currency}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800/80 my-1 pt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenPortfolioManager();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Управление портфелями</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Ticker Manager */}
          <button
            onClick={onOpenTickerManager}
            title="Менеджер тикеров: лоты, сплиты, редактирование базы"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-teal-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline">База тикеров</span>
          </button>

          {/* Price Editor */}
          <button
            onClick={onOpenPriceEditor}
            title="Задать или скорректировать цену любого актива"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-teal-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline">Задать цену</span>
          </button>

          {/* Refresh quotes button */}
          <button
            onClick={handleRefresh}
            title="Обновить котировки"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-emerald-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden md:inline">Котировки</span>
          </button>

          {/* Broker Import */}
          <button
            onClick={onOpenBrokerImport}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Импорт брокерского отчета"
          >
            <FileUp className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Импорт</span>
          </button>

          {/* Export */}
          <button
            onClick={onOpenExport}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Экспорт данных"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Экспорт</span>
          </button>

          {/* Main CTA: Add Transaction */}
          <button
            onClick={onOpenNewTransaction}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Сделка</span>
          </button>
        </div>
      </div>
    </header>
  );
};
