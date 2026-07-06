'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Edit3 } from 'lucide-react';

export type RoutineBlockSource = 'ai' | 'manual';

export interface RoutineBlock {
  id: string;
  start_time: string; // Absolute ISO string
  end_time: string;   // Absolute ISO string
  label: string;
  source: RoutineBlockSource;
  category?: string;
  color_override?: string;
  order_index?: number;
  type?: 'plan' | 'actual';
}

interface RoutineViewerProps {
  blocks: RoutineBlock[];
  viewDateStr: string; // YYYY-MM-DD
  viewMode?: 'plan' | 'actual' | 'overlay';
  readOnly?: boolean;
  onBlockUpdate?: (updatedBlock: RoutineBlock) => void;
  onBlockAdd?: (newBlock: Omit<RoutineBlock, 'id'>) => void;
  onBlockDelete?: (blockId: string) => void;
  className?: string;
  initialScrollTime?: 'current' | string; // "HH:mm"
}

const PIXELS_PER_MINUTE = 2; 
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE; // 120px per hour
const TOTAL_HOURS = 24;

const CATEGORY_COLORS: Record<string, { bg: string, border: string, text: string, shadow: string }> = {
  health: { bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-900', shadow: '#34d399' },
  work: { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-900', shadow: '#60a5fa' },
  rest: { bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-900', shadow: '#818cf8' },
  social: { bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-900', shadow: '#f472b6' },
  errand: { bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-900', shadow: '#fb923c' },
  other: { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-900', shadow: '#9ca3af' },
};

const getBlockColor = (block: RoutineBlock) => {
  const key = block.color_override || block.category || (block.source === 'ai' ? 'work' : 'social');
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.other;
};

// Format absolute date to display time (assuming UTC to match app assumptions)
const formatDisplayTime = (isoString: string) => {
  try {
    const d = new Date(isoString);
    let hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
    return `${hours}:${m} ${ampm}`;
  } catch (e) {
    return "";
  }
};

const extractHHMM = (isoString: string) => {
  try {
    return new Date(isoString).toISOString().substring(11, 16);
  } catch (e) {
    return "00:00";
  }
};

export function RoutineViewer({
  blocks,
  viewDateStr,
  viewMode = 'plan',
  readOnly = false,
  onBlockUpdate,
  onBlockAdd,
  onBlockDelete,
  className,
  initialScrollTime
}: RoutineViewerProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(null);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    
    let targetMinutes = 0;
    
    if (initialScrollTime === "current") {
      const now = new Date();
      targetMinutes = now.getHours() * 60 + now.getMinutes();
    } else if (initialScrollTime) {
      const [h, m] = initialScrollTime.split(':').map(Number);
      targetMinutes = (h || 0) * 60 + (m || 0);
    } else {
      return; 
    }
    
    const targetY = (targetMinutes * PIXELS_PER_MINUTE) - 100;
    
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [initialScrollTime]);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const hoursGrid = Array.from({ length: TOTAL_HOURS }).map((_, i) => i);

  const viewStartMs = new Date(`${viewDateStr}T00:00:00.000Z`).getTime();
  const viewEndMs = viewStartMs + 24 * 60 * 60 * 1000;

  const renderableBlocks = useMemo(() => {
    return blocks
      .filter(block => {
        if (viewMode === 'plan' && block.type === 'actual') return false;
        if (viewMode === 'actual' && block.type === 'plan') return false;
        return true;
      })
      .map(block => {
        const startMs = new Date(block.start_time).getTime();
        const endMs = new Date(block.end_time).getTime();
        
        const clampedStartMs = Math.max(startMs, viewStartMs);
        const clampedEndMs = Math.min(endMs, viewEndMs);
        
        if (clampedEndMs <= clampedStartMs) return null;
        
        const startMin = (clampedStartMs - viewStartMs) / 60000;
        const durationMin = (clampedEndMs - clampedStartMs) / 60000;
        
        let leftOffset = '0.5rem';
        let rightOffset = '0.5rem';
        if (viewMode === 'overlay') {
          if (block.type === 'plan') {
            rightOffset = '50%';
          } else {
            leftOffset = '50%';
          }
        }
        
        return {
          ...block,
          top: startMin * PIXELS_PER_MINUTE,
          height: durationMin * PIXELS_PER_MINUTE,
          startMin,
          duration: durationMin,
          leftOffset,
          rightOffset
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);
  }, [blocks, viewDateStr, viewMode, viewStartMs, viewEndMs]);

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedMinute = Math.floor(y / PIXELS_PER_MINUTE);
    
    const snappedMinute = Math.floor(clickedMinute / 15) * 15;
    
    const newStartMs = viewStartMs + snappedMinute * 60000;
    const newEndMs = newStartMs + 60 * 60000;

    if (onBlockAdd) {
      onBlockAdd({
        start_time: new Date(newStartMs).toISOString(),
        end_time: new Date(newEndMs).toISOString(),
        label: 'New Routine Block',
        source: 'manual',
        category: 'other',
        type: viewMode === 'overlay' ? 'actual' : (viewMode === 'actual' ? 'actual' : 'plan')
      });
    }
  };

  const handleMoveStart = (e: React.PointerEvent, blockId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    
    const startY = e.clientY;
    const initialBlock = blocks.find(b => b.id === blockId)!;
    const initialStartMs = new Date(initialBlock.start_time).getTime();
    const initialEndMs = new Date(initialBlock.end_time).getTime();
    const durationMs = initialEndMs - initialStartMs;

    let moved = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      if (Math.abs(deltaY) > 5) {
        moved = true;
      }
      
      if (!moved) return;

      const deltaMins = Math.round((deltaY / PIXELS_PER_MINUTE) / 15) * 15;
      const deltaMs = deltaMins * 60000;
      
      const newStartMs = initialStartMs + deltaMs;
      const newEndMs = newStartMs + durationMs;
      
      if (onBlockUpdate) {
        onBlockUpdate({
          ...initialBlock,
          start_time: new Date(newStartMs).toISOString(),
          end_time: new Date(newEndMs).toISOString()
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      if (!moved && !readOnly) {
         setEditingBlockId(blockId);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleResizeStart = (e: React.PointerEvent, blockId: string, edge: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    if (readOnly) return;
    
    const startY = e.clientY;
    const initialBlock = blocks.find(b => b.id === blockId)!;
    const initialStartMs = new Date(initialBlock.start_time).getTime();
    const initialEndMs = new Date(initialBlock.end_time).getTime();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMins = Math.round((deltaY / PIXELS_PER_MINUTE) / 15) * 15;
      const deltaMs = deltaMins * 60000;
      
      let newStartMs = initialStartMs;
      let newEndMs = initialEndMs;
      
      if (edge === 'top') {
        newStartMs = Math.min(initialStartMs + deltaMs, initialEndMs - 15 * 60000);
      } else {
        newEndMs = Math.max(initialEndMs + deltaMs, initialStartMs + 15 * 60000);
      }
      
      if (onBlockUpdate) {
        onBlockUpdate({
          ...initialBlock,
          start_time: new Date(newStartMs).toISOString(),
          end_time: new Date(newEndMs).toISOString()
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const editingBlock = blocks.find(b => b.id === editingBlockId);

  return (
    <div ref={scrollRef} className={cn('relative w-full h-[50vh] min-h-[400px] overflow-y-auto bg-gray-50 rounded-3xl border-4 border-gray-200 hide-scrollbar', className)}>
      
      {readOnly && (
        <div className="sticky top-4 z-20 flex justify-center w-full pointer-events-none">
          <div className="bg-gray-800/80 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
            <Lock size={16} /> Locked Plan
          </div>
        </div>
      )}

      <div className="relative min-w-[300px] select-none" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
        
        <div className="absolute left-0 top-0 bottom-0 w-16 border-r-2 border-gray-100 bg-white/50 z-0">
          {hoursGrid.map(hour => (
            <div 
              key={hour} 
              className="absolute w-full text-right pr-2 text-xs font-bold text-gray-400"
              style={{ top: `${hour * HOUR_HEIGHT - 8}px` }}
            >
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        <div 
          className={cn(
            "absolute left-16 right-0 top-0 bottom-0 z-0",
            !readOnly && "cursor-pointer"
          )}
          onClick={handleGridClick}
        >
          {hoursGrid.map(hour => (
            <div 
              key={hour} 
              className="absolute w-full border-t-2 border-gray-100"
              style={{ top: `${hour * HOUR_HEIGHT}px` }}
            />
          ))}
        </div>

        <div className="absolute left-16 right-0 top-0 bottom-0 px-2 pt-0 z-10 pointer-events-none">
          <AnimatePresence>
            {renderableBlocks.map(block => {
              const colors = getBlockColor(block);
              const isShort = block.duration <= 25;
              const isVeryShort = block.duration <= 15;

              return (
                <motion.div
                  key={block.id}
                  layoutId={block.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "absolute rounded-2xl flex shadow-sm transition-opacity border-2",
                    isShort ? "p-1 px-3 flex-row items-center gap-2 overflow-hidden" : "p-3 flex-col justify-between",
                    !readOnly && "pointer-events-auto cursor-pointer hover:shadow-md active:scale-[0.99]",
                    readOnly && "pointer-events-none opacity-90",
                    colors.bg,
                    colors.border,
                    colors.text,
                    block.type === 'actual' && viewMode === 'overlay' && "opacity-80 border-dashed"
                  )}
                  style={{ 
                    top: `${block.top}px`, 
                    height: `${block.height}px`,
                    left: block.leftOffset,
                    right: block.rightOffset,
                    boxShadow: !readOnly ? `0 4px 0 0 ${colors.shadow}` : 'none',
                    touchAction: 'none'
                  }}
                  onPointerDown={(e) => handleMoveStart(e, block.id)}
                >
                  {!readOnly && !isVeryShort && (
                    <div 
                      className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize z-20 flex justify-center group"
                      onPointerDown={(e) => handleResizeStart(e, block.id, 'top')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-8 h-1 bg-black/10 rounded-full mt-1 group-hover:bg-black/20" />
                    </div>
                  )}

                  <div className={cn("pointer-events-none flex-1 min-w-0", isShort ? "flex items-center gap-2" : "mt-1 mb-1 overflow-hidden")}>
                    <div className={cn("font-bold leading-tight truncate", isShort ? "text-xs" : "text-sm line-clamp-2")}>
                      {block.label} {block.type === 'actual' && viewMode === 'overlay' && "(Actual)"}
                    </div>
                    {!isShort && (
                      <div className="text-xs font-semibold mt-1 opacity-80 truncate">
                        {formatDisplayTime(block.start_time)} - {formatDisplayTime(block.end_time)}
                      </div>
                    )}
                  </div>
                  
                  {!readOnly && !isShort && (
                    <div className="absolute bottom-2 right-2 opacity-50 pointer-events-none">
                      <Edit3 size={16} />
                    </div>
                  )}

                  {!readOnly && !isVeryShort && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize z-20 flex justify-center group items-end pb-1"
                      onPointerDown={(e) => handleResizeStart(e, block.id, 'bottom')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-8 h-1 bg-black/10 rounded-full group-hover:bg-black/20" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {currentTimeMinutes !== null && (
            <div 
              className="absolute -left-2 z-30 pointer-events-none w-4 h-4 bg-red-500 rounded-full shadow-sm border-2 border-white"
              style={{ top: `${currentTimeMinutes * PIXELS_PER_MINUTE - 8}px` }}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingBlock && !readOnly && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="p-6 flex-1 flex flex-col max-w-md mx-auto w-full">
              <h2 className="text-2xl font-black text-gray-800 mb-8">Edit Routine Block</h2>
              
              <div className="space-y-6 flex-1">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Label</label>
                  <input 
                    type="text" 
                    value={editingBlock.label}
                    onChange={(e) => {
                      if (onBlockUpdate) onBlockUpdate({ ...editingBlock, label: e.target.value });
                    }}
                    className="w-full text-xl font-bold bg-gray-50 border-4 border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Start Time</label>
                    <input 
                      type="time" 
                      value={extractHHMM(editingBlock.start_time)}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        if (!newTime) return;
                        const newMs = new Date(`${viewDateStr}T${newTime}:00.000Z`).getTime();
                        if (onBlockUpdate) onBlockUpdate({ ...editingBlock, start_time: new Date(newMs).toISOString() });
                      }}
                      className="w-full text-lg font-bold bg-gray-50 border-4 border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">End Time</label>
                    <input 
                      type="time" 
                      value={extractHHMM(editingBlock.end_time)}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        if (!newTime) return;
                        let newMs = new Date(`${viewDateStr}T${newTime}:00.000Z`).getTime();
                        // if end time is earlier than start time, they meant next day
                        const startMs = new Date(editingBlock.start_time).getTime();
                        if (newMs < startMs) {
                          newMs += 24 * 60 * 60 * 1000;
                        }
                        if (onBlockUpdate) onBlockUpdate({ ...editingBlock, end_time: new Date(newMs).toISOString() });
                      }}
                      className="w-full text-lg font-bold bg-gray-50 border-4 border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Color</label>
                  <div className="flex gap-3">
                    {Object.entries(CATEGORY_COLORS).map(([key, colorObj]) => (
                      <button
                        key={key}
                        onClick={() => {
                          if (onBlockUpdate) {
                            onBlockUpdate({ ...editingBlock, color_override: key });
                          }
                        }}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-transform",
                          colorObj.bg,
                          colorObj.border,
                          (editingBlock.color_override || editingBlock.category) === key 
                            ? "scale-110 shadow-md ring-2 ring-gray-400 ring-offset-2" 
                            : "hover:scale-105"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t-4 border-gray-100 flex flex-col gap-3">
                <button
                  onClick={() => setEditingBlockId(null)}
                  className="w-full bg-blue-400 hover:bg-blue-500 text-white font-black text-lg py-4 rounded-2xl shadow-[0_4px_0_0_#60a5fa] active:translate-y-1 active:shadow-none transition-all"
                >
                  Done Editing
                </button>
                <button
                  onClick={() => {
                    if (onBlockDelete) onBlockDelete(editingBlock.id);
                    setEditingBlockId(null);
                  }}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-500 font-bold text-lg py-4 rounded-2xl transition-colors"
                >
                  Delete Block
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
