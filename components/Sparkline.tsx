import React from 'react';

interface SparklineProps {
    data: number[];
}

const Sparkline: React.FC<SparklineProps> = ({ data }) => {
  // Ensure we have at least two points to draw a line
  if (!data || data.length < 2) {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <p className="text-xs text-secondary-light dark:text-secondary-dark">無資料</p>
        </div>
    );
  }

  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)'; // Red 500, Green 500
  
  const gradientId = isPositive ? 'positive-spark-gradient' : 'negative-spark-gradient';
  const gradientColor = isPositive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)';

  // SVG dimensions
  const svgWidth = 80;
  const svgHeight = 50;
  const paddingY = 5;
  const chartHeight = svgHeight - paddingY * 2;

  // Data normalization
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const valueRange = maxVal - minVal;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * svgWidth;
    // Handle flat line case to avoid division by zero
    const y = valueRange === 0 
      ? svgHeight / 2 
      : (svgHeight - paddingY) - ((d - minVal) / valueRange) * chartHeight;
    return `${x},${y}`;
  });

  const path = `M ${points.join(' L ')}`;
  const areaPath = `${path} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: gradientColor, stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: gradientColor, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export default Sparkline;