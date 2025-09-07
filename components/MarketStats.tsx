import React from 'react';
import { Stock } from '../types';

const ArrowTrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.28m5.94 2.28L18.75 2.25" />
    </svg>
);

const ArrowTrendingDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0-3.182-1.591m3.182 1.591L18 18.75" />
    </svg>
);

const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
);


interface MarketStatsProps {
    topGainers: Stock[];
    topLosers: Stock[];
    mostActive: Stock[];
    onStockClick: (stock: Stock) => void;
}

const StatCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    stocks: Stock[];
    metric: 'changePercent' | 'volume';
    colorClass: string;
    onStockClick: (stock: Stock) => void;
}> = ({ title, icon, stocks, metric, colorClass, onStockClick }) => {
    
    const renderMetric = (stock: Stock) => {
        if (metric === 'changePercent') {
            const isPositive = stock.change >= 0;
            return (
                <span className={isPositive ? 'text-positive' : 'text-negative'}>
                    {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
            );
        }
        if (metric === 'volume') {
            return <span>{Math.floor(stock.volume / 1000).toLocaleString()} 張</span>;
        }
        return null;
    };

    return (
        <div className="bg-light-card dark:bg-dark-card backdrop-blur-md border border-light-border dark:border-dark-border rounded-xl p-4 flex-1 min-w-[280px] animate-staggered-fade-in shadow-md dark:shadow-none shadow-slate-200">
            <div className={`flex items-center gap-3 mb-4 text-lg font-bold ${colorClass}`}>
                {icon}
                <h3>{title}</h3>
            </div>
            <ul className="space-y-3">
                {stocks.length > 0 ? stocks.map(stock => (
                    <li 
                        key={stock.code} 
                        onClick={() => onStockClick(stock)}
                        className="flex justify-between items-center text-sm cursor-pointer group rounded-md p-1 -m-1 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className="transition-colors group-hover:text-brand-gold">
                            <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">{stock.name}</p>
                            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{stock.code}</p>
                        </div>
                        <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">{renderMetric(stock)}</p>
                    </li>
                )) : (
                    <p className="text-text-light-tertiary dark:text-text-dark-tertiary text-sm text-center py-4">暫無資料</p>
                )}
            </ul>
        </div>
    );
};

const MarketStats: React.FC<MarketStatsProps> = ({ topGainers, topLosers, mostActive, onStockClick }) => {
    return (
        <div className="flex flex-col lg:flex-row flex-wrap gap-5">
            <StatCard 
                title="今日漲幅排行"
                icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
                stocks={topGainers}
                metric="changePercent"
                colorClass="text-positive"
                onStockClick={onStockClick}
            />
            <StatCard 
                title="今日跌幅排行"
                icon={<ArrowTrendingDownIcon className="w-6 h-6" />}
                stocks={topLosers}
                metric="changePercent"
                colorClass="text-negative"
                onStockClick={onStockClick}
            />
            <StatCard 
                title="今日熱門成交"
                icon={<BoltIcon className="w-6 h-6" />}
                stocks={mostActive}
                metric="volume"
                colorClass="text-brand-gold"
                onStockClick={onStockClick}
            />
        </div>
    );
};

export default MarketStats;