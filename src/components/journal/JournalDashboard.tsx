"use client";

import { useState } from "react";
import { RoutineBlock } from "@/components/routine/RoutineViewer";
import { RoutineViewerWithToggle } from "@/components/routine/RoutineViewerWithToggle";
import { JournalLogBubble } from "@/components/ui/JournalLogBubble";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreateMetricInline } from "@/components/ui/CreateMetricInline";
import { TaskCard } from "@/components/ui/TaskCard";
import { DateSelector } from "@/components/ui/DateSelector";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  selectedDate: string;
  blocks: RoutineBlock[];
  tasks: any[];
  journalLogs: any[];
  metricLogs: any[];
};

export function JournalDashboard({ selectedDate, blocks, tasks, journalLogs, metricLogs }: Props) {
  const [activeTab, setActiveTab] = useState<'journal' | 'schedule' | 'data'>('journal');

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <DateSelector selectedDate={selectedDate} />

      {/* Tab Toggle */}
      <div className="bg-gray-100 p-2 rounded-2xl flex mx-auto border-4 border-gray-200 shadow-[0_4px_0_0_#e5e7eb] mt-2 relative">
        <button
          onClick={() => setActiveTab('journal')}
          className={`relative px-6 py-2.5 rounded-xl font-black text-sm transition-colors z-10 ${activeTab === 'journal' ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {activeTab === 'journal' && (
            <motion.div layoutId="journalTabPill" className="absolute inset-0 bg-white rounded-xl shadow-sm border-2 border-gray-200 shadow-[0_2px_0_0_#e5e7eb] -z-10" />
          )}
          Journal
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`relative px-6 py-2.5 rounded-xl font-black text-sm transition-colors z-10 ${activeTab === 'schedule' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {activeTab === 'schedule' && (
            <motion.div layoutId="journalTabPill" className="absolute inset-0 bg-white rounded-xl shadow-sm border-2 border-gray-200 shadow-[0_2px_0_0_#e5e7eb] -z-10" />
          )}
          Schedule
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`relative px-6 py-2.5 rounded-xl font-black text-sm transition-colors z-10 ${activeTab === 'data' ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {activeTab === 'data' && (
            <motion.div layoutId="journalTabPill" className="absolute inset-0 bg-white rounded-xl shadow-sm border-2 border-gray-200 shadow-[0_2px_0_0_#e5e7eb] -z-10" />
          )}
          Data
        </button>
      </div>

      {/* Content */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          
          {activeTab === 'journal' && (
            <motion.div 
              key="journal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 mt-2"
            >
              {journalLogs?.length ? journalLogs.map((log: any) => (
                <JournalLogBubble key={log.id} id={log.id} content={log.content} timestamp={log.logged_at} />
              )) : (
                <div className="text-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl mt-4">
                  <p className="text-gray-400 font-bold">No journal entries for this date.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'schedule' && (
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
                    viewDateStr={selectedDate}
                    defaultMode={blocks.some(b => b.type === 'actual') ? (blocks.some(b => b.type === 'plan') ? 'overlay' : 'actual') : 'plan'}
                    initialScrollTime="08:00"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl mt-4">
                  <p className="text-gray-400 font-bold">No routine logged on this date.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div 
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8 mt-2"
            >
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest pl-2">Metrics</h3>
                <div className="flex flex-wrap gap-4">
                  {metricLogs?.map((m: any, i: number) => {
                    const themes = ["indigo", "pink", "blue", "emerald", "orange"] as const;
                    return (
                      <MetricCard
                        key={m.id}
                        id={m.id}
                        name={m.metric_definitions?.name || "Unknown"}
                        value={m.value}
                        unit={m.metric_definitions?.unit}
                        colorTheme={themes[i % themes.length]}
                      />
                    );
                  })}
                  <CreateMetricInline dateStr={selectedDate} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest pl-2">Tasks</h3>
                <div className="flex flex-col gap-3">
                  {tasks?.length ? tasks.map((t: any) => (
                    <TaskCard
                      key={t.id}
                      id={t.id}
                      title={t.title}
                      status={t.status}
                      targetDate={t.target_date}
                      linkedBlockId={t.linked_block_id}
                      availableBlocks={blocks}
                    />
                  )) : (
                    <div className="text-gray-400 font-bold italic py-2 pl-2">No tasks logged.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
