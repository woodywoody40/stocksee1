
import React, { useState } from 'react';

interface BarChartProps {
    data: { label: string; value: number }[];
    color?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, color = '#f97316' }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) return null;

    const svgWidth = 200;
    const svgHeight = 80;
    const paddingY = 10;
    const chartHeight = svgHeight - paddingY;

    const values = data.map(d => d.value);
    const maxValAbs = Math.max(...values.map(Math.abs));
    const hasNegative = values.some(v => v < 0);
    
    // Determine the baseline (y=0) position
    const zeroLineY = hasNegative ? chartHeight * (maxValAbs / (maxValAbs * 2)) + paddingY/2 : chartHeight + paddingY/2;

    const barWidth = svgWidth / data.length;
    const barPadding = 4;

    return (
        <div className="relative w-full h-full">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
                 {/* Zero line */}
                 {hasNegative && (
                    <line x1="0" y1={zeroLineY} x2={svgWidth} y2={zeroLineY} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                 )}
                
                {data.map((d, i) => {
                    const barHeight = (Math.abs(d.value) / maxValAbs) * (hasNegative ? chartHeight / 2 : chartHeight);
                    const x = i * barWidth;
                    const y = d.value >= 0 ? zeroLineY - barHeight : zeroLineY;

                    return (
                        <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                            <rect
                                x={x + barPadding / 2}
                                y={y}
                                width={barWidth - barPadding}
                                height={barHeight}
                                fill={color}
                                className="transition-opacity duration-200"
                                opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.5}
                            />
                        </g>
                    );
                })}
            </svg>
             <div className="absolute bottom-0 w-full flex justify-around text-[10px] text-secondary-dark px-1">
                {data.map((d, i) => (
                    <div key={i} className="text-center w-full">{d.label.replace(/^\d{4}/, '')}</div>
                ))}
            </div>
            {hoveredIndex !== null && (
                 <div 
                    className="absolute bg-black/80 text-white text-xs rounded-md p-1.5 pointer-events-none z-10 transition-all duration-200"
                    style={{
                        left: `${(hoveredIndex * barWidth) + barWidth / 2}px`,
                        bottom: '20px',
                        transform: 'translateX(-50%)',
                        opacity: 1,
                    }}
                >
                    {data[hoveredIndex].value.toLocaleString()}
                </div>
            )}
        </div>
    );
};

export default BarChart;
