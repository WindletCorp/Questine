"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, animate, PanInfo, MotionValue } from "framer-motion";

interface DragSplitViewProps {
  topPanel: React.ReactNode | ((y: MotionValue<number>) => React.ReactNode);
  bottomPanel: React.ReactNode;
}

export function DragSplitView({ topPanel, bottomPanel }: DragSplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(1000); // fallback
  
  // y represents the exact pixel split point from the top
  const y = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!containerRef.current) return;
    
    const h = containerRef.current.getBoundingClientRect().height;
    setContainerHeight(h);
    
    // Animate to 240px default on mount for the 30% view
    animate(y, 240, { type: "spring", stiffness: 300, damping: 30 });
    
    const observer = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [y]);

  const handleDragEnd = (e: any, info: PanInfo) => {
    const currentY = y.get();
    const snap0 = 0;
    const snap15 = 120; // 15% inline KPIs
    const snap30 = 240; // 30% standard view
    const snap100 = containerHeight; // 100% full analytics
    
    const projectedY = currentY + info.velocity.y * 0.1;
    
    const points = [snap0, snap15, snap30, snap100];
    const closest = points.reduce((prev, curr) => 
      Math.abs(curr - projectedY) < Math.abs(prev - projectedY) ? curr : prev
    );
    
    animate(y, closest, { type: "spring", stiffness: 400, damping: 32 });
  };

  const renderedTopPanel = typeof topPanel === "function" ? topPanel(y) : topPanel;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      
      {/* Top Panel (Analytics) */}
      <motion.div 
        style={{ height: y }}
        className="absolute top-0 left-0 right-0 overflow-hidden z-10"
      >
        <div className="absolute top-0 left-0 right-0 flex flex-col justify-start h-full">
           {renderedTopPanel}
        </div>
      </motion.div>

      {/* Bottom Panel (Timeline) */}
      <motion.div 
        style={{ top: y }}
        className="absolute bottom-0 left-0 right-0 overflow-hidden pt-4 z-0"
      >
        {bottomPanel}
      </motion.div>

      {/* The Drag Handle */}
      {isMounted && (
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: containerHeight }}
          dragElastic={0.05}
          dragMomentum={false}
          style={{ y }}
          onDragEnd={handleDragEnd}
          className="absolute top-0 left-0 right-0 h-8 -mt-4 flex items-center justify-center cursor-ns-resize z-20 touch-none group"
        >
          {/* Glass pill */}
          <div className="w-10 h-1.5 rounded-full bg-white/20 group-hover:bg-white/40 group-active:bg-white/50 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.3)] backdrop-blur-md border border-white/10" />
        </motion.div>
      )}
    </div>
  );
}
