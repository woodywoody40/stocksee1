import { TW_STOCKS } from '../data/tw_stocks';
import { StockListItem } from '../types';

const CACHE_KEY = 'full-stock-list';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Official ISIN pages are a more reliable source than the JSON APIs.
const TSE_ISIN_URL = 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=2'; // 上市
const OTC_ISIN_URL = 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=4'; // 上櫃
const EMERGING_ISIN_URL = 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=3'; // 興櫃

/**
 * Parses the HTML from the TWSE ISIN page to extract stock codes and names.
 * @param html - The HTML content of the page as a string.
 * @returns An array of stock list items.
 */
const parseIsinHtml = (html: string): StockListItem[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('tr');
    const stocks: StockListItem[] = [];

    rows.forEach(row => {
        if (!row.cells || row.cells.length < 5) return;

        const firstCellText = row.cells[0].textContent?.trim();
        if (!firstCellText) return;
        
        const marketType = row.cells[3]?.textContent?.trim();
        const industry = row.cells[4]?.textContent?.trim();

        // The format is "<code><full-width space><name>", e.g., "2330　台積電"
        const parts = firstCellText.split('　');
        if (parts.length === 2) {
            const code = parts[0].trim();
            const name = parts[1].trim();
            
            // Validate code format and filter out non-stock/ETF items like warrants.
            if (
                /^[0-9A-Z]{3,6}$/.test(code) &&
                (marketType === '上市' || marketType === '上櫃' || marketType === '興櫃') &&
                industry &&
                !industry.includes('認購') &&
                !industry.includes('認售') &&
                !industry.includes('牛證') &&
                !industry.includes('熊證') &&
                !industry.includes('指數投資證券')
            ) {
                stocks.push({ code, name });
            }
        }
    });
    return stocks;
};

/**
 * Fetches the HTML from a URL via a proxy and correctly decodes its Big5 charset.
 * @param url - The URL of the ISIN page to fetch.
 * @returns A promise that resolves to an array of parsed stock list items.
 */
const fetchAndParseHtmlWithProxy = async (url: string): Promise<StockListItem[]> => {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch from ${url} with status: ${response.status}`);
    }
    
    // The TWSE ISIN page uses 'ms950' (Big5) encoding, which must be decoded properly.
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('big5');
    const htmlText = decoder.decode(buffer);

    return parseIsinHtml(htmlText);
};

/**
 * Fetches the full stock list from the official TWSE/TPEX ISIN web pages.
 * This is more reliable than the previously used JSON APIs.
 * @returns A promise resolving to an array of all stock list items.
 */
const fetchFullListFromApi = async (): Promise<StockListItem[]> => {
    try {
        console.log("Fetching full stock list from official ISIN sources...");
        const sources = [TSE_ISIN_URL, OTC_ISIN_URL, EMERGING_ISIN_URL];
        
        const results = await Promise.allSettled(sources.map(url => fetchAndParseHtmlWithProxy(url)));
        
        let combinedList: StockListItem[] = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                combinedList.push(...result.value);
            } else if (result.status === 'rejected') {
                console.warn(`Failed to fetch or parse from ${sources[index]}:`, result.reason);
            }
        });

        if (combinedList.length === 0) {
           throw new Error("All official ISIN page sources failed to return data.");
        }
        
        const uniqueStocks = Array.from(new Map(combinedList.map(item => [item.code, item])).values());
        
        // Create a map from our static list for easy lookup of better names and aliases.
        const staticStockMap = new Map(TW_STOCKS.map(s => [s.code, { name: s.name, alias: s.alias }]));

        // Merge the live list from ISIN with our curated static list.
        // The live list confirms which stocks exist. The static list provides better, searchable names.
        const mergedList = uniqueStocks.map(liveStock => {
            const staticInfo = staticStockMap.get(liveStock.code);
            if (staticInfo) {
                // Prefer the curated name and alias for better searchability, e.g., for names with "-KY".
                return { code: liveStock.code, name: staticInfo.name, alias: staticInfo.alias };
            }
            // If not in our curated list, use the live data as-is.
            return liveStock;
        });

        console.log(`Successfully fetched and merged ${mergedList.length} stocks from official sources.`);
        return mergedList;

    } catch (error) {
        console.error("Failed to fetch full stock list from ISIN API:", error);
        throw error; // Re-throw to be caught by the calling function.
    }
};

/**
 * Gets the complete list of Taiwanese stocks.
 * It first tries to load from a 24-hour local cache. If the cache is stale or absent,
 * it fetches fresh data from the ISIN pages. If the fetch fails, it returns a static
 * fallback list.
 * @returns A promise that resolves to an array of stock list items.
 */
export const getFullStockList = async (): Promise<StockListItem[]> => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { timestamp, data } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                console.log("Using cached full stock list.");
                return data;
            }
        }

        const freshData = await fetchFullListFromApi();
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: freshData }));
        return freshData;

    } catch (error) {
        console.warn("Using fallback static stock list due to an error fetching/caching the full list.");
        return TW_STOCKS;
    }
};