import React, { useState } from 'react';
import { Portfolio, Currency } from '../types';
import { formatCurrency } from '../utils/portfolioCalculations';
import { FolderKanban, Plus, Trash2, Edit2, Check, Target } from 'lucide-react';

interface PortfolioManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onAddPortfolio: (newPort: Omit<Portfolio, 'id' | 'createdAt'>) => string;
  onUpdatePortfolio: (updated: Portfolio) => void;
  onDeletePortfolio: (id: string) => void;
}

export const PortfolioManageModal: React.FC<PortfolioManageModalProps> = ({
  isOpen,
  onClose,
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onAddPortfolio,
  onUpdatePortfolio,
  onDeletePortfolio
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New form state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [description, setDescription] = useState('');
  const [targetMonthly, setTargetMonthly] = useState<string>('300');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddPortfolio({
      name: name.trim(),
      currency,
      description: description.trim() || undefined,
      targetMonthlyDividend: parseFloat(targetMonthly) || 0
    });

    setName('');
    setDescription('');
    setTargetMonthly('300');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Управление портфелями
              </h3>
              <p className="text-xs text-slate-400">
                Создавайте раздельные портфели для разных стратегий и валют
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

        {/* Existing Portfolios List */}
        <div className="space-y-2 text-xs">
          {portfolios.map(p => {
            const isSelected = p.id === selectedPortfolioId;
            return (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div 
                  onClick={() => onSelectPortfolio(p.id)}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-semibold">
                      {p.currency}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        ✓ Активен
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <div className="text-[11px] text-slate-400 mt-0.5">{p.description}</div>
                  )}
                  {p.targetMonthlyDividend && p.targetMonthlyDividend > 0 && (
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Цель: {formatCurrency(p.targetMonthlyDividend, p.currency)} / мес
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {portfolios.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Удалить портфель "${p.name}" и все его сделки?`)) {
                          onDeletePortfolio(p.id);
                        }
                      }}
                      title="Удалить портфель"
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Portfolio CTA / Form */}
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Создать новый портфель</span>
          </button>
        ) : (
          <form onSubmit={handleCreate} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs animate-in fade-in duration-150">
            <div className="font-semibold text-white">Новый инвестиционный портфель</div>

            <div>
              <label className="text-slate-400 block mb-1">Название портфеля</label>
              <input
                type="text"
                required
                placeholder="Например: Рост IT или Облигации РФ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Базовая валюта</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="RUB">RUB (₽)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="CNY">CNY (¥)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Цель по дивам в месяц</label>
                <input
                  type="number"
                  placeholder="300"
                  value={targetMonthly}
                  onChange={(e) => setTargetMonthly(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Краткое описание (опционально)</label>
              <input
                type="text"
                placeholder="Дивидендные аристократы или технологические гиганты"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
              >
                Создать
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
