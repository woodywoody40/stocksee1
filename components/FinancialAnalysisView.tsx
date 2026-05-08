

import React from 'react';
import { FinancialAnalysis } from '../types';
import BarChart from './BarChart';
import { BarChart2, Sparkles, Link as LinkIcon, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface FinancialAnalysisViewProps {
    stockCode: string;
    isLoading: boolean;
    error: string | null;
    analysis: FinancialAnalysis | null;
}

const LoadingSkeleton: React.FC = () => (
    <div className="p-6 space-y-6">
        <div className="space-y-4">
            <div className="h-5 w-1/3 bg-gray-700 rounded-md animate-pulse"></div>
            <div className="h-20 w-full bg-gray-800 rounded-2xl animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
               <div className="h-16 bg-gray-800 rounded-xl animate-pulse"></div>
               <div className="h-16 bg-gray-800 rounded-xl animate-pulse"></div>
            </div>
        </div>
        <div className="space-y-2">
            <div className="h-5 w-1/4 bg-gray-700 rounded-md animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="h-24 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="h-24 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="h-24 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="h-24 bg-gray-800 rounded-lg animate-pulse"></div>
            </div>
        </div>
    </div>
);

const MetricCard: React.FC<{ title: string; unit: string; data: { label: string; value: number }[] }> = ({ title, unit, data }) => (
    <div className="bg-surface-dark-alt/60 p-3 rounded-xl border border-outline-dark hover:border-brand-orange/50 transition-colors">
        <div className="flex justify-between items-baseline">
            <h4 className="text-sm font-semibold text-on-surface-dark">{title}</h4>
            <p className="text-xs text-secondary-dark">{unit}</p>
        </div>
        <div className="h-20 mt-2">
            <BarChart data={data} color="#f97316" />
        </div>
    </div>
);

const FinancialAnalysisView: React.FC<FinancialAnalysisViewProps> = ({ stockCode, isLoading, error, analysis }) => {
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-negative/90 text-sm bg-negative/10 border border-negative/30 p-3 rounded-lg inline-block">{error}</p>
            </div>
        );
    }

    if (!analysis || analysis.data.length === 0) {
        return (
            <div className="p-6 text-center">
                <p className="text-secondary-dark text-sm">找不到此股票的財務資料。</p>
            </div>
        );
    }
    
    const { data, summary, strengths, weaknesses, sources } = analysis;
    const reversedData = [...data].reverse();

    const metrics = [
        { title: '營業收入', unit: '億元', key: 'revenue' as const },
        { title: '毛利率', unit: '%', key: 'grossMargin' as const },
        { title: '營業利益率', unit: '%', key: 'operatingMargin' as const },
        { title: '稅後淨利率', unit: '%', key: 'netMargin' as const },
        { title: '每股盈餘 (EPS)', unit: '元', key: 'eps' as const },
    ];
    
    const mopsUrl = `https://mopsov.twse.com.tw/mops/web/t146sb05?CO_ID=${stockCode}`;

    return (
        <div className="p-6 space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-5 rounded-2xl border border-brand-orange/40 bg-gradient-to-br from-brand-orange/10 to-transparent shadow-lg shadow-brand-orange/5"
            >
               <div className="absolute -top-3 -right-2 text-brand-orange/20">
                    <Sparkles className="w-20 h-20 transform rotate-12" />
               </div>
               <div className="relative z-10">
                    <div className="flex items-center gap-2 text-brand-orange font-bold mb-3">
                       <Sparkles className="w-5 h-5"/>
                       <h4 className="text-lg">AI 財務總評</h4>
                    </div>
                     <p className="text-sm text-on-surface-dark leading-relaxed whitespace-pre-wrap">{summary}</p>
                </div>
            </motion.div>

            {(strengths?.length > 0 || weaknesses?.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {strengths?.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-positive/5 border border-positive/20 p-4 rounded-xl"
                        >
                            <h5 className="flex items-center gap-2 text-positive font-bold mb-3 text-sm">
                                <TrendingUp className="w-4 h-4" /> 財報亮點
                            </h5>
                            <ul className="space-y-2">
                                {strengths.map((s, i) => (
                                    <li key={i} className="text-sm text-on-surface-dark flex items-start gap-2">
                                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-positive mt-1.5"></span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                    {weaknesses?.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-negative/5 border border-negative/20 p-4 rounded-xl"
                        >
                            <h5 className="flex items-center gap-2 text-negative font-bold mb-3 text-sm">
                                <AlertTriangle className="w-4 h-4" /> 隱患與劣勢
                            </h5>
                            <ul className="space-y-2">
                                {weaknesses.map((w, i) => (
                                    <li key={i} className="text-sm text-on-surface-dark flex items-start gap-2">
                                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-negative mt-1.5"></span>
                                        <span>{w}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>
            )}

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                 <div className="flex items-center gap-2 text-on-surface-dark font-semibold mb-4">
                   <BarChart2 className="w-5 h-5 text-brand-orange"/>
                   <h4>關鍵指標趨勢（近四季）</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {metrics.map((metric, idx) => (
                        <motion.div
                            key={metric.key}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + idx * 0.05 }}
                        >
                            <MetricCard
                                title={metric.title}
                                unit={metric.unit}
                                data={reversedData.map(q => ({ label: q.quarter, value: q[metric.key] }))}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
            
            {sources && sources.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                     <div className="flex items-center gap-2 text-on-surface-dark font-semibold mb-3">
                       <LinkIcon className="w-5 h-5 text-secondary-dark"/>
                       <h4>分析資料來源</h4>
                    </div>
                    <div className="bg-surface-dark-alt/60 p-4 rounded-xl border border-outline-dark">
                        <ul className="space-y-2">
                             {sources.map((source, index) => (
                                <li key={index} className="text-sm text-secondary-dark truncate flex items-center gap-2 relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-brand-orange before:rounded-full">
                                    <a
                                        href={source.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary hover:underline transition-colors block truncate"
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

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center pt-4"
            >
                 <a 
                    href={mopsUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-secondary-dark hover:text-brand-orange font-medium transition-colors bg-white/5 py-1.5 px-3 rounded-full"
                >
                    前往公開資訊觀測站查看完整財報
                </a>
            </motion.div>

        </div>
    );
};

export default FinancialAnalysisView;