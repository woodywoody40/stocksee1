
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeNews } from '../services/geminiService';
import { AnalysisResult, NewsArticle, NewsSource } from '../types';
import { Loader2, TrendingUp, TrendingDown, Minus, Smile, Frown, Meh, Percent, Link as LinkIcon, Zap, AlertTriangle, Blocks } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const icons = {
  Positive: () => <Smile className="w-8 h-8 text-positive" />,
  Negative: () => <Frown className="w-8 h-8 text-negative" />,
  Neutral: () => <Meh className="w-8 h-8 text-secondary-dark" />,
};

const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-positive';
    if (score <= 30) return 'text-negative';
    return 'text-brand-orange';
};

interface AiAnalysisViewProps {
    analysisTarget: string | null;
    isFetchingNews: boolean;
    initialArticle: NewsArticle | null;
}

const AnalysisSkeleton: React.FC = () => (
    <div className="mt-8 space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
             <Loader2 className="w-5 h-5 animate-spin" />
             AI 分析中...
        </h3>
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-outline-light dark:border-outline-dark shadow-sm">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-outline-light dark:border-outline-dark shadow-sm">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4 animate-pulse"></div>
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                </div>
             ))}
        </div>
    </div>
);


const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({ analysisTarget, isFetchingNews, initialArticle }) => {
    const [newsText, setNewsText] = useState('');
    const [sources, setSources] = useState<NewsSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const analysisTriggeredForContent = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleAnalyze = useCallback(async (contentToAnalyze?: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const text = contentToAnalyze || newsText;
        if (!text.trim()) {
            setError('請先貼上或等待新聞內容載入。');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysisResult = await analyzeNews(text);
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
    }, [newsText]);

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
                <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center space-y-6 min-h-[400px] border border-brand-orange/20">
                     <Loader2 className="h-12 w-12 text-brand-orange animate-spin"/>
                     <div className="text-center">
                         <h3 className="text-xl font-bold text-on-surface-light dark:text-on-surface-dark mb-2">AI 正在蒐集「{analysisTarget}」的最新情報...</h3>
                         <p className="text-secondary-light dark:text-secondary-dark text-sm">正在過濾市場雜訊，請稍候</p>
                     </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="bg-surface-light dark:bg-surface-dark p-6 sm:p-8 rounded-2xl shadow-sm border border-outline-light dark:border-outline-dark">
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold text-brand-orange flex items-center gap-2">
                        <Zap className="w-6 h-6" />
                        AI 深度新聞剖析
                    </h2>
                    <p className="text-secondary-light dark:text-secondary-dark mt-2 text-sm">
                      {analysisTarget 
                        ? `已自動帶入關於「${analysisTarget}」的最新聞，您也可手動修改內容或直接開始分析。`
                        : "從「市場動態」選擇股票，或在此貼上新聞，讓 AI 為您提煉投資重點。"
                      }
                    </p>
                </div>
                
                <div className="space-y-4">
                    <textarea
                        value={newsText}
                        onChange={(e) => setNewsText(e.target.value)}
                        placeholder={
                          analysisTarget
                            ? `在此貼上或編輯關於「${analysisTarget}」的新聞文章全文...`
                            : "在此貼上新聞文章全文..."
                        }
                        className="w-full h-40 p-4 bg-background-light dark:bg-background-dark border border-outline-light dark:border-outline-dark rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition resize-y text-on-background-light dark:text-on-background-dark placeholder-secondary-light dark:placeholder-secondary-dark text-sm leading-relaxed"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleAnalyze()}
                        disabled={isLoading || !newsText.trim()}
                        className="w-full flex justify-center items-center gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3 px-4 rounded-xl transition duration-300 disabled:bg-surface-dark-alt disabled:text-secondary-dark disabled:cursor-not-allowed shadow-md shadow-brand-orange/20"
                    >
                        {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> 分析中...</> : '開始 AI 分析'}
                    </button>
                </div>
            </div>
            
            <AnimatePresence mode="wait">
                {isLoading && (
                    <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <AnalysisSkeleton />
                    </motion.div>
                )}

                {error && !isLoading && (
                    <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-negative/10 border border-negative/30 text-negative p-4 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold">分析失敗</h3>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </motion.div>
                )}

                {result && !isLoading && (
                    <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Summary Card */}
                        <div className="bg-surface-light dark:bg-surface-dark p-6 sm:p-8 rounded-2xl shadow-lg border border-brand-orange/20 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-5">
                                 <Zap className="w-32 h-32 text-brand-orange" />
                             </div>
                             <div className="relative z-10">
                                <h4 className="font-bold text-lg text-brand-orange mb-3 flex items-center gap-2">
                                     <SparklesIcon className="w-5 h-5" />
                                     核心重點摘要
                                </h4>
                                <p className="text-on-surface-light dark:text-on-surface-dark leading-relaxed text-lg">
                                    {result.summary}
                                </p>
                             </div>
                        </div>

                        {/* Top Metrics Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-outline-light dark:border-outline-dark flex items-center gap-6">
                                <div className="p-4 bg-surface-dark-alt rounded-2xl">
                                    {icons[result.sentiment]()}
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-light dark:text-secondary-dark mb-1 font-medium">整體情緒傾向</p>
                                    <p className="text-2xl font-bold text-on-surface-light dark:text-on-surface-dark">
                                        {{Positive: '偏向樂觀', Negative: '偏向悲觀', Neutral: '持平中性'}[result.sentiment]}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-outline-light dark:border-outline-dark flex items-center gap-6">
                                <div className="p-4 bg-surface-dark-alt rounded-2xl">
                                    <Percent className={`w-8 h-8 ${getScoreColor(result.score)}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-light dark:text-secondary-dark mb-1 font-medium">AI 評級分數</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                                            {result.score}
                                        </p>
                                        <span className="text-sm text-secondary-dark">/ 100</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Impact and Risks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-outline-light dark:border-outline-dark">
                                <h4 className="font-bold text-on-surface-light dark:text-on-surface-dark mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-brand-gold" />
                                    具體影響分析
                                </h4>
                                <ul className="space-y-3">
                                    {result.impact_analysis.map((item, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-secondary-light dark:text-secondary-dark leading-relaxed">
                                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-brand-gold mt-2"></span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-outline-light dark:border-outline-dark">
                                    <h4 className="font-bold text-on-surface-light dark:text-on-surface-dark mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-brand-orange" />
                                        機會與風險
                                    </h4>
                                    <p className="text-sm text-secondary-light dark:text-secondary-dark leading-relaxed">
                                        {result.opportunities_risks}
                                    </p>
                                </div>
                                {result.related_sectors.length > 0 && (
                                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-outline-light dark:border-outline-dark">
                                        <h4 className="font-bold text-on-surface-light dark:text-on-surface-dark mb-3 flex items-center gap-2">
                                            <Blocks className="w-5 h-5 text-primary" />
                                            連動產業板塊
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {result.related_sectors.map((sector, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                                    {sector}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {sources.length > 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="pt-4">
                    <h3 className="text-sm font-bold text-secondary-light dark:text-secondary-dark mb-3 flex items-center gap-2 uppercase tracking-wider">
                        <LinkIcon className="w-4 h-4" />
                        相關新聞來源
                    </h3>
                    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-outline-light dark:border-outline-dark shadow-sm">
                        <ul className="space-y-2">
                            {sources.map((source, index) => (
                                <li key={index} className="text-sm text-secondary-light dark:text-secondary-dark truncate flex items-center gap-2 relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-brand-orange before:rounded-full">
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hover:text-brand-orange hover:underline transition-colors block truncate"
                                        title={source.title}
                                    >
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            )}

        </div>
    );
};

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

export default React.memo(AiAnalysisView);

