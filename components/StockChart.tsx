
import React, { useRef, useMemo, useCallback } from 'react';
import { HistoricalDataPoint } from '../types';

interface StockChartProps {
    priceData: HistoricalDataPoint[];
    color?: string;
}

const StockChart: React.FC<StockChartProps> = ({ priceData, color }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipGroupRef = useRef<SVGGElement>(null);
    const tooltipLineRef = useRef<SVGLineElement>(null);
    const tooltipCircleRef = useRef<SVGCircleElement>(null);
    const tooltipTextRef = useRef<HTMLDivElement>(null);

    // 清洗數據
    const cleanData = useMemo(() => {
        return (priceData || [])
            .filter(p => p && typeof p.close === 'number' && !isNaN(p.close))
            .reverse(); // 為了繪圖從舊到新
    }, [priceData]);

    if (cleanData.length < 2) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-surface-dark-alt/20 rounded-xl">
                <p className="text-sm text-secondary-dark">暫無歷史價格趨勢</p>
            </div>
        );
    }
  
    const priceColor = color || (cleanData[cleanData.length - 1].close >= cleanData[0].close ? '#ef4444' : '#22c55e');
    const gradientColor = priceColor.startsWith('#') ? `${priceColor}33` : priceColor.replace('0.9', '0.2');
    const gradientId = `chart-grad-${Math.random().toString(36).substr(2, 9)}`;

    const svgWidth = 400;
    const svgHeight = 150;
    const padding = 10;

    const allValues = cleanData.map(p => p.close);
    const maxVal = Math.max(...allValues);
    const minVal = Math.min(...allValues);
    const range = maxVal - minVal || 1;

    const scaleY = (val: number) => svgHeight - padding - ((val - minVal) / range) * (svgHeight - padding * 2);
    const xStep = svgWidth / (cleanData.length - 1);

    const points = cleanData.map((d, i) => ({
        x: i * xStep,
        y: scaleY(d.close),
        data: d,
    }));

    const pricePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const areaPath = `${pricePath} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

    const handleInteraction = useCallback((clientX: number) => {
        if (!svgRef.current || !tooltipGroupRef.current || !tooltipTextRef.current) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const svgX = (clientX - rect.left) * (svgWidth / rect.width);
        const index = Math.max(0, Math.min(points.length - 1, Math.round(svgX / xStep)));
        const point = points[index];

        tooltipGroupRef.current.style.opacity = '1';
        tooltipTextRef.current.style.opacity = '1';

        tooltipLineRef.current?.setAttribute('x1', `${point.x}`);
        tooltipLineRef.current?.setAttribute('x2', `${point.x}`);
        tooltipCircleRef.current?.setAttribute('cx', `${point.x}`);
        tooltipCircleRef.current?.setAttribute('cy', `${point.y}`);

        tooltipTextRef.current.innerHTML = `
            <div class="font-mono">
                <div class="text-[10px] text-gray-400">${point.data.date}</div>
                <div class="font-bold text-sm" style="color: ${priceColor}">${point.data.close.toFixed(2)}</div>
            </div>
        `;
        
        const tipWidth = tooltipTextRef.current.offsetWidth;
        let tipX = (point.x / svgWidth) * rect.width - tipWidth / 2;
        tipX = Math.max(5, Math.min(rect.width - tipWidth - 5, tipX));
        tooltipTextRef.current.style.left = `${tipX}px`;

    }, [points, xStep, priceColor]);

    const hideTooltip = () => {
        if (tooltipGroupRef.current) tooltipGroupRef.current.style.opacity = '0';
        if (tooltipTextRef.current) tooltipTextRef.current.style.opacity = '0';
    };

    return (
        <div className="relative w-full h-full group">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full"
                preserveAspectRatio="none"
                onMouseMove={(e) => handleInteraction(e.clientX)}
                onMouseLeave={hideTooltip}
                onTouchMove={(e) => handleInteraction(e.touches[0].clientX)}
                onTouchEnd={hideTooltip}
            >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={priceColor} stopOpacity={0.3}/>
                    <stop offset="100%" stopColor={priceColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path d={pricePath} fill="none" stroke={priceColor} strokeWidth="2.5" strokeLinejoin="round" />
                
                <g ref={tooltipGroupRef} style={{ opacity: 0, transition: 'opacity 0.2s' }}>
                    <line ref={tooltipLineRef} y1="0" y2={svgHeight} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4" />
                    <circle ref={tooltipCircleRef} r="5" fill={priceColor} stroke="#111" strokeWidth="2" />
                </g>
            </svg>
            
            <div
                ref={tooltipTextRef}
                className="absolute top-0 bg-black/90 border border-white/10 rounded px-2 py-1 pointer-events-none transition-opacity duration-200 shadow-xl z-20"
                style={{ opacity: 0 }}
            ></div>
        </div>
    );
};

export default StockChart;
