import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, NewsArticle, NewsSource, QuarterlyFinancials, FinancialAnalysis } from '../types';

const getApiKey = (): string => {
  const userKey = localStorage.getItem('gemini_api_key');
  if (userKey) return userKey;
  
  // Use Vite's import.meta.env if available, fallback to the statically replaced process.env.GEMINI_API_KEY
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY as string;
  }
  
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
  }
  return '';
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "以繁體中文，對文章內容做出簡潔的重點摘要（約3-4句話）。"
    },
    sentiment: {
      type: Type.STRING,
      description: "對股票的整體情緒，必須是 'Positive', 'Negative', 或 'Neutral' 其中之一。"
    },
    score: {
      type: Type.NUMBER,
      description: "情緒分數，範圍從 0 (極度負面) 到 100 (極度正面)。"
    },
    impact_analysis: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "具體的影響分析點（列出2-4點），例如：營收貢獻、成本增加、題材效應等。"
    },
    opportunities_risks: {
      type: Type.STRING,
      description: "結合新聞內容，指出這檔股票未來的機會與風險（請用客觀角度，約50字以內）。"
    },
    related_sectors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "可能會因此新聞而受影響的其他相關產業或供應鏈板塊。"
    }
  },
  required: ["summary", "sentiment", "score", "impact_analysis", "opportunities_risks", "related_sectors"],
};

export const analyzeNews = async (newsText: string): Promise<AnalysisResult> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("系統未配置有效的 API 金鑰。請至設定頁面輸入您的 Gemini API Key，或確認已在部署平台設定 GEMINI_API_KEY 環境變數。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `請僅根據以下提供的新聞文章，以繁體中文進行深度剖析，並嚴格按照指定的 JSON 格式回傳結果。

分析要求：
1.  **summary**: 提煉文章的核心內容，寫成一段 3-4 句話的摘要，務必包含具體數據或重大事件。
2.  **sentiment**: 判斷這篇新聞對該股票是「正面(Positive)」、「負面(Negative)」還是「中性(Neutral)」。
3.  **score**: 給予一個 0-100 的情緒分數（0 極度負面，100 極度正面，50 中性）。
4.  **impact_analysis**: 列出 2-4 點此新聞可能對公司營運造成的具體影響。
5.  **opportunities_risks**: 分析潛在的投資機會與面臨的風險。
6.  **related_sectors**: 找出可能產生連動效應或同受影響的相關產業。

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
                systemInstruction: "你是一位資深的台灣股市與產業分析師。",
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
        const ObjectMsg = error instanceof Error ? error.message : String(error);
        if (ObjectMsg.includes('API key not valid')) {
            throw new Error("AI API 金鑰無效。請至設定頁面重新輸入有效的 Gemini API Key，或確認環境變數設定正確。");
        }
        if (ObjectMsg.includes('429') || ObjectMsg.includes('RESOURCE_EXHAUSTED') || ObjectMsg.includes('quota')) {
            throw new Error("API 配額已用盡。請稍後再試。");
        }
        if (error instanceof Error) {
           throw new Error(`AI 分析失敗 (${error.name}): ${error.message}`);
        }
        throw new Error("AI 分析時發生未知錯誤。");
    }
};

export const fetchNewsWithGemini = async (stockName: string, stockCode: string): Promise<NewsArticle> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("系統未配置有效的 API 金鑰。請至設定頁面輸入您的 Gemini API Key，或確認已在部署平台設定 GEMINI_API_KEY 環境變數。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `你的任務是使用網路搜尋，為台灣股票「${stockName} (${stockCode})」找出**今天或最近 3 天內最重要的一篇**財經新聞。

你的回覆必須**只包含該新聞報導的「完整內文」或「詳盡摘要」**，不可包含任何前言、標題或個人評論。

**重要**: 如果找不到單一報導，請統整近期關於該公司的動態與表現。如果真的完全沒有任何相關資訊，請明確回覆『未找到近期相關重大新聞』。`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "你是一位頂尖的財經新聞蒐集專家，專精於台灣股市。",
                tools: [{googleSearch: {}}],
                temperature: 0.1,
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
         const msg = error instanceof Error ? error.message : String(error);
         if (msg.includes('API key not valid')) {
             throw new Error("AI API 金鑰無效。請至設定頁面重新輸入有效的 Gemini API Key，或確認環境變數設定正確。");
         }
         if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
             throw new Error("API 配額已用盡。請稍後再試，或前往 https://ai.dev/rate-limit 查看剩餘用量。");
         }
         throw new Error(`AI 自動搜尋新聞失敗: ${msg}`);
     }
 };

const FINANCIAL_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "150 字以內的財務趨勢總評。"
        },
        strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "財報中顯示的亮點與優勢（1-3點）。"
        },
        weaknesses: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "財報中顯示的隱患或劣勢（1-3點）。"
        }
    },
    required: ["summary", "strengths", "weaknesses"]
};

export const getAIFinancialAnalysis = async (stockName: string, stockCode: string): Promise<FinancialAnalysis> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("系統未配置有效的 API 金鑰。請至設定頁面輸入您的 Gemini API Key，或確認已在部署平台設定 GEMINI_API_KEY 環境變數。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const fetchDataPrompt = `請使用搜尋，為台灣股票「${stockName} (${stockCode})」找出最近 4 個季度的財報關鍵數據。

你的回覆必須是**一個 JSON 陣列**，其中包含 4 個物件，每個物件代表一個季度。
請**只回傳 JSON 陣列**，不要包含任何其他文字。

**JSON 結構範例:**
[
  {
    "quarter": "2023Q4",
    "revenue": 100.5,
    "grossMargin": 30.2,
    "operatingMargin": 15.1,
    "netMargin": 12.0,
    "eps": 2.5
  }
]
`;

    let financialData: QuarterlyFinancials[];
    let sources: NewsSource[];
    try {
        const dataResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fetchDataPrompt,
            config: {
                systemInstruction: "你是一位頂尖的財經數據分析師，專精於整理台灣股市的財務數據。",
                tools: [{ googleSearch: {} }],
                temperature: 0.1,
            },
        });
        
        let jsonText = dataResponse.text.trim();
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
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('API key not valid')) {
            throw new Error("AI API 金鑰無效。請至設定頁面重新輸入有效的 Gemini API Key，或確認環境變數設定正確。");
        }
        throw new Error(`AI 獲取結構化的財務數據失敗: ${msg}`);
    }

    const analysisPrompt = `請根據以下提供的季度財報數據，為股票「${stockName}」撰寫財務趨勢分析。
    請嚴格按照 JSON Schema 格式回傳結果。分析重點：營收成長性、三率（毛利、營業利益、稅後淨利）變化、以及 EPS 表現。

    財務數據：
    ${JSON.stringify(financialData, null, 2)}`;
    
    try {
        const analysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: analysisPrompt,
            config: {
                systemInstruction: "你是一位專業的台灣股市分析師，精通財務報表分析。",
                responseMimeType: "application/json",
                responseSchema: FINANCIAL_ANALYSIS_SCHEMA,
                temperature: 0.2,
            },
        });
        const analysisJson = JSON.parse(analysisResponse.text.trim());
        return { data: financialData, summary: analysisJson.summary, strengths: analysisJson.strengths, weaknesses: analysisJson.weaknesses, sources };
    } catch (error) {
        console.error("Error generating financial analysis with Gemini:", error);
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('API key not valid')) {
            throw new Error("AI API 金鑰無效。請至設定頁面重新輸入有效的 Gemini API Key，或確認環境變數設定正確。");
        }
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
            throw new Error("API 配額已用盡。請稍後再試。");
        }
        throw new Error(`AI 財務分析生成失敗: ${msg}`);
    }
};
