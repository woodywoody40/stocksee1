import { HistoricalDataPoint, IndicatorPoint } from '../types';

/**
 * Calculates the Simple Moving Average (SMA) for a given period.
 * @param data - Array of historical data points, sorted from newest to oldest.
 * @param period - The number of days for the moving average window.
 * @returns An array of indicator points representing the moving average, sorted newest to oldest.
 */
export const calculateMA = (data: HistoricalDataPoint[], period: number): IndicatorPoint[] => {
  if (data.length < period) {
    return [];
  }

  // Data is newest to oldest. We reverse it to calculate chronologically.
  const reversedData = [...data].reverse();
  
  const movingAverages: IndicatorPoint[] = [];
  
  // Calculate the initial sum for the first window.
  let sum = reversedData.slice(0, period).reduce((acc, curr) => acc + curr.close, 0);
  
  movingAverages.push({
      date: reversedData[period - 1].date,
      value: parseFloat((sum / period).toFixed(2)),
  });

  // Use a sliding window for efficiency.
  for (let i = period; i < reversedData.length; i++) {
    sum = sum - reversedData[i - period].close + reversedData[i].close;
    movingAverages.push({
      date: reversedData[i].date,
      value: parseFloat((sum / period).toFixed(2)),
    });
  }

  // Reverse back to have newest first, matching the original data order.
  return movingAverages.reverse();
};

// Helper to get the Monday of a given date's week
const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
};

const parseRocDate = (rocDate: string): Date => {
    const dateParts = rocDate.split('/');
    if (dateParts.length !== 3) return new Date(); // Return invalid date if format is wrong
    const year = parseInt(dateParts[0]) + 1911;
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    return new Date(year, month, day);
}

/**
 * Aggregates daily historical data into weekly data points.
 * It uses the last trading day of each week as the weekly data point.
 * @param dailyData - Array of historical data points, sorted from newest to oldest.
 * @returns An array of weekly historical data points, sorted newest to oldest.
 */
export const aggregateToWeekly = (dailyData: HistoricalDataPoint[]): HistoricalDataPoint[] => {
    if (!dailyData || dailyData.length === 0) return [];

    const weeklyDataMap = new Map<string, HistoricalDataPoint>();

    dailyData.forEach(point => {
        const jsDate = parseRocDate(point.date);
        const weekStart = getWeekStart(jsDate);
        const weekKey = weekStart.toISOString().split('T')[0];

        // Since data is newest to oldest, the first entry we see for a week is the latest one.
        if (!weeklyDataMap.has(weekKey)) {
            weeklyDataMap.set(weekKey, point);
        }
    });

    return Array.from(weeklyDataMap.values());
};


/**
 * Aggregates daily historical data into monthly data points.
 * It uses the last trading day of each month as the monthly data point.
 * @param dailyData - Array of historical data points, sorted from newest to oldest.
 * @returns An array of monthly historical data points, sorted newest to oldest.
 */
export const aggregateToMonthly = (dailyData: HistoricalDataPoint[]): HistoricalDataPoint[] => {
    if (!dailyData || dailyData.length === 0) return [];

    const monthlyDataMap = new Map<string, HistoricalDataPoint>();

    dailyData.forEach(point => {
        const jsDate = parseRocDate(point.date);
        const year = jsDate.getFullYear();
        const month = jsDate.getMonth() + 1;
        
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

        // Since data is newest to oldest, the first entry we see for a month is the latest one.
        if (!monthlyDataMap.has(monthKey)) {
            monthlyDataMap.set(monthKey, point);
        }
    });

    return Array.from(monthlyDataMap.values());
};