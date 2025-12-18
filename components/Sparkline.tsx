
import React from 'react';

interface SparklineProps {
    data: number[];
    isPositive: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({ data, isPositive }) => {
  // 過濾 NaN 並確保有足夠的數據
  const cleanData = (data || []).filter(val => typeof val === 'number' && !isNaN(val));

  if (cleanData.length < 2) {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <p className="text-[10px] text-secondary-light dark:text-secondary-dark opacity-50">載入中</p>
        </div>
    );
  }

  const color = isPositive ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
  const gradientId = `spark-grad-${isPositive ? 'pos' : 'neg'}`;
  const gradientColor = isPositive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';

  const svgWidth = 100;
  const svgHeight = 40;
  const padding = 2;
  
  const maxVal = Math.max(...cleanData);
  const minVal = Math.min(...cleanData);
  const range = maxVal - minVal || 1;

  const points = cleanData.map((d, i) => {
    const x = (i / (cleanData.length - 1)) * svgWidth;
    const y = svgHeight - padding - ((d - minVal) / range) * (svgHeight - padding * 2);
    return `${x},${y}`;
  });

  const path = `M ${points.join(' L ')}`;
  const areaPath = `${path} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: gradientColor, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: gradientColor, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export default Sparkline;
