'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Edit3 } from 'lucide-react';

export type RoutineBlockSource = 'ai' | 'manual';

export interface RoutineBlock {
  id: string;
  start_time: string; // "HH:mm" or "HH:mm:ss"
  end_time: string;
  label: string;
  source: RoutineBlockSource;
  order_index?: number;
}

interface RoutineViewerProps {
  blocks: RoutineBlock[];
  readOnly?: boolean;
  onBlockUpdate?: (updatedBlock: RoutineBlock) => void;
  onBlockAdd?: (newBlock: Omit<RoutineBlock, 'id'>) => void;
  onBlockDelete?: (blockId: string) => void;
  className?: string;
}

const PIXELS_PER_MINUTE = 2; 
const HOUR_HEIGHT = 60 * PIXELS_PER_MINUTE; // 120px per hour
const TOTAL_HOURS = 24;

// Helper to convert "HH:mm" to minutes since midnight
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Helper to convert minutes to "HH:mm"
const minutesToTime = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Helper to format "HH:mm" for display (e.g. "8:00 AM")
const formatDisplayTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = (minutes || 0).toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
};

export function RoutineViewer({
  blocks,
  readOnly = false,
  onBlockUpdate,
  onBlockAdd,
  onBlockDelete,
  className
}: RoutineViewerProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  // Generate grid hours
  const hoursGrid = Array.from({ length: TOTAL_HOURS }).map((_, i) => i);

  // Parse blocks into renderable items
  const renderableBlocks = useMemo(() => {
    return blocks.map(block => {
      const startMin = timeToMinutes(block.start_time);
      const endMin = timeToMinutes(block.end_time);
      const duration = endMin - startMin;
      
      return {
        ...block,
        top: startMin * PIXELS_PER_MINUTE,
        height: duration * PIXELS_PER_MINUTE,
        startMin,
        duration
      };
    });
  }, [blocks]);

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    // Simple add logic based on click position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedMinute = Math.floor(y / PIXELS_PER_MINUTE);
    
    // Snap to 15 min intervals
    const snappedMinute = Math.floor(clickedMinute / 15) * 15;
    const start_time = minutesToTime(snappedMinute);
    const end_time = minutesToTime(snappedMinute + 60); // default 1 hour block
    
    if (onBlockAdd) {
      onBlockAdd({
        start_time,
        end_time,
        label: 'New Routine Block',
        source: 'manual'
      });
    }
  };

  const handleBlockClick = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    if (readOnly) return;
    setEditingBlockId(blockId);
  };

  const editingBlock = blocks.find(b => b.id === editingBlockId);

  return (
    <div className={cn('relative w-full h-[50vh] min-h-[400px] overflow-y-auto bg-gray-50 rounded-3xl border-4 border-gray-200 hide-scrollbar', className)}>
      
      {/* Read Only Overlay Badge */}
      {readOnly && (
        <div className="sticky top-4 z-20 flex justify-center w-full pointer-events-none">
          <div className="bg-gray-800/80 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
            <Lock size={16} /> Locked Plan
          </div>
        </div>
      )}

      <div className="relative min-w-[300px] select-none" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
        
        {/* Time Grid Axis */}
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

        {/* Grid Lines & Clickable Area */}
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

        {/* Render Blocks */}
        <div className="absolute left-16 right-0 top-0 bottom-0 px-2 pt-0 z-10 pointer-events-none">
          <AnimatePresence>
            {renderableBlocks.map(block => (
              <motion.div
                key={block.id}
                layoutId={block.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "absolute left-2 right-2 rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-sm transition-opacity",
                  !readOnly && "pointer-events-auto cursor-pointer hover:shadow-md active:scale-[0.98]",
                  readOnly && "pointer-events-none opacity-90",
                  block.source === 'ai' 
                    ? "bg-blue-100 border-2 border-blue-200 text-blue-900" 
                    : "bg-pink-100 border-2 border-pink-200 text-pink-900"
                )}
                style={{ 
                  top: `${block.top}px`, 
                  height: `${block.height}px`,
                  // Add a chunky shadow dynamically matching the color
                  boxShadow: !readOnly ? `0 4px 0 0 ${block.source === 'ai' ? '#bfdbfe' : '#fbcfe8'}` : 'none'
                }}
                onClick={(e) => handleBlockClick(e, block.id)}
              >
                <div>
                  <div className="font-bold text-sm leading-tight line-clamp-2">{block.label}</div>
                  <div className={cn(
                    "text-xs font-semibold mt-1",
                    block.source === 'ai' ? "text-blue-500" : "text-pink-500"
                  )}>
                    {formatDisplayTime(block.start_time)} - {formatDisplayTime(block.end_time)}
                  </div>
                </div>
                {!readOnly && (
                  <div className="absolute bottom-2 right-2 opacity-50">
                    <Edit3 size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Full Screen Edit Modal (Simplified for now, can be expanded) */}
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
                      value={editingBlock.start_time.substring(0, 5)}
                      onChange={(e) => {
                        if (onBlockUpdate) onBlockUpdate({ ...editingBlock, start_time: e.target.value + ":00" });
                      }}
                      className="w-full text-lg font-bold bg-gray-50 border-4 border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">End Time</label>
                    <input 
                      type="time" 
                      value={editingBlock.end_time.substring(0, 5)}
                      onChange={(e) => {
                        if (onBlockUpdate) onBlockUpdate({ ...editingBlock, end_time: e.target.value + ":00" });
                      }}
                      className="w-full text-lg font-bold bg-gray-50 border-4 border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                    />
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
