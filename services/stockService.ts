
import { Stock, HistoricalDataPoint } from '../types';
import { getProxiedUrl } from './proxyHelper';

// Interface for the structure of a single stock object from the TWSE getStockInfo API response
interface TwseStock {
    c: string; // code
    n: string; // name
    z: string; // current price
    v: string; // volume
    o: string; // open
    h: string; // high
    l: string; // low
    y: string; // yesterday's price
}

/**
 * 安全的轉型浮點數，處理 "-", "", "null" 等異常狀況
 */
const safeParseFloat = (val: string | undefined | null, fallback: number = 0): number => {
    if (!val || val === '-' || val === 'null') return fallback;
    const cleaned = val.toString().replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : parsed;
};

/**
 * Fetches real-time stock data from the Taiwan Stock Exchange (TWSE) API.
 */
export const fetchStockData = async (codes: string[]): Promise<Stock[]> => {
    if (codes.length === 0) {
        return [];
    }

    const query = codes.flatMap(code => [`tse_${code}.tw`, `otc_${code}.tw`]).join('|');
    const apiUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${query}&json=1&delay=0&_=${Date.now()}`;
    
    const proxyUrl = getProxiedUrl(apiUrl);

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Network response was not ok`);
        
        const data = await response.json();

        if (!data || !data.msgArray || data.msgArray.length === 0) {
            return [];
        }

        const stocks: Stock[] = data.msgArray.map((item: TwseStock) => {
            const yesterdayPrice = safeParseFloat(item.y, 0);
            // 如果 z (現價) 是 "-", 通常表示尚未成交，此時以昨收價當作參考現價
            const price = safeParseFloat(item.z, yesterdayPrice);
            const open = safeParseFloat(item.o, price);
            const high = safeParseFloat(item.h, price);
            const low = safeParseFloat(item.l, price);
            const volume = safeParseFloat(item.v, 0);

            const change = price - yesterdayPrice;
            const changePercent = yesterdayPrice > 0 ? (change / yesterdayPrice) * 100 : 0;

            return {
                code: item.c,
                name: item.n,
                price: price,
                change: parseFloat(change.toFixed(2)),
                changePercent: parseFloat(changePercent.toFixed(2)),
                open: open,
                high: high,
                low: low,
                volume: Math.floor(volume),
                yesterdayPrice: yesterdayPrice,
            };
        });

        return Array.from(new Map(stocks.map(stock => [stock.code, stock])).values());

    } catch (error) {
        console.error("Failed to fetch stock data:", error);
        throw new Error("無法從證交所獲取資料，請稍後再試。");
    }
};

/**
 * Fetches historical daily stock data.
 */
export const fetchHistoricalData = async (code: string): Promise<HistoricalDataPoint[]> => {
    const today = new Date();
    const dates: Date[] = [];
    for (let i = 0; i < 36; i++) {
        dates.push(new Date(today.getFullYear(), today.getMonth() - i, 1));
    }
    
    const sources = {
        TSE: {
            getUrl: (year: number, month: string) => `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${year}${month}01&stockNo=${code}`,
            getData: (json: any) => (json.stat === "OK" && Array.isArray(json.data) ? json.data : []),
            getClosePriceIndex: () => 6,
        },
        OTC: {
            getUrl: (rocYear: number, month: string) => `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?l=zh-tw&d=${rocYear}/${month}&stkno=${code}`,
            getData: (json: any) => (Array.isArray(json.aaData) ? json.aaData : []),
            getClosePriceIndex: () => 6,
        },
        EMERGING: {
            getUrl: (rocYear: number, month: string) => `https://www.tpex.org.tw/web/stock/emergingstock/historical/daily/EMDaily_result.php?l=zh-tw&d=${rocYear}/${month}&stkno=${code}`,
            getData: (json: any) => (Array.isArray(json.aaData) ? json.aaData : []),
            getClosePriceIndex: () => 4,
        }
    };

    let rawData: any[] = [];
    let sourceKey: keyof typeof sources | null = null;

    try {
        for (const key of Object.keys(sources) as Array<keyof typeof sources>) {
            sourceKey = key;
            const currentSource = sources[sourceKey];
            const urls = dates.map(date => {
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const rocYear = year - 1911;
                return currentSource.getUrl(sourceKey === 'TSE' ? year : rocYear, month);
            });

            const responses = await Promise.all(urls.map(url => fetch(getProxiedUrl(url))));
            let combinedData: any[] = [];

            for (const response of responses) {
                if (response.ok) {
                    try {
                        const json = await response.json();
                        combinedData.push(...currentSource.getData(json));
                    } catch (e) {
                         // silently ignore parsing errors for this particular URL/proxy
                         console.warn("Failed to parse JSON for historical data:", e);
                    }
                }
            }
            
            if (combinedData.length > 0) {
                rawData = combinedData;
                break;
            } else {
                sourceKey = null;
            }
        }
        
        if (rawData.length === 0 || !sourceKey) throw new Error('No data');

        const closePriceIndex = sources[sourceKey].getClosePriceIndex();
        const historicalPoints: HistoricalDataPoint[] = rawData
            .map(item => {
                if (Array.isArray(item) && item.length > closePriceIndex) {
                    const date = item[0]?.trim();
                    const closeVal = safeParseFloat(item[closePriceIndex], 0);
                    if (date && closeVal > 0) {
                         return { date, close: closeVal };
                    }
                }
                return null;
            })
            .filter((p): p is HistoricalDataPoint => p !== null);

        const uniquePoints = Array.from(new Map(historicalPoints.map(p => [p.date, p])).values());
        uniquePoints.sort((a, b) => {
            const dateA = new Date(a.date.replace(/(\d+)\/(\d+)\/(\d+)/, (_, y, m, d) => `${parseInt(y) + 1911}-${m}-${d}`));
            const dateB = new Date(b.date.replace(/(\d+)\/(\d+)\/(\d+)/, (_, y, m, d) => `${parseInt(y) + 1911}-${m}-${d}`));
            return dateB.getTime() - dateA.getTime();
        });

        return uniquePoints;

    } catch (error) {
        console.error("Historical data error:", error);
        return [];
    }
};
