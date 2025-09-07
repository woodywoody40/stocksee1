import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import MarketView from './components/MarketView';
import AiAnalysisView from './components/AiAnalysisView';
import { Tab, NewsArticle } from './types';
import { fetchNewsWithGemini } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Market);
  const [analysisTarget, setAnalysisTarget] = useState<string | null>(null);
  const [analysisArticle, setAnalysisArticle] = useState<NewsArticle | null>(null);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [apiKey, setApiKey] = useLocalStorage<string>('gemini-api-key', '');
  
  const handleTabChange = useCallback((tab: Tab) => {
    if (tab !== Tab.AI_Analysis) {
      setAnalysisTarget(null);
      setAnalysisArticle(null);
    }
    setActiveTab(tab);
  }, []);

  const handleStartAnalysis = useCallback(async (stockName: string, stockCode: string) => {
    if (!apiKey) {
      alert("請先在「AI 新聞分析」頁面設定您的 Google Gemini API 金鑰。");
      setActiveTab(Tab.AI_Analysis); // Switch to AI tab to show settings
      return;
    }

    setAnalysisTarget(stockName);
    setActiveTab(Tab.AI_Analysis);
    setIsFetchingNews(true);
    setAnalysisArticle(null);

    try {
      const article = await fetchNewsWithGemini(apiKey, stockName, stockCode);
      setAnalysisArticle(article);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('News fetch aborted');
        return;
      }
      console.error("Failed to fetch news via Gemini:", error);
      const errorMessage = error instanceof Error ? error.message : '未知的錯誤';
      setAnalysisArticle({ text: `//ERROR// ${errorMessage}`, sources: [] });
    } finally {
      setIsFetchingNews(false);
    }
  }, [apiKey]);


  return (
    <div className="min-h-screen font-sans bg-background-light dark:bg-background-dark">
      <Header activeTab={activeTab} setActiveTab={handleTabChange} />
      <main className="p-4 sm:p-6 lg:p-8">
        {activeTab === Tab.Market && <MarketView apiKey={apiKey} onStartAnalysis={handleStartAnalysis} />}
        {activeTab === Tab.AI_Analysis && (
          <AiAnalysisView 
            apiKey={apiKey}
            setApiKey={setApiKey}
            analysisTarget={analysisTarget} 
            isFetchingNews={isFetchingNews}
            initialArticle={analysisArticle}
          />
        )}
      </main>
       <footer className="text-center p-6 text-xs text-secondary-light dark:text-secondary-dark mt-8">
        股見 - 台灣股市洞察 © 2025. 所有資料僅供參考。
      </footer>
    </div>
  );
};

export default React.memo(App);