
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

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-12 space-x-2">
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-2xl font-bold mb-6 text-on-background-light dark:text-on-background-dark tracking-wide flex items-center gap-3">
        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
        {children}
    </h2>
);

interface MarketViewProps {
    apiKey: string;
    onStartAnalysis: (stockName: string, stockCode: string) => void;
}

const MarketView: React.FC<MarketViewProps> = ({ apiKey, onStartAnalysis }) => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [watchlist, setWatchlist] = useLocalStorage<string[]>('watchlist', []);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [searchCodes, setSearchCodes] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [fullStockList, setFullStockList] = useState<StockListItem[]>(TW_STOCKS);


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

    // Effect for user-driven data fetching (initial load, search, watchlist changes)
    useEffect(() => {
        const controller = new AbortController();
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            if (codesToFetch.length === 0) {
                setStocks([]);
                setIsLoading(false);
                return;
            }

            try {
                // The stock service is not yet adapted for AbortController, so we handle cancellation logic here.
                const data = await fetchStockData(codesToFetch);
                if (!controller.signal.aborted) {
                    const sortedData = data.sort((a, b) => codesToFetch.indexOf(a.code) - codesToFetch.indexOf(b.code));
                    setStocks(sortedData);
                }
            } catch (err) {
                 if (!controller.signal.aborted) {
                    setError('無法獲取股票資料，請稍後再試。');
                    console.error(err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        loadData();

        return () => {
            controller.abort();
        };
    }, [codesToFetch]);

    // Effect for background refresh interval
    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (codesToFetch.length === 0 || document.hidden) return;
            try {
                const data = await fetchStockData(codesToFetch);
                const sortedData = data.sort((a, b) => codesToFetch.indexOf(a.code) - codesToFetch.indexOf(b.code));
                setStocks(currentStocks => {
                    const newStocksMap = new Map(sortedData.map(s => [s.code, s]));
                    const currentCodes = currentStocks.map(s => s.code);
                    const newCodes = sortedData.map(s => s.code);
                    const allCodes = Array.from(new Set([...currentCodes, ...newCodes]));
                    
                    return allCodes.map(code => newStocksMap.get(code) || currentStocks.find(s => s.code === code)).filter(Boolean) as Stock[];
                });
            } catch (err) {
                console.error("Background refresh failed:", err);
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [codesToFetch]);


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
    
        // Find codes by matching name, code, or alias from the complete static list
        const codesFromNameSearch = fullStockList
            .filter(stock =>
                // Use case-insensitive includes for all fields for better searchability.
                stock.name.toLowerCase().includes(lowerCaseTerm) ||
                stock.code.toLowerCase().includes(lowerCaseTerm) ||
                (stock.alias && stock.alias.some(a => a.toLowerCase().includes(lowerCaseTerm)))
            )
            .map(stock => stock.code);
    
        const potentialCodes = new Set<string>(codesFromNameSearch);
    
        // Also treat the input itself as a potential code to allow "searching via API" for real-time data
        if (/^\d{3,6}$/.test(trimmedTerm)) {
            potentialCodes.add(trimmedTerm);
        }
        
        setSearchCodes(Array.from(potentialCodes));
    }, [fullStockList]);

    const watchlistStocks = stocks.filter(stock => watchlist.includes(stock.code));
    const marketStocks = stocks.filter(stock => DEFAULT_STOCKS.includes(stock.code) && !watchlist.includes(stock.code));
    const searchResultStocks = searchTerm ? stocks.filter(stock => searchCodes.includes(stock.code)) : [];

    const renderStockGrid = (stockList: Stock[]) => (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {stockList.map((stock, index) => (
                <div key={stock.code} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                    <StockCard
                        stock={stock}
                        isWatched={watchlist.includes(stock.code)}
                        onToggleWatchlist={toggleWatchlist}
                        onCardClick={setSelectedStock}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-12">
            <SearchBar stockList={fullStockList} onSearch={handleSearch} />
            {error && <p className="text-center text-positive bg-positive/20 p-3 rounded-lg">{error}</p>}
            
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {searchTerm ? (
                        <section>
                            <SectionHeader>搜尋結果</SectionHeader>
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
                                    <SectionHeader>我的關注列表</SectionHeader>
                                    {renderStockGrid(watchlistStocks)}
                                </section>
                            )}

                            <section>
                                <SectionHeader>市場焦點</SectionHeader>
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
                </>
            )}

            {selectedStock && (
                <StockModal 
                  stock={selectedStock}
                  apiKey={apiKey}
                  onClose={() => setSelectedStock(null)}
                  onStartAnalysis={onStartAnalysis}
                />
            )}
        </div>
    );
};

export default React.memo(MarketView);