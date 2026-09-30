import React, { useState } from 'react';
import { Currency, TransactionType, BrokerImportRow, Transaction } from '../types';
import { 
  parseBrokerReport, 
  SAMPLE_TINKOFF_REPORT, 
  SAMPLE_IBKR_REPORT, 
  SAMPLE_SBER_REPORT, 
  SAMPLE_UNIVERSAL_CSV 
} from '../utils/brokerParser';
import { formatCurrency } from '../utils/portfolioCalculations';
import { 
  FileUp, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Sparkles,
  Info
} from 'lucide-react';

interface BrokerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBatch: (txList: Omit<Transaction, 'id' | 'totalAmount'>[]) => void;
  portfolioId: string;
  portfolioName: string;
  currency: Currency;
}

export const BrokerImportModal: React.FC<BrokerImportModalProps> = ({
  isOpen,
  onClose,
  onImportBatch,
  portfolioId,
  portfolioName,
  currency
}) => {
  const [reportText, setReportText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<BrokerImportRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  if (!isOpen) return null;

  const handleParse = (textToParse: string = reportText) => {
    const rows = parseBrokerReport(textToParse, currency);
    setParsedRows(rows);
    setHasParsed(true);
  };

  const handleLoadSample = (sample: string) => {
    setReportText(sample);
    handleParse(sample);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setReportText(text);
        handleParse(text);
      }
    };
    reader.readAsText(file);
  };

  const validRows = parsedRows.filter(r => r.valid);

  const totalBuyVolume = validRows
    .filter(r => r.type === 'BUY')
    .reduce((sum, r) => sum + r.shares * r.price, 0);

  const totalSellVolume = validRows
    .filter(r => r.type === 'SELL')
    .reduce((sum, r) => sum + r.shares * r.price, 0);

  const handleConfirmImport = () => {
    if (validRows.length === 0) return;

    const batch: Omit<Transaction, 'id' | 'totalAmount'>[] = validRows.map(r => ({
      portfolioId,
      ticker: r.ticker,
      type: r.type,
      date: r.date,
      shares: r.shares,
      price: r.price,
      fee: r.fee,
      notes: r.notes || 'Импорт из брокерского отчета'
    }));

    onImportBatch(batch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Импорт брокерского отчета
              </h3>
              <p className="text-xs text-slate-400">
                Загрузка сделок в портфель: <span className="text-emerald-400 font-medium">{portfolioName}</span>
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

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Preset Buttons for Quick Testing */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-300 font-medium">
                Быстрые шаблоны популярных брокеров:
              </span>
              <span className="text-[10px] text-slate-500">
                нажмите для моментального теста
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample(SAMPLE_TINKOFF_REPORT)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-white">Т-Банк (Тинькофф)</div>
                <div className="text-[10px] text-slate-500">CSV отчет</div>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(SAMPLE_IBKR_REPORT)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-white">Interactive Brokers</div>
                <div className="text-[10px] text-slate-500">Trades CSV</div>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(SAMPLE_SBER_REPORT)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-white">Сбер / ВТБ</div>
                <div className="text-[10px] text-slate-500">Отчет биржи</div>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(SAMPLE_UNIVERSAL_CSV)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-white">Универсальный CSV</div>
                <div className="text-[10px] text-slate-500">Колонки сделок</div>
              </button>
            </div>
          </div>

          {/* File Upload & Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">
                Вставьте текст отчета или выберите файл:
              </label>
              <label className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Выбрать файл .CSV / .TXT</span>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={4}
              value={reportText}
              onChange={(e) => {
                setReportText(e.target.value);
                setHasParsed(false);
              }}
              placeholder="Вставьте сюда CSV строки из брокерского отчета..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />

            <button
              type="button"
              onClick={() => handleParse()}
              disabled={!reportText.trim()}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Распознать сделки</span>
            </button>
          </div>

          {/* Parsed Preview Table */}
          {hasParsed && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300 font-medium">
                <div>
                  Распознано: <span className="text-white font-bold">{parsedRows.length} строк</span> ({validRows.length} корректных)
                </div>
                {validRows.length > 0 && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Покупки: {formatCurrency(totalBuyVolume, currency)} · Продажи: {formatCurrency(totalSellVolume, currency)}
                  </div>
                )}
              </div>

              {parsedRows.length === 0 ? (
                <div className="p-4 bg-slate-950/60 rounded-xl text-center text-slate-500">
                  Не удалось распознать сделки. Проверьте формат данных или используйте один из шаблонов выше.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-950 sticky top-0 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Дата</th>
                        <th className="py-2 px-2">Тикер</th>
                        <th className="py-2 px-2">Тип</th>
                        <th className="py-2 px-2 text-right">Кол-во</th>
                        <th className="py-2 px-2 text-right">Цена</th>
                        <th className="py-2 px-2 text-right">Сумма</th>
                        <th className="py-2 px-2 text-center">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                      {parsedRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 font-mono">
                          <td className="py-2 px-3 text-slate-400">{r.date}</td>
                          <td className="py-2 px-2 font-bold text-white">{r.ticker}</td>
                          <td className="py-2 px-2">
                            <span className={r.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                              {r.type === 'BUY' ? 'Покупка' : 'Продажа'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right text-slate-200">{r.shares}</td>
                          <td className="py-2 px-2 text-right text-slate-200">{r.price.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right font-bold text-white">
                            {(r.shares * r.price).toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {r.valid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block" />
                            ) : (
                              <span title={r.errorMessage} className="inline-flex items-center text-rose-400">
                                <AlertCircle className="w-4 h-4" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            После импорта все показатели доходности и дивидендов пересчитаются автоматически
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={validRows.length === 0}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Импортировать {validRows.length} сделок
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
