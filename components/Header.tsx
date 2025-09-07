import React from 'react';
import { Tab } from '../types';
import ThemeToggle from './ThemeToggle';
import { LOGO_DATA_URL } from '../constants';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tab: Tab) =>
    `flex items-center justify-center flex-shrink-0 whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-sm font-semibold outline-none transition-all duration-300 ease-in-out ${
      activeTab === tab
        ? 'bg-primary text-on-primary shadow-md'
        : 'text-secondary-light dark:text-secondary-dark hover:bg-primary/10'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-lg border-b border-outline-light dark:border-outline-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <img src={LOGO_DATA_URL} alt="股見 Logo" className="w-8 h-8" />
            <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-bold text-on-surface-light dark:text-on-surface-dark tracking-wider">股見</h1>
                <span className="text-xs text-secondary-light dark:text-secondary-dark">台灣股市洞察</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={() => setActiveTab(Tab.Market)} className={getTabClass(Tab.Market)}>
                  <ChartBarIcon className="w-5 h-5" />
                  市場動態
              </button>
              <button onClick={() => setActiveTab(Tab.AI_Analysis)} className={getTabClass(Tab.AI_Analysis)}>
                  <SparklesIcon className="w-5 h-5" />
                  AI 新聞分析
              </button>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;