import React, { useState, useEffect } from 'react';
import { Stock } from '../types';
import Sparkline from './Sparkline';
import { fetchHistoricalData } from '../services/stockService';

interface StockCardProps {
    stock: Stock;
    isWatched: boolean;
    onToggleWatchlist: (code: string) => void;
    onCardClick: (stock: Stock) => void;
}

const StarIcon: React.FC<React.SVGProps<SVGSVGElement> & { isFilled: boolean }> = ({ isFilled, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
);

const ChartLoadingSkeleton: React.FC = () => (
    <div className="flex items-center justify-center h-full w-full">
        <div className="w-1.5 h-1.5 bg-secondary-light dark:bg-secondary-dark rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-1.5 h-1.5 bg-secondary-light dark:bg-secondary-dark rounded-full animate-pulse ml-1" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1.5 h-1.5 bg-secondary-light dark:bg-secondary-dark rounded-full animate-pulse ml-1" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const StockCard: React.FC<StockCardProps> = ({ stock, isWatched, onToggleWatchlist, onCardClick }) => {
    const isPositive = stock.change >= 0;
    const priceColor = isPositive ? 'text-positive' : 'text-negative';
    
    const [chartData, setChartData] = useState<number[]>([]);
    const [isChartLoading, setIsChartLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadChartData = async () => {
            if (!stock.code) return;

            setIsChartLoading(true);
            try {
                // fetchHistoricalData returns data sorted from newest to oldest.
                const history = await fetchHistoricalData(stock.code);
                
                if (!isMounted) return;

                // We want a 7-day trend, so we take the last 6 closing prices plus today's price.
                const last6DaysData = history.slice(0, 6);
                
                // Reverse the array to plot from oldest to newest.
                last6DaysData.reverse();
                
                const historicalPrices = last6DaysData.map(d => d.close);
                
                // Combine historical prices with today's live price for an up-to-date chart.
                const finalChartData = [...historicalPrices, stock.price];

                setChartData(finalChartData);
            } catch (error) {
                console.error(`Failed to load chart data for ${stock.code}:`, error);
                if (isMounted) {
                    // Provide a simple fallback chart if the API fails.
                    setChartData([stock.yesterdayPrice, stock.price].filter(p => p > 0));
                }
            } finally {
                if (isMounted) {
                    setIsChartLoading(false);
                }
            }
        };

        loadChartData();

        return () => {
            isMounted = false;
        };
    }, [stock.code, stock.price, stock.yesterdayPrice]); // Re-render chart if stock or its price changes.

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleWatchlist(stock.code);
    };

    return (
        <div 
            className="relative bg-surface-light dark:bg-surface-dark border border-outline-light dark:border-outline-dark rounded-2xl p-4 cursor-pointer transition-all duration-300 ease-in-out group hover:-translate-y-1 hover:shadow-xl shadow-lg shadow-gray-100 dark:shadow-none"
            onClick={() => onCardClick(stock)}
            role="button"
            aria-label={`查看 ${stock.name} 詳細資訊`}
        >
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-on-surface-light dark:text-on-surface-dark truncate max-w-[120px]">{stock.name}</h3>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">{stock.code}</p>
                    </div>
                    <button 
                        onClick={handleStarClick}
                        className="text-secondary-light dark:text-secondary-dark hover:text-brand-gold transition-colors p-1 -mr-1 -mt-1 z-20"
                        aria-label={isWatched ? `從關注列表移除 ${stock.name}` : `將 ${stock.name} 加入關注列表`}
                    >
                        <StarIcon isFilled={isWatched} className={`w-6 h-6 ${isWatched ? 'text-brand-gold' : ''}`} />
                    </button>
                </div>
                <div className="mt-4 flex justify-between items-end gap-2">
                    <div className="text-left">
                        <p className={`text-3xl font-bold ${priceColor}`}>{stock.price.toFixed(2)}</p>
                        <div className={`text-sm font-semibold ${priceColor} flex items-center gap-1`}>
                            <span>{isPositive ? '▲' : '▼'}</span>
                            <span>{stock.change.toFixed(2)}</span>
                            <span>({stock.changePercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                    <div className="w-2/5 h-10">
                        {isChartLoading ? <ChartLoadingSkeleton /> : <Sparkline data={chartData} isPositive={isPositive} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(StockCard);