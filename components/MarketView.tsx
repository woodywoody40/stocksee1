
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { fetchStockData } from '../services/stockService';
import { getFullStockList } from '../services/stockListService';
import { Stock, StockListItem } from '../types';
import { DEFAULT_STOCKS, REFRESH_INTERVAL } from '../constants';
import { TW_STOCKS } from '../data/tw_stocks';
import StockCard from './StockCard';
import StockModal from './StockModal';
import SearchBar from './SearchBar';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, RefreshCcw } from 'lucide-react';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-12 space-x-2">
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const SectionHeader: React.FC<{ children: React.ReactNode; onRefresh?: () => void; isRefreshing?: boolean }> = ({ children, onRefresh, isRefreshing }) => (
    <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-on-background-light dark:text-on-background-dark tracking-wide flex items-center gap-3">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            {children}
        </h2>
        {onRefresh && (
            <button 
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full bg-surface-light dark:bg-surface-dark border border-outline-light dark:border-outline-dark hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
                <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '更新中' : '手動更新'}
            </button>
        )}
    </div>
);

interface MarketViewProps {
    onStartAnalysis: (stockName: string, stockCode: string) => void;
}

const MarketView: React.FC<MarketViewProps> = ({ onStartAnalysis }) => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [watchlist, setWatchlist] = useLocalStorage<string[]>('watchlist', []);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [searchCodes, setSearchCodes] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [fullStockList, setFullStockList] = useState<StockListItem[]>(TW_STOCKS);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        const loadFullList = async () => {
            try {
                const list = await getFullStockList();
                setFullStockList(list);
            } catch (error) {
                console.warn("Could not load full stock list, search may be incomplete.", error);
            }
        };
        loadFullList();
    }, []);

    const codesToFetch = useMemo(() => {
        const combined = new Set([...DEFAULT_STOCKS, ...watchlist, ...searchCodes]);
        return Array.from(combined);
    }, [watchlist, searchCodes]);

    const performFetch = useCallback(async (showLoader = false) => {
        if (codesToFetch.length === 0) {
            setStocks([]);
            setIsLoading(false);
            return;
        }

        if (showLoader) setIsLoading(true);
        setIsRefreshing(true);
        setError(null);

        try {
            const data = await fetchStockData(codesToFetch);
            const sortedData = data.sort((a, b) => codesToFetch.indexOf(a.code) - codesToFetch.indexOf(b.code));
            setStocks(sortedData);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
            setError('資料獲取失敗，請確認網路連線或稍後再試。');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [codesToFetch]);

    useEffect(() => {
        performFetch(true);
    }, [codesToFetch]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (!document.hidden) {
                performFetch();
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [performFetch]);

    const toggleWatchlist = useCallback((code: string) => {
        setWatchlist(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    }, [setWatchlist]);

    const handleSearch = useCallback((term: string) => {
        const trimmedTerm = term.trim();
        setSearchTerm(trimmedTerm);
    
        if (!trimmedTerm) {
            setSearchCodes([]);
            return;
        }
    
        const lowerCaseTerm = trimmedTerm.toLowerCase();
        const codesFromNameSearch = fullStockList
            .filter(stock =>
                stock.name.toLowerCase().includes(lowerCaseTerm) ||
                stock.code.toLowerCase().includes(lowerCaseTerm) ||
                (stock.alias && stock.alias.some(a => a.toLowerCase().includes(lowerCaseTerm)))
            )
            .map(stock => stock.code);
    
        const potentialCodes = new Set<string>(codesFromNameSearch);
        if (/^\d{3,6}$/.test(trimmedTerm)) {
            potentialCodes.add(trimmedTerm);
        }
        setSearchCodes(Array.from(potentialCodes));
    }, [fullStockList]);

    const watchlistStocks = stocks.filter(stock => watchlist.includes(stock.code));
    const marketStocks = stocks.filter(stock => DEFAULT_STOCKS.includes(stock.code) && !watchlist.includes(stock.code));
    const searchResultStocks = searchTerm ? stocks.filter(stock => searchCodes.includes(stock.code)) : [];

    // Dashboard metrics
    const sortedByChange = useMemo(() => [...stocks].sort((a, b) => b.changePercent - a.changePercent), [stocks]);
    const topGainer = sortedByChange.length > 0 ? sortedByChange[0] : null;
    const topLoser = sortedByChange.length > 0 ? sortedByChange[sortedByChange.length - 1] : null;
    
    // Check if it's actually a gainer/loser
    const actualGainer = topGainer && topGainer.changePercent > 0 ? topGainer : null;
    const actualLoser = topLoser && topLoser.changePercent < 0 ? topLoser : null;

    const renderStockGrid = (stockList: Stock[]) => (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {stockList.map((stock, index) => (
                <motion.div 
                    key={stock.code} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                    <StockCard
                        stock={stock}
                        isWatched={watchlist.includes(stock.code)}
                        onToggleWatchlist={toggleWatchlist}
                        onCardClick={setSelectedStock}
                    />
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-4">
                <SearchBar stockList={fullStockList} onSearch={handleSearch} />
                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-secondary-light dark:text-secondary-dark font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-primary animate-ping' : 'bg-positive'}`}></span>
                    最後更新：{lastUpdated.toLocaleTimeString()} (每 {REFRESH_INTERVAL / 1000} 秒自動同步)
                </div>
            </div>

            {error && <p className="text-center text-positive bg-positive/20 p-3 rounded-lg animate-fade-in">{error}</p>}
            
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="space-y-12">
                     {!searchTerm && (actualGainer || actualLoser) && (
                        <section>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass">
                                    <div className="flex items-center gap-3 mb-4 text-positive">
                                        <div className="p-2 bg-positive/10 rounded-lg">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold">領漲指標</h3>
                                    </div>
                                    {actualGainer ? (
                                        <div className="cursor-pointer" onClick={() => setSelectedStock(actualGainer)}>
                                            <p className="text-2xl font-bold text-on-surface-light dark:text-on-surface-dark mb-1">{actualGainer.name}</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-medium text-positive">{actualGainer.price.toFixed(2)}</span>
                                                <span className="text-sm font-semibold text-positive">+{actualGainer.changePercent.toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    ) : <p className="text-secondary-light dark:text-secondary-dark">目前無上漲股票</p>}
                                </div>
                                <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass">
                                    <div className="flex items-center gap-3 mb-4 text-negative">
                                        <div className="p-2 bg-negative/10 rounded-lg">
                                            <TrendingDown className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold">領跌指標</h3>
                                    </div>
                                    {actualLoser ? (
                                        <div className="cursor-pointer" onClick={() => setSelectedStock(actualLoser)}>
                                            <p className="text-2xl font-bold text-on-surface-light dark:text-on-surface-dark mb-1">{actualLoser.name}</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-medium text-negative">{actualLoser.price.toFixed(2)}</span>
                                                <span className="text-sm font-semibold text-negative">{actualLoser.changePercent.toFixed(2)}%</span>
                                            </div>
                                        </div>
                                    ) : <p className="text-secondary-light dark:text-secondary-dark">目前無下跌股票</p>}
                                </div>
                                <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass">
                                    <div className="flex items-center gap-3 mb-4 text-brand-orange">
                                        <div className="p-2 bg-brand-orange/10 rounded-lg">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold">監控股數</h3>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold text-on-surface-light dark:text-on-surface-dark mb-1">{stocks.length}</p>
                                        <p className="text-sm text-secondary-light dark:text-secondary-dark">檔股票即時更新中</p>
                                    </div>
                                </div>
                             </div>
                        </section>
                     )}

                    {searchTerm ? (
                        <section>
                            <SectionHeader onRefresh={() => performFetch()} isRefreshing={isRefreshing}>搜尋結果</SectionHeader>
                            {searchResultStocks.length > 0 ? (
                                renderStockGrid(searchResultStocks)
                            ) : (
                                <p className="text-secondary-light dark:text-secondary-dark text-center py-8">找不到符合「{searchTerm}」的股票。</p>
                            )}
                        </section>
                    ) : (
                        <>
                            {watchlist.length > 0 && (
                                <section>
                                    <SectionHeader onRefresh={() => performFetch()} isRefreshing={isRefreshing}>我的關注列表</SectionHeader>
                                    {renderStockGrid(watchlistStocks)}
                                </section>
                            )}

                            <section>
                                <SectionHeader onRefresh={() => performFetch()} isRefreshing={isRefreshing}>市場焦點</SectionHeader>
                                {marketStocks.length > 0 ? (
                                   renderStockGrid(marketStocks)
                                ) : (
                                   <p className="text-secondary-light dark:text-secondary-dark text-center py-8">
                                       無法載入市場焦點。
                                   </p>
                                )}
                            </section>
                        </>
                    )}
                </div>
            )}

            {selectedStock && (
                <StockModal 
                  stock={selectedStock}
                  onClose={() => setSelectedStock(null)}
                  onStartAnalysis={onStartAnalysis}
                />
            )}
        </div>
    );
};

export default React.memo(MarketView);
