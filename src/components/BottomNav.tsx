import React from 'react';
import { 
  Briefcase, 
  Calendar, 
  Landmark,
  Wallet, 
  PieChart, 
  Clock 
} from 'lucide-react';

export type ActiveTab = 'overview' | 'dividends' | 'wealth' | 'cashflow' | 'analytics' | 'history';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'overview' as ActiveTab, label: 'Портфель', icon: Briefcase },
    { id: 'dividends' as ActiveTab, label: 'Дивиденды', icon: Calendar },
    { id: 'wealth' as ActiveTab, label: 'Вклады', icon: Landmark },
    { id: 'cashflow' as ActiveTab, label: 'Бюджет', icon: Wallet },
    { id: 'analytics' as ActiveTab, label: 'Графики', icon: PieChart },
    { id: 'history' as ActiveTab, label: 'Сделки', icon: Clock }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1 md:hidden">
      <div className="grid grid-cols-6 h-14 max-w-lg mx-auto items-center">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`min-h-[44px] min-w-[40px] flex flex-col items-center justify-center transition-colors cursor-pointer select-none ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
                )}
              </div>
              <span className="text-[9px] tracking-tight mt-1 truncate max-w-[50px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

