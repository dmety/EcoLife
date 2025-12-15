import React from 'react';
import { AppView } from '../types';
import { LeafIcon, ChartIcon, ScanIcon, ChatIcon, UsersIcon, TrophyIcon, ProfileIcon } from './Icons';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: AppView.TRACKER, label: '碳追踪', icon: ChartIcon },
    { id: AppView.RECYCLE, label: '分类', icon: ScanIcon },
    { id: AppView.GROWTH, label: '成长', icon: TrophyIcon }, 
    { id: AppView.COMMUNITY, label: '社区', icon: UsersIcon }, 
    { id: AppView.ADVICE, label: '顾问', icon: ChatIcon }, 
    { id: AppView.PROFILE, label: '我的', icon: ProfileIcon }, // New
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe shadow-lg z-50 md:relative md:border-none md:bg-transparent md:shadow-none md:pb-0">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto md:h-full md:flex-col md:justify-start md:space-y-2 md:p-4">
        
        {/* Desktop Logo */}
        <div className="hidden md:flex items-center gap-2 mb-8 px-4">
          <div className="w-10 h-10 bg-leaf-600 rounded-xl flex items-center justify-center text-white shadow-lg">
             <LeafIcon />
          </div>
          <span className="text-xl font-bold text-leaf-900 tracking-tight">绿色生活</span>
        </div>

        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start md:px-6 md:py-3 md:w-full rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'text-leaf-600 md:bg-white md:shadow-md' 
                  : 'text-gray-400 hover:text-leaf-500 hover:bg-leaf-50'
                }`}
            >
              <item.icon className={`w-6 h-6 mb-1 md:mb-0 md:mr-3 transition-transform ${isActive ? 'scale-110 stroke-[2.5px]' : 'group-hover:scale-110'}`} />
              <span className={`text-[10px] md:text-sm font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;