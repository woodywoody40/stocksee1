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
