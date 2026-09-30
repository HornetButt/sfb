import React, { useState } from 'react';
import { 
  Portfolio, 
  Transaction, 
  HoldingPosition, 
  CashflowEntry, 
  AssetQuote, 
  Currency,
  BankDeposit,
  Loan
} from '../types';
import { 
  exportHoldingsToCSV, 
  exportTransactionsToCSV, 
  exportCashflowToCSV, 
  exportDepositsToCSV,
  exportLoansToCSV,
  exportFullBackupJSON, 
  parseBackupJSON, 
  BackupData 
} from '../utils/exportImport';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Database, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Landmark,
  CreditCard
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPortfolio: Portfolio | null;
  holdings: HoldingPosition[];
  transactions: Transaction[];
  allTransactions: Transaction[];
  portfolios: Portfolio[];
  quotes: Record<string, AssetQuote>;
  cashflow: CashflowEntry[];
  deposits: BankDeposit[];
  loans: Loan[];
  currency: Currency;
  onRestoreBackup: (data: BackupData) => void;
  onResetDemo: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentPortfolio,
  holdings,
  transactions,
  allTransactions,
  portfolios,
  quotes,
  cashflow,
  deposits,
  loans,
  currency,
  onRestoreBackup,
  onResetDemo
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportHoldings = () => {
    exportHoldingsToCSV(holdings, currentPortfolio?.name || 'portfolio', currency);
  };

  const handleExportTransactions = () => {
    exportTransactionsToCSV(transactions, currentPortfolio?.name || 'portfolio');
  };

  const handleExportCashflow = () => {
    exportCashflowToCSV(cashflow);
  };

  const handleExportDeposits = () => {
    exportDepositsToCSV(deposits);
  };

  const handleExportLoans = () => {
    exportLoansToCSV(loans);
  };

  const handleExportJSON = () => {
    exportFullBackupJSON(portfolios, allTransactions, quotes, cashflow, deposits, loans);
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const backup = parseBackupJSON(text);
        if (backup) {
          onRestoreBackup(backup);
          setImportStatus('Резервная копия успешно восстановлена!');
          setImportError(null);
        } else {
          setImportError('Некорректный формат файла бэкапа');
          setImportStatus(null);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Экспорт & Резервная копия
              </h3>
              <p className="text-xs text-slate-400">
                Выгрузка данных в CSV или сохранение полного архива
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Export Options Cards */}
        <div className="space-y-2 text-xs">
          <div className="text-slate-400 font-medium">Экспорт в Excel / Google Таблицы (CSV):</div>
          
          <button
            onClick={handleExportHoldings}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-emerald-300">
                  Позиции и дивиденды портфеля (.CSV)
                </div>
                <div className="text-[11px] text-slate-500">
                  Тикеры, цены покупки, доходность, годовой дивидендный доход
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            onClick={handleExportTransactions}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-teal-300">
                  История сделок портфеля (.CSV)
                </div>
                <div className="text-[11px] text-slate-500">
                  Все покупки, продажи и начисленные дивиденды
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            onClick={handleExportCashflow}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-cyan-300">
                  Учет доходов и расходов (.CSV)
                </div>
                <div className="text-[11px] text-slate-500">
                  Категории, суммы, даты трат и поступлений
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            onClick={handleExportDeposits}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Landmark className="w-4 h-4 text-teal-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-teal-300">
                  Банковские вклады & проценты (.CSV)
                </div>
                <div className="text-[11px] text-slate-500">
                  Балансы, ставки %, начисленные проценты
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            onClick={handleExportLoans}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-rose-400" />
              <div>
                <div className="font-semibold text-white group-hover:text-rose-300">
                  Кредиты & Обязательства (.CSV)
                </div>
                <div className="text-[11px] text-slate-500">
                  Остатки долга, ежемесячные платежи, ставки
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>
        </div>

        {/* Full JSON Backup & Restore */}
        <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
          <div className="text-slate-400 font-medium">Резервная копия всего приложения (JSON):</div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJSON}
              className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1 text-emerald-400">
                <Database className="w-4 h-4" />
                <span className="font-semibold text-white group-hover:text-emerald-300">Скачать бэкап</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Все портфели, сделки и финансы
              </div>
            </button>

            <label className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors cursor-pointer group block">
              <div className="flex items-center gap-2 mb-1 text-teal-400">
                <Upload className="w-4 h-4" />
                <span className="font-semibold text-white group-hover:text-teal-300">Восстановить</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Загрузить из .json файла
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        {/* Reset / Demo data */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              if (window.confirm('Сбросить все данные к исходным демонстрационным портфелям?')) {
                onResetDemo();
                onClose();
              }
            }}
            className="text-slate-500 hover:text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить к демо-данным</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
