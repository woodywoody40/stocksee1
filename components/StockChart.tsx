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

    if (!priceData || priceData.length < 2) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-xs text-secondary-dark">歷史資料不足</p>
            </div>
        );
    }
  
    const reversedData = useMemo(() => [...priceData].reverse(), [priceData]);
    const priceColor = color || (reversedData[reversedData.length - 1].close >= reversedData[0].close ? '#ef4444' : '#22c55e');
    const gradientColor = color ? color.replace(')', ', 0.2)').replace('rgb', 'rgba') : (reversedData[reversedData.length - 1].close >= reversedData[0].close ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)');
    const gradientId = `chart-gradient-${priceColor.replace(/[^a-zA-Z0-9]/g, '')}`;

    const svgWidth = 300;
    const svgHeight = 100;
    const paddingY = 5;
    const chartHeight = svgHeight - paddingY * 2;

    const allValues = useMemo(() => reversedData.map(p => p.close), [reversedData]);
    const maxVal = useMemo(() => Math.max(...allValues), [allValues]);
    const minVal = useMemo(() => Math.min(...allValues), [allValues]);
    const valueRange = maxVal - minVal;

    const scaleY = useCallback((value: number) => {
        if (valueRange === 0) return svgHeight / 2;
        return (svgHeight - paddingY) - ((value - minVal) / valueRange) * chartHeight;
    }, [valueRange, svgHeight, chartHeight, paddingY, minVal]);

    const dataLength = reversedData.length;
    const xStep = svgWidth / (dataLength > 1 ? dataLength - 1 : 1);

    const points = useMemo(() => reversedData.map((d, i) => ({
        x: i * xStep,
        y: scaleY(d.close),
        data: d,
    })), [reversedData, xStep, scaleY]);

    const pricePath = useMemo(() => {
        if (points.length === 0) return '';
        return `M ${points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ')}`;
    }, [points]);
    
    const areaPath = useMemo(() => `${pricePath} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`, [pricePath, svgWidth, svgHeight]);

    const handleInteraction = useCallback((clientX: number) => {
        if (!svgRef.current || !tooltipGroupRef.current || !tooltipLineRef.current || !tooltipCircleRef.current || !tooltipTextRef.current) return;
        
        const svgRect = svgRef.current.getBoundingClientRect();
        
        const svgX = (clientX - svgRect.left) * (svgWidth / svgRect.width);

        const index = Math.max(0, Math.min(points.length - 1, Math.round(svgX / xStep)));
        
        const point = points[index];
        if (!point) return;

        tooltipGroupRef.current.style.opacity = '1';
        tooltipTextRef.current.style.opacity = '1';

        tooltipLineRef.current.setAttribute('x1', `${point.x}`);
        tooltipLineRef.current.setAttribute('x2', `${point.x}`);
        tooltipCircleRef.current.setAttribute('cx', `${point.x}`);
        tooltipCircleRef.current.setAttribute('cy', `${point.y}`);

        tooltipTextRef.current.innerHTML = `<div class="text-center">${point.data.date}</div><div class="font-bold text-center">${point.data.close.toFixed(2)}</div>`;
        
        const onScreenX = (point.x / svgWidth) * svgRect.width;
        const tooltipWidth = tooltipTextRef.current.offsetWidth;
        let textX = onScreenX + 15; // Position to the right by default
        if (tooltipWidth > 0 && textX + tooltipWidth > svgRect.width - 5) {
            textX = onScreenX - tooltipWidth - 15; // Flip to the left
        }
        tooltipTextRef.current.style.transform = `translateX(${textX}px)`;

    }, [points, xStep, svgWidth]);

    const handleInteractionEnd = useCallback(() => {
        if (tooltipGroupRef.current && tooltipTextRef.current) {
            tooltipGroupRef.current.style.opacity = '0';
            tooltipTextRef.current.style.opacity = '0';
        }
    }, []);

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        handleInteraction(event.clientX);
    },[handleInteraction]);

    const handleTouchMove = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
        if (event.touches.length > 0) {
            handleInteraction(event.touches[0].clientX);
        }
    }, [handleInteraction]);
    
    const handleTouchStart = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
        if (event.touches.length > 0) {
            handleInteraction(event.touches[0].clientX);
        }
    }, [handleInteraction]);

    return (
        <div className="relative w-full h-full cursor-crosshair">
            <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full"
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleInteractionEnd}
            >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradientColor} stopOpacity={0.5}/>
                    <stop offset="100%" stopColor={gradientColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>

                {Array.from({ length: 5 }).map((_, i) => (
                    <line
                        key={i}
                        x1="0"
                        y1={i * (svgHeight / 4)}
                        x2={svgWidth}
                        y2={i * (svgHeight / 4)}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="0.5"
                    />
                ))}

                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path d={pricePath} fill="none" stroke={priceColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                
                <g ref={tooltipGroupRef} style={{ opacity: 0, transition: 'opacity 0.1s ease' }}>
                    <line
                        ref={tooltipLineRef}
                        y1="0"
                        y2={svgHeight}
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                    />
                    <circle ref={tooltipCircleRef} r="4" fill={priceColor} stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                </g>
            </svg>
            
            <div className="absolute top-0 right-0 flex items-center text-xs p-1 space-x-2 bg-surface-dark/50 rounded-bl-md">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5" style={{ backgroundColor: priceColor }}></div>
                    <span className="text-secondary-dark font-mono">股價</span>
                </div>
            </div>
            
            <div
                ref={tooltipTextRef}
                className="absolute top-2 bg-black/70 text-white text-xs rounded-md p-2 pointer-events-none z-10"
                style={{ opacity: 0, transition: 'opacity 0.1s ease, transform 0.1s ease' }}
            >
                {/* Content is set via innerHTML */}
            </div>
        </div>
    );
};

export default StockChart;
