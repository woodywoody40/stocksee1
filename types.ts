

export interface Stock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  yesterdayPrice: number;
}

export interface AnalysisResult {
  summary: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  prediction: 'Up' | 'Down' | 'Unchanged';
}

export enum Tab {
    Market = 'Market',
    AI_Analysis = 'AI_Analysis'
}

export interface NewsSource {
  title: string;
  uri: string;
}

export interface NewsArticle {
  text: string;
  sources: NewsSource[];
}

export interface HistoricalDataPoint {
  date: string;
  close: number;
}

export interface StockListItem {
  code: string;
  name: string;
  alias?: string[];
}

// FIX: Export the `IndicatorPoint` interface for technical analysis data.
export interface IndicatorPoint {
  date: string;
  value: number;
}

export interface QuarterlyFinancials {
    quarter: string; // e.g., "2023Q4"
    revenue: number; // 營業收入 (億元)
    grossMargin: number; // 毛利率 (%)
    operatingMargin: number; // 營業利益率 (%)
    netMargin: number; // 稅後淨利率 (%)
    eps: number; // 每股盈餘 (元)
}

export interface FinancialAnalysis {
    data: QuarterlyFinancials[];
    summary: string;
    sources?: NewsSource[];
}