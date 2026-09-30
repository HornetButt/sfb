import React from 'react';
import { Briefcase, Calendar, Landmark, Wallet, PieChart, Clock } from 'lucide-react';
import { ActiveTab } from './BottomNav';

interface DesktopTabBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  positionsCount: number;
  depositsAndLoansCount: number;
}

export const DesktopTabBar: React.FC<DesktopTabBarProps> = ({
  activeTab,
  onChangeTab,
  positionsCount,
  depositsAndLoansCount
}) => {
  const tabs = [
    { id: 'overview' as ActiveTab, label: 'Портфель', icon: Briefcase, count: positionsCount },
    { id: 'dividends' as ActiveTab, label: 'Дивиденды', icon: Calendar },
    { id: 'wealth' as ActiveTab, label: 'Вклады & Кредиты', icon: Landmark, count: depositsAndLoansCount },
    { id: 'cashflow' as ActiveTab, label: 'Доходы & Расходы', icon: Wallet },
    { id: 'analytics' as ActiveTab, label: 'Аналитика', icon: PieChart },
    { id: 'history' as ActiveTab, label: 'Сделки', icon: Clock }
  ];


  return (
    <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800/80 rounded-2xl w-fit">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
