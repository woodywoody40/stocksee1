
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Stock, HistoricalDataPoint, FinancialAnalysis } from '../types';
import { getAIFinancialAnalysis } from '../services/geminiService';
import { fetchHistoricalData } from '../services/stockService';
import { aggregateToWeekly, aggregateToMonthly } from '../utils/technicalAnalysis';
import StockChart from './StockChart';
import FinancialAnalysisView from './FinancialAnalysisView';

interface StockModalProps {
    stock: Stock;
    onClose: () => void;
    onStartAnalysis: (stockName: string, stockCode: string) => void;
}

type ModalTab = 'info' | 'financials';
type ChartTab = '即時行情' | '日線' | '週線' | '月線';

const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
    </svg>
);

const ArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
    </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);


const LoadingSpinner: React.FC<{ small?: boolean }> = ({ small = false }) => (
    <div className={`flex justify-center items-center space-x-2 ${small ? '' : 'p-4'}`}>
        <div className={`bg-brand-orange rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0s' }}></div>
        <div className={`bg-brand-orange rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0.2s' }}></div>
        <div className={`bg-brand-orange rounded-full animate-pulse ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className = '' }) => (
    <div className="bg-surface-dark-alt/50 rounded-xl p-4 text-center">
        <p className="text-sm text-secondary-dark mb-1.5">{label}</p>
        <p className={`text-2xl font-semibold text-on-surface-dark ${className}`}>{value}</p>
    </div>
);


const StockModal: React.FC<StockModalProps> = ({ stock, onClose, onStartAnalysis }) => {
    // Daily change for header display
    const isPositive = stock.change >= 0;
    const priceColor = isPositive ? 'text-positive' : 'text-negative';
    
    const [isClosing, setIsClosing] = useState(false);
    
    const [fullHistoricalData, setFullHistoricalData] = useState<HistoricalDataPoint[] | null>(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const [activeChartTab, setActiveChartTab] = useState<ChartTab>('即時行情');

    const [activeTab, setActiveTab] = useState<ModalTab>('info');
    const [financialAnalysis, setFinancialAnalysis] = useState<FinancialAnalysis | null>(null);
    const [isFinancialsLoading, setIsFinancialsLoading] = useState(true);
    const [financialsError, setFinancialsError] = useState<string | null>(null);

    const handleClose = useCallback(() => {
        if (isClosing) return;
        setIsClosing(true);
    }, [isClosing]);

    const handleAnimationEnd = (e: React.AnimationEvent) => {
        if (e.target === e.currentTarget && isClosing) {
            onClose();
        }
    };
    
    const handleAnalysisClick = useCallback(() => {
        onStartAnalysis(stock.name, stock.code);
        handleClose();
    }, [stock, onStartAnalysis, handleClose]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);
    
    useEffect(() => {
        const loadHistoricalData = async () => {
            setIsHistoryLoading(true);
            setHistoryError(null);
            setFullHistoricalData(null);
            try {
                const data = await fetchHistoricalData(stock.code);
                 const todayPoint: HistoricalDataPoint = {
                    date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+)/, (_, y, m, d) => `${y-1911}/${m}/${d}`), // Format to ROC
                    close: stock.price,
                };
                
                const combinedData = data ? [todayPoint, ...data.filter(d => d.date !== todayPoint.date)] : [todayPoint];
                setFullHistoricalData(combinedData);

            } catch (err) {
                 if (err instanceof Error) {
                    setHistoryError(err.message);
                } else {
                    setHistoryError('獲取歷史資料時發生未知錯誤。');
                }
            } finally {
                setIsHistoryLoading(false);
            }
        };
        loadHistoricalData();
    }, [stock.code, stock.price]);

    const chartData = useMemo(() => {
        if (!fullHistoricalData) return null;

        switch (activeChartTab) {
            case '即時行情':
                return fullHistoricalData.slice(0, 30);
            case '日線':
                return fullHistoricalData.slice(0, 90);
            case '週線':
                return aggregateToWeekly(fullHistoricalData);
            case '月線':
                return aggregateToMonthly(fullHistoricalData);
            default:
                return fullHistoricalData.slice(0, 30);
        }
    }, [fullHistoricalData, activeChartTab]);

    // Determine chart color based on the selected time range's start and end points.
    const chartColor = useMemo(() => {
        if (!chartData || chartData.length < 2) {
            // Fallback to daily change if not enough data for the range
            return stock.change >= 0 ? '#ef4444' : '#22c55e';
        }
        // Data is sorted newest to oldest. Compare the newest (index 0) with the oldest (last index).
        const latestPrice = chartData[0].close;
        const earliestPrice = chartData[chartData.length - 1].close;
        return latestPrice >= earliestPrice ? '#ef4444' : '#22c55e';
    }, [chartData, stock.change]);


    useEffect(() => {
        const fetchFinancials = async () => {
            if (activeTab !== 'financials') return;
            
            setIsFinancialsLoading(true);
            setFinancialsError(null);
            try {
                // FIX: Financial analysis now uses internal API key handling.
                const analysis = await getAIFinancialAnalysis(stock.name, stock.code);
                setFinancialAnalysis(analysis);
            } catch (err) {
                if (err instanceof Error) {
                    setFinancialsError(err.message);
                } else {
                    setFinancialsError("無法獲取財務分析資料。");
                }
            } finally {
                setIsFinancialsLoading(false);
            }
        };

        // Only fetch when the tab is activated
        if(activeTab === 'financials' && !financialAnalysis) {
            fetchFinancials();
        }
    }, [activeTab, stock, financialAnalysis]);
    

    const MainTabButton: React.FC<{tab: ModalTab, label: string}> = ({tab, label}) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 focus:outline-none ${activeTab === tab ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-secondary-dark hover:bg-white/5'}`}
        >
            {label}
        </button>
    )

    const ChartTabButton: React.FC<{label: ChartTab}> = ({label}) => {
        const isActive = activeChartTab === label;
        return (
            <button 
                onClick={() => setActiveChartTab(label)}
                className={`relative px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none ${isActive ? 'text-on-surface-dark' : 'text-secondary-dark hover:text-on-surface-dark'}`}
            >
                {label}
                {isActive && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-orange rounded-full"></div>}
            </button>
        )
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-fade-in"
            style={{ perspective: '2000px' }}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
        >
            <div 
                className={`bg-background-dark rounded-3xl border border-outline-dark shadow-2xl w-full max-w-lg flex flex-col overflow-hidden backface-hidden dark max-h-[95vh] sm:max-h-[90vh] ${isClosing ? 'animate-flip-out' : 'animate-flip-in'}`}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={(e) => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                {/* Header */}
                 <div className="p-6">
                    <div className="relative flex items-start justify-between">
                         <div className="flex items-center gap-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-positive/20' : 'bg-negative/20'}`}>
                               {isPositive ? <ArrowUpIcon className="w-5 h-5 text-positive" /> : <ArrowDownIcon className="w-5 h-5 text-negative" /> }
                            </div>
                            <div>
                                <h2 id="stock-modal-title" className="text-xl font-bold text-on-surface-dark">{stock.name}</h2>
                                <p className="text-sm text-secondary-dark">{stock.code}</p>
                            </div>
                         </div>
                         <button 
                            onClick={handleClose} 
                            className="text-secondary-dark hover:text-on-surface-dark bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange z-20"
                            aria-label="關閉視窗"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                     <div className="text-left mt-4">
                        <p className={`text-5xl font-bold ${priceColor}`}>{stock.price.toFixed(2)}</p>
                        <div className={`text-base font-semibold ${priceColor} mt-1 flex items-center`}>
                            <span>{isPositive ? '▲' : '▼'}</span>
                            <span className="ml-1">{stock.change.toFixed(2)}</span>
                            <span className="ml-2">({stock.changePercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                 </div>
                
                 <div className="px-6 pb-4">
                    <div className="bg-surface-dark-alt/50 p-1 rounded-xl grid grid-cols-2 gap-1">
                        <MainTabButton tab="info" label="即時行情" />
                        <MainTabButton tab="financials" label="財務簡析" />
                    </div>
                 </div>


                <div className="flex-grow overflow-y-auto modal-scrollbar">
                    {activeTab === 'info' && (
                        <div className="px-6 pb-6 space-y-6">
                            <div className="flex items-center space-x-2 border-b border-outline-dark">
                                <ChartTabButton label="即時行情" />
                                <ChartTabButton label="日線" />
                                <ChartTabButton label="週線" />
                                <ChartTabButton label="月線" />
                            </div>
                            <div className="h-48 -mx-6">
                                {isHistoryLoading ? (
                                    <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>
                                ) : historyError ? (
                                    <div className="h-full flex items-center justify-center"><p className="text-sm text-center text-positive/90 p-2">{historyError}</p></div>
                                ) : (chartData && chartData.length > 1) ? (
                                    <StockChart 
                                        priceData={chartData} 
                                        color={chartColor}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center"><p className="text-sm text-center text-secondary-dark p-2">資料不足，無法繪製圖表</p></div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="開盤價" value={stock.open.toFixed(2)} />
                                <DetailItem label="最高價" value={stock.high.toFixed(2)} className="text-positive" />
                                <DetailItem label="最低價" value={stock.low.toFixed(2)} className="text-negative" />
                                <DetailItem label="昨收價" value={stock.yesterdayPrice.toFixed(2)} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'financials' && (
                        <FinancialAnalysisView 
                            stockCode={stock.code}
                            isLoading={isFinancialsLoading}
                            error={financialsError}
                            analysis={financialAnalysis}
                        />
                    )}
                </div>

                {/* AI Analysis Button Footer */}
                <div className="p-6 border-t border-outline-dark mt-auto shrink-0">
                    <button
                        onClick={handleAnalysisClick}
                        className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span>一鍵 AI 新聞分析</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockModal;
