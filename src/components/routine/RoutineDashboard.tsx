"use client";

import { useState } from "react";
import { RoutineBlock } from "@/components/routine/RoutineViewer";
import { RoutineViewerWithToggle } from "@/components/routine/RoutineViewerWithToggle";
import { TodayEmptyState } from "@/components/routine/TodayEmptyState";
import { TaskCard } from "@/components/ui/TaskCard";
import { CreateTaskInline } from "@/components/ui/CreateTaskInline";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  blocks: RoutineBlock[];
  tasks: any[];
  todayStr: string;
};

export function RoutineDashboard({ blocks, tasks, todayStr }: Props) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tab Toggle */}
      <div className="bg-gray-100 p-2 rounded-2xl flex mx-auto border-4 border-gray-200 shadow-[0_4px_0_0_#e5e7eb] mt-6 relative">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`relative px-8 py-2.5 rounded-xl font-black text-sm transition-colors z-10 ${activeTab === 'schedule' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {activeTab === 'schedule' && (
            <motion.div layoutId="routineTabPill" className="absolute inset-0 bg-white rounded-xl shadow-sm border-2 border-gray-200 shadow-[0_2px_0_0_#e5e7eb] -z-10" />
          )}
          Schedule
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`relative px-8 py-2.5 rounded-xl font-black text-sm transition-colors z-10 ${activeTab === 'tasks' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {activeTab === 'tasks' && (
            <motion.div layoutId="routineTabPill" className="absolute inset-0 bg-white rounded-xl shadow-sm border-2 border-gray-200 shadow-[0_2px_0_0_#e5e7eb] -z-10" />
          )}
          Tasks
        </button>
      </div>

      {/* Content */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'schedule' ? (
            <motion.div 
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {blocks.length > 0 ? (
                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden">
                  <RoutineViewerWithToggle 
                    blocks={blocks} 
                    viewDateStr={todayStr}
                    defaultMode={blocks.some(b => b.type === 'actual') ? (blocks.some(b => b.type === 'plan') ? 'overlay' : 'actual') : 'plan'}
                    initialScrollTime="current"
                  />
                </div>
              ) : (
                <TodayEmptyState />
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 mt-2"
            >
              {tasks?.map((t: any) => (
                <TaskCard 
                  key={t.id} 
                  id={t.id} 
                  title={t.title} 
                  status={t.status} 
                  targetDate={t.target_date} 
                  linkedBlockId={t.linked_block_id}
                  availableBlocks={blocks}
                />
              ))}
              <CreateTaskInline dateStr={todayStr} availableBlocks={blocks} />
              {tasks.length === 0 && (
                <div className="text-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl mt-4">
                  <p className="text-gray-400 font-bold">No tasks on your plate for today.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
