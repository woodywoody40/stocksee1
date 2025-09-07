

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, NewsArticle, NewsSource, QuarterlyFinancials, FinancialAnalysis } from '../types';

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "以繁體中文，對文章內容做出簡潔的重點摘要（2-3句話）。"
    },
    sentiment: {
      type: Type.STRING,
      description: "對股票的整體情緒，必須是 'Positive', 'Negative', 或 'Neutral' 其中之一。"
    },
    prediction: {
      type: Type.STRING,
      description: "根據新聞預測短期股價的潛在走勢，必須是 'Up', 'Down', 或 'Unchanged' 其中之一。"
    }
  },
  required: ["summary", "sentiment", "prediction"],
};


export const analyzeNews = async (apiKey: string, newsText: string): Promise<AnalysisResult> => {
    if (!apiKey) {
        throw new Error("請先在「AI 新聞分析」頁面設定您的 Google Gemini API 金鑰。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `你是一位專精於台灣股市的頂尖財經分析師。請僅根據以下提供的新聞文章，以繁體中文進行分析，並嚴格按照指定的 JSON 格式回傳結果。

分析要求：
1.  **summary**: 提煉文章的核心內容，寫成一段約 2-3 句話的重點摘要。
2.  **sentiment**: 判斷這篇新聞對該股票是「正面(Positive)」、「負面(Negative)」還是「中性(Neutral)」。
3.  **prediction**: 根據新聞內容，預測股價可能的短期走勢（上漲(Up)、下跌(Down)或不變(Unchanged)）。

新聞文章如下：
---
${newsText}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: ANALYSIS_SCHEMA,
                temperature: 0.2,
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as AnalysisResult;
        return result;

    } catch (error) {
        console.error("Error analyzing news with Gemini API:", error);
        if (error instanceof Error) {
           if (error.message.includes('API key not valid')) {
               throw new Error('您提供的 API 金鑰無效，請檢查後再試。');
           }
           throw new Error(`AI 分析失敗: ${error.message}`);
        }
        throw new Error("AI 分析時發生未知錯誤。");
    }
};

/**
 * Uses the Gemini API to find and return the text of a recent news article for a given stock.
 * @param apiKey The user's Google Gemini API key.
 * @param stockName The name of the stock.
 * @param stockCode The code of the stock.
 * @returns A promise that resolves to an object containing the news text and its sources.
 */
export const fetchNewsWithGemini = async (apiKey: string, stockName: string, stockCode: string): Promise<NewsArticle> => {
    if (!apiKey) {
        throw new Error("請先在「AI 新聞分析」頁面設定您的 Google Gemini API 金鑰。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `你是一位頂尖的財經新聞專家，專精於台灣股市的即時動態。你的任務是使用網路搜尋能力，為台灣股票「${stockName} (${stockCode})」找出**今天（過去 24 小時內）最重要的一篇**財經新聞。

你的回覆必須**只包含該新聞報導的「完整內文」或「詳盡摘要」**，必須客觀、中立，並且不包含任何前言、標題或個人評論。

**重要**: 一家活躍的上市公司必定會有近期的相關新聞。如果第一時間找不到，請擴大搜尋範圍至各大財經新聞網站（例如：鉅亨網、經濟日報、工商時報），務必回傳一篇最相關的新聞內容。絕不可回覆找不到新聞。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.1, // Factual but allows for good summarization
            },
        });
        
        const text = response.text.trim();
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: NewsSource[] = groundingChunks
            .map((chunk: any) => ({
                title: chunk.web?.title || '未知來源',
                uri: chunk.web?.uri || '#',
            }))
            .filter((source: NewsSource) => source.uri !== '#');

        const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

        return { text, sources: uniqueSources };

    } catch (error) {
         console.error("Error fetching news with Gemini API:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('您提供的 API 金鑰無效或已過期。');
        }
        throw new Error("AI 搜尋新聞時發生錯誤，請稍後再試。");
    }
};


const FINANCIAL_DATA_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      quarter: { type: Type.STRING, description: "季度，格式為 'YYYYQX'，例如 '2023Q4'" },
      revenue: { type: Type.NUMBER, description: "單季營業收入（單位：億元台幣）" },
      grossMargin: { type: Type.NUMBER, description: "單季毛利率（單位：%）" },
      operatingMargin: { type: Type.NUMBER, description: "單季營業利益率（單位：%）" },
      netMargin: { type: Type.NUMBER, description: "單季稅後淨利率（單位：%）" },
      eps: { type: Type.NUMBER, description: "單季每股盈餘（EPS，單位：元）" },
    },
    required: ["quarter", "revenue", "grossMargin", "operatingMargin", "netMargin", "eps"],
  },
};


/**
 * Fetches and analyzes financial data for a stock using a two-step Gemini process.
 * Step 1: Fetches structured quarterly financial data using Google Search.
 * Step 2: Generates a human-readable analysis based on the fetched data.
 * @param apiKey The user's Google Gemini API key.
 * @param stockName The name of the stock.
 * @param stockCode The code of the stock.
 * @returns A promise that resolves to a FinancialAnalysis object.
 */
export const getAIFinancialAnalysis = async (apiKey: string, stockName: string, stockCode: string): Promise<FinancialAnalysis> => {
    if (!apiKey) {
        throw new Error("請設定 API 金鑰以啟用財務分析功能。");
    }
    const ai = new GoogleGenAI({ apiKey });

    // --- Step 1: Fetch structured financial data ---
    const fetchDataPrompt = `你是一位頂尖的財經數據專家。請使用網路搜尋，為台灣股票「${stockName} (${stockCode})」找出最近 4 個季度的財報關鍵數據。

你的回覆必須是**一個 JSON 陣列**，其中包含 4 個物件，每個物件代表一個季度。
請**只回傳 JSON 陣列**，不要包含任何其他文字、解釋或 markdown 格式 (例如 \`\`\`json)。

**JSON 物件結構與單位:**
- \`quarter\`: string (格式為 'YYYYQX', e.g., '2023Q4')
- \`revenue\`: number (單季營業收入，單位：億元台幣)
- \`grossMargin\`: number (單季毛利率，單位：%)
- \`operatingMargin\`: number (單季營業利益率，單位：%)
- \`netMargin\`: number (單季稅後淨利率，單位：%)
- \`eps\`: number (單季每股盈餘/EPS，單位：元)
`;

    let financialData: QuarterlyFinancials[];
    let sources: NewsSource[];
    try {
        const dataResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fetchDataPrompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        
        let jsonText = dataResponse.text.trim();
        // Defensive parsing: remove markdown fences if the model includes them despite instructions.
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7, -3).trim();
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.slice(3, -3).trim();
        }
        
        financialData = JSON.parse(jsonText) as QuarterlyFinancials[];
        if (!Array.isArray(financialData) || financialData.length === 0) {
            throw new Error("AI 未能回傳有效的財務數據陣列。");
        }

        const groundingChunks = dataResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        sources = groundingChunks
            .map((chunk: any) => ({
                title: chunk.web?.title || '未知來源',
                uri: chunk.web?.uri || '#',
            }))
            .filter((source: NewsSource) => source.uri !== '#');

        sources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    } catch (error) {
        console.error("Error fetching financial data with Gemini:", error);
        throw new Error("AI 無法獲取結構化的財務數據，請稍後再試。");
    }

    // --- Step 2: Generate analysis summary from the data ---
    const analysisPrompt = `你是一位專業的台灣股市分析師。請根據以下提供的 JSON 格式的季度財報數據，為股票「${stockName}」撰寫一段 150 字以內的簡潔財務趨勢分析。分析應涵蓋營收、獲利能力（毛利率、營業利益率）和每股盈餘（EPS）的趨勢。語氣需客觀、專業，適合一般投資人閱讀。\n\n財務數據：\n${JSON.stringify(financialData, null, 2)}`;
    
    try {
        const analysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: analysisPrompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const summary = analysisResponse.text.trim();
        return { data: financialData, summary, sources };
    } catch (error) {
        console.error("Error generating financial analysis with Gemini:", error);
        throw new Error("AI 無法生成財務分析總結，請稍後再試。");
    }
};