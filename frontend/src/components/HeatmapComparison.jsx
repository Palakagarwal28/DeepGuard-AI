import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronsLeftRight, Image as ImageIcon, Map, SplitSquareHorizontal, Info } from 'lucide-react';

export default function HeatmapComparison({ originalSrc, heatmapSrc, alt = "Comparison" }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('compare'); // 'original', 'compare', 'heatmap'
  const [opacity, setOpacity] = useState(0.85);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const position = ((clientX - left) / width) * 100;
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  const handleMouseMove = (e) => { if (isDragging) handleMove(e.clientX); };
  const handleTouchMove = (e) => { if (isDragging) handleMove(e.touches[0].clientX); };
  
  const handleInteractionStart = (e) => {
    if (viewMode !== 'compare') return;
    setIsDragging(true);
    handleMove(e.clientX || (e.touches && e.touches[0].clientX));
  };

  const handleInteractionEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleInteractionEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleInteractionEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isDragging]);

  const effectivePosition = viewMode === 'original' ? 100 : viewMode === 'heatmap' ? 0 : sliderPosition;

  const modes = [
    { id: 'original', label: 'Original', icon: ImageIcon },
    { id: 'compare', label: 'Compare', icon: SplitSquareHorizontal },
    { id: 'heatmap', label: 'Heatmap', icon: Map }
  ];

  return (
    <div className="flex flex-col gap-6 w-full my-8">
      {/* Top Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-5 bg-card/40 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
        
        {/* Animated Toggle */}
        <div className="flex bg-background/50 p-1.5 rounded-full border border-card_border shadow-inner relative">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`relative flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-colors z-10 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="heatmapTabGlow"
                    className="absolute inset-0 bg-primary/90 rounded-full shadow-[0_0_15px_rgba(127,90,240,0.5)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Opacity Control */}
        <div className={`flex items-center gap-4 transition-opacity duration-300 bg-background/30 px-5 py-2.5 rounded-full border border-white/5 ${viewMode === 'original' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <span className="text-xs text-slate-300 uppercase tracking-widest font-bold">Heatmap Intensity</span>
          <input 
            type="range" 
            min="0" max="1" step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-28 accent-primary cursor-pointer"
          />
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>
      
      {/* Main Image Container */}
      <motion.div 
        ref={containerRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-black ${viewMode === 'compare' ? 'cursor-ew-resize' : ''} select-none ring-1 ring-white/5`}
        onMouseDown={handleInteractionStart}
        onTouchStart={handleInteractionStart}
      >
        {/* Original Image (Background) */}
        <img 
          src={originalSrc} 
          alt={`Original ${alt}`} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Heatmap Image (Foreground, clipped) */}
        <img 
          src={heatmapSrc} 
          alt={`Heatmap ${alt}`} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-200"
          style={{ 
            clipPath: `inset(0 0 0 ${effectivePosition}%)`,
            opacity: opacity,
            mixBlendMode: 'screen' 
          }}
        />

        {/* Slider Handle */}
        {viewMode === 'compare' && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(44,185,255,1)] z-10 transition-transform duration-75"
            style={{ left: `${effectivePosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(44,185,255,0.8)] border-[3px] border-white text-white">
              <ChevronsLeftRight size={20} className="drop-shadow-md" />
            </div>
          </div>
        )}

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md border border-white/10 text-white text-xs px-4 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0 z-20 flex items-center gap-3 shadow-xl">
          <Info size={16} className="text-secondary" />
          <div className="flex flex-col gap-1">
             <span className="font-semibold text-slate-200">Activation Map Legend</span>
             <div className="flex items-center gap-2">
               <div className="w-24 h-2 rounded-full bg-gradient-to-r from-blue-500 via-green-400 to-red-500"></div>
               <span className="text-[10px] text-slate-400">Low → High Impact</span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
