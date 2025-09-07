

import React from 'react';
import { FinancialAnalysis } from '../types';
import BarChart from './BarChart';

interface FinancialAnalysisViewProps {
    stockCode: string;
    isLoading: boolean;
    error: string | null;
    analysis: FinancialAnalysis | null;
}

const ChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const LoadingSkeleton: React.FC = () => (
    <div className="p-6 space-y-6">
        <div className="space-y-2">
            <div className="h-5 w-1/3 bg-gray-700 rounded-md animate-pulse"></div>
            <div className="h-4 w-full bg-gray-800 rounded-md animate-pulse"></div>
            <div className="h-4 w-5/6 bg-gray-800 rounded-md animate-pulse"></div>
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
    <div className="bg-surface-dark-alt/60 p-3 rounded-xl">
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
                <p className="text-positive/90 text-sm">{error}</p>
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
    
    const { data, summary, sources } = analysis;
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
        <div className="p-6 space-y-6">
            <div className="relative p-4 rounded-xl border border-brand-orange/40 bg-gradient-to-br from-brand-orange/10 to-transparent">
               <div className="absolute -top-1 -right-1 text-brand-orange/20">
                    <SparklesIcon className="w-16 h-16 transform rotate-12" />
               </div>
               <div className="relative z-10">
                    <div className="flex items-center gap-2 text-brand-orange font-semibold mb-2">
                       <SparklesIcon className="w-5 h-5"/>
                       <h4>AI 財務總評</h4>
                    </div>
                     <p className="text-sm text-secondary-dark leading-relaxed whitespace-pre-wrap">{summary}</p>
                </div>
            </div>

            <div>
                 <div className="flex items-center gap-2 text-on-surface-dark font-semibold mb-3">
                   <ChartIcon className="w-5 h-5"/>
                   <h4>關鍵指標趨勢</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {metrics.map(metric => (
                        <MetricCard
                            key={metric.key}
                            title={metric.title}
                            unit={metric.unit}
                            data={reversedData.map(q => ({ label: q.quarter, value: q[metric.key] }))}
                        />
                    ))}
                </div>
            </div>
            
            {sources && sources.length > 0 && (
                 <div>
                     <div className="flex items-center gap-2 text-on-surface-dark font-semibold mb-3">
                       <LinkIcon className="w-5 h-5"/>
                       <h4>資料來源</h4>
                    </div>
                    <div className="bg-surface-dark-alt/60 p-4 rounded-xl space-y-2">
                        <ul className="list-disc list-inside space-y-2">
                             {sources.map((source, index) => (
                                <li key={index} className="text-sm text-secondary-dark truncate">
                                    <a
                                        href={source.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary hover:underline"
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

            <div className="text-center pt-2">
                 <a 
                    href={mopsUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-secondary-dark hover:text-primary underline transition-colors"
                >
                    前往公開資訊觀測站查看完整財報
                </a>
            </div>

        </div>
    );
};

export default FinancialAnalysisView;