import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeNews } from '../services/geminiService';
import { AnalysisResult, NewsArticle, NewsSource } from '../types';

const LoadingIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


const icons = {
  Positive: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Negative: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Neutral: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10H10M14 14H10M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Up: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
  Down: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-negative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>,
  Unchanged: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" /></svg>,
};

interface AiAnalysisViewProps {
    analysisTarget: string | null;
    isFetchingNews: boolean;
    initialArticle: NewsArticle | null;
    apiKey: string;
    setApiKey: (key: string) => void;
}

const AnalysisSkeleton: React.FC = () => (
    <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-primary pl-3 border-l-4 border-primary">AI 分析中...</h3>
        <div className="space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-outline-light dark:border-outline-dark shadow-lg">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-outline-light dark:border-outline-dark shadow-lg">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-outline-light dark:border-outline-dark shadow-lg">
                     <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({ analysisTarget, isFetchingNews, initialArticle, apiKey, setApiKey }) => {
    const [newsText, setNewsText] = useState('');
    const [sources, setSources] = useState<NewsSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inputApiKey, setInputApiKey] = useState(apiKey);
    const [isKeySaved, setIsKeySaved] = useState(false);
    
    const analysisTriggeredForContent = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSaveKey = useCallback(() => {
        setApiKey(inputApiKey);
        setIsKeySaved(true);
        setTimeout(() => setIsKeySaved(false), 2000);
    }, [inputApiKey, setApiKey]);

    const handleAnalyze = useCallback(async (contentToAnalyze?: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        if (!apiKey) {
            setError('請先設定您的 Google Gemini API 金鑰。');
            return;
        }

        const text = contentToAnalyze || newsText;
        if (!text.trim()) {
            setError('請先貼上或等待新聞內容載入。');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysisResult = await analyzeNews(apiKey, text);
            setResult(analysisResult);
        } catch (err) {
            if (err instanceof Error) {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                }
            } else {
                setError('發生未知錯誤。');
            }
        } finally {
            setIsLoading(false);
        }
    }, [newsText, apiKey]);

    useEffect(() => {
        setResult(null);
        setNewsText('');
        setSources([]);
        setError(null);
        analysisTriggeredForContent.current = null;
    }, [analysisTarget]);

    useEffect(() => {
        if (initialArticle && initialArticle.text !== analysisTriggeredForContent.current) {
            analysisTriggeredForContent.current = initialArticle.text;
            
            if (initialArticle.text.startsWith('//ERROR//')) {
                setError(`自動獲取新聞失敗: ${initialArticle.text.replace('//ERROR// ', '')}`);
                setNewsText('');
                setSources([]);
            } else {
                setNewsText(initialArticle.text);
                setSources(initialArticle.sources);
                handleAnalyze(initialArticle.text);
            }
        }
    }, [initialArticle, handleAnalyze]);

    if (isFetchingNews) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-surface-light dark:bg-surface-dark p-6 sm:p-8 rounded-2xl border border-outline-light dark:border-outline-dark shadow-xl flex flex-col items-center justify-center space-y-4 min-h-[400px]">
                     <LoadingIcon className="h-8 w-8 text-primary animate-spin"/>
                     <h3 className="text-lg font-semibold text-on-surface-light dark:text-on-surface-dark">AI 正在為您搜尋「{analysisTarget}」的最新新聞...</h3>
                     <p className="text-secondary-light dark:text-secondary-dark text-sm">請稍候，過程可能需要一點時間。</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
             <div className="bg-surface-light dark:bg-surface-dark p-4 sm:p-5 rounded-2xl border border-outline-light dark:border-outline-dark shadow-lg">
                <h3 className="text-base font-semibold text-on-surface-light dark:text-on-surface-dark">Gemini API 金鑰設定</h3>
                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                    金鑰將安全地儲存在您的瀏覽器中，不會上傳至任何伺服器。 
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary/90 hover:underline">
                        點此獲取金鑰
                    </a>
                </p>
                <div className="relative mt-3">
                    <input
                        type="password"
                        value={inputApiKey}
                        onChange={(e) => setInputApiKey(e.target.value)}
                        placeholder="在此貼上您的 API 金鑰"
                        className="w-full pl-3 pr-28 py-2.5 bg-background-light dark:bg-background-dark border border-outline-light dark:border-outline-dark rounded-lg focus:ring-2 focus:ring-primary/80 focus:outline-none transition text-on-background-light dark:text-on-background-dark placeholder-secondary-light dark:placeholder-secondary-dark"
                        aria-label="Gemini API Key Input"
                    />
                    <button
                        onClick={handleSaveKey}
                        disabled={isKeySaved}
                        className={`absolute inset-y-1.5 right-1.5 flex justify-center items-center w-24 rounded-md text-sm font-semibold transition-all duration-300 ${
                            isKeySaved 
                                ? 'bg-negative text-white' 
                                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                        }`}
                    >
                        {isKeySaved ? (
                            <div className="flex items-center gap-1.5">
                                <CheckIcon className="w-5 h-5" />
                                <span>已儲存</span>
                            </div>
                        ) : (
                           '儲存金鑰'
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark p-6 sm:p-8 rounded-2xl border border-outline-light dark:border-outline-dark shadow-xl">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">AI 新聞分析</h2>
                        <p className="text-secondary-light dark:text-secondary-dark mt-1">
                          {analysisTarget 
                            ? `已自動帶入關於「${analysisTarget}」的最新聞，您也可手動修改內容。`
                            : "從「市場動態」選擇股票，或在此貼上新聞，讓 AI 為您提煉重點。"
                          }
                        </p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <textarea
                        value={newsText}
                        onChange={(e) => setNewsText(e.target.value)}
                        placeholder={
                          analysisTarget
                            ? `在此貼上或編輯關於「${analysisTarget}」的新聞文章全文...`
                            : "在此貼上新聞文章全文..."
                        }
                        className="w-full h-48 p-4 bg-background-light dark:bg-background-dark border border-outline-light dark:border-outline-dark rounded-lg focus:ring-2 focus:ring-primary/80 focus:outline-none transition resize-y text-on-background-light dark:text-on-background-dark placeholder-secondary-light dark:placeholder-secondary-dark"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleAnalyze()}
                        disabled={isLoading || !newsText.trim() || !apiKey}
                        className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-tertiary-light dark:disabled:bg-tertiary-dark disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
                    >
                        {isLoading ? <><LoadingIcon className="h-5 w-5 text-white" /> 分析中...</> : '開始分析'}
                    </button>
                    {!apiKey && <p className="text-center text-sm text-positive/90">請先設定 API 金鑰以啟用分析功能。</p>}
                </div>
            </div>
            
            {isLoading && <AnalysisSkeleton />}

            {error && (
                <div className="mt-6 bg-positive/10 border border-positive/30 text-positive p-4 rounded-2xl animate-fade-in">
                    <h3 className="font-bold">分析失敗</h3>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="mt-8">
                     <h3 className="text-xl font-bold mb-4 text-primary pl-3 border-l-4 border-primary">分析結果</h3>
                    <div className="space-y-6">
                        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-outline-light dark:border-outline-dark shadow-lg animate-stagger-in" style={{animationDelay: '100ms'}}>
                            <h4 className="font-semibold text-secondary-light dark:text-secondary-dark mb-2">重點摘要</h4>
                            <p className="text-on-surface-light dark:text-on-surface-dark leading-relaxed">{result.summary}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-outline-light dark:border-outline-dark shadow-lg animate-stagger-in" style={{animationDelay: '200ms'}}>
                                <h4 className="font-semibold text-secondary-light dark:text-secondary-dark mb-4">情緒分析</h4>
                                <div className="flex items-center gap-4">
                                    {icons[result.sentiment]()}
                                    <span className="text-2xl font-bold text-on-surface-light dark:text-on-surface-dark">{ {Positive: '正面', Negative: '負面', Neutral: '中性'}[result.sentiment]}</span>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-outline-light dark:border-outline-dark shadow-lg animate-stagger-in" style={{animationDelay: '300ms'}}>
                                <h4 className="font-semibold text-secondary-light dark:text-secondary-dark mb-4">潛在波動預測</h4>
                                <div className="flex items-center gap-4">
                                    {icons[result.prediction]()}
                                    <span className="text-2xl font-bold text-on-surface-light dark:text-on-surface-dark">{ {Up: '上漲', Down: '下跌', Unchanged: '不變'}[result.prediction]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {sources.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4 text-primary pl-3 border-l-4 border-primary">新聞來源</h3>
                    <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-outline-light dark:border-outline-dark shadow-lg animate-stagger-in" style={{animationDelay: '400ms'}}>
                        <ul className="space-y-3 list-disc list-inside">
                            {sources.map((source, index) => (
                                <li key={index} className="text-sm text-secondary-light dark:text-secondary-dark truncate">
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                        title={source.title}
                                    >
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

        </div>
    );
};

export default React.memo(AiAnalysisView);