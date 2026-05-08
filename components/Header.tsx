
import React from 'react';
import { Tab } from '../types';
import ThemeToggle from './ThemeToggle';
import { LOGO_DATA_URL } from '../constants';
import { motion } from 'motion/react';
import { BarChart2, Lightbulb } from 'lucide-react';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-outline-light dark:border-outline-dark transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <img src={LOGO_DATA_URL} alt="股見 Logo" className="w-8 h-8" />
            <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-bold font-sans tracking-tight text-on-surface-light dark:text-on-surface-dark">股見</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-black/20 rounded-xl overflow-x-auto no-scrollbar">
              {[
                { id: Tab.Market, label: '市場動態', icon: BarChart2 },
                { id: Tab.AI_Analysis, label: 'AI 分析', icon: Lightbulb },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center justify-center flex-shrink-0 whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-sm font-medium outline-none transition-colors duration-200 ${
                      isActive
                        ? 'text-on-surface-light dark:text-on-surface-dark'
                        : 'text-secondary-light dark:text-secondary-dark hover:text-on-surface-light dark:hover:text-on-surface-dark hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-tab"
                        className="absolute inset-0 bg-white dark:bg-[#27272a] rounded-lg shadow-sm"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="pl-2 border-l border-outline-light dark:border-outline-dark">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
