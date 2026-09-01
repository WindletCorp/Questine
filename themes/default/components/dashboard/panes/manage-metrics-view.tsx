"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowLeft, Settings2, Activity } from "lucide-react";
import { 
  getLocalAvailableMetrics, 
  getLocalUserSubscriptions, 
  subscribeLocal, 
  unsubscribeLocal,
  createLocalCustomMetric 
} from "@/lib/local-db/metrics";
import type { LocalMetricDefinition } from "@/lib/local-db";

interface ManageMetricsViewProps {
  userId: string;
  onBack: () => void;
}

type ViewState = "list" | "create";

export function ManageMetricsView({ userId, onBack }: ManageMetricsViewProps) {
  const [viewState, setViewState] = useState<ViewState>("list");
  
  // Data State
  const [availableMetrics, setAvailableMetrics] = useState<LocalMetricDefinition[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("number");
  const [newPolarity, setNewPolarity] = useState("positive");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const createInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewState === "create" && window.matchMedia("(min-width: 768px)").matches) {
      setTimeout(() => createInputRef.current?.focus(), 100);
    }
  }, [viewState]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, subsRes] = await Promise.all([
        getLocalAvailableMetrics(userId),
        getLocalUserSubscriptions(userId, true) // Active only
      ]);

      if (metricsRes.data) {
        setAvailableMetrics(metricsRes.data);
      }
      if (subsRes.data) {
        setSubscribedIds(new Set(subsRes.data.map(sub => sub.metric_id)));
      }
    } catch (err) {
      console.error("Failed to load metrics for management", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleToggleSubscription = async (metricId: string) => {
    // Optimistic UI update
    const isSubscribed = subscribedIds.has(metricId);
    setSubscribedIds(prev => {
      const next = new Set(prev);
      if (isSubscribed) next.delete(metricId);
      else next.add(metricId);
      return next;
    });

    try {
      if (isSubscribed) {
        await unsubscribeLocal(userId, metricId);
      } else {
        await subscribeLocal(userId, metricId);
      }
    } catch (err) {
      console.error("Failed to toggle subscription:", err);
      // Revert on failure
      loadData();
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await createLocalCustomMetric(userId, newName.trim(), newType, newPolarity);
      if (res.data) {
        // Add to local state optimistically
        setAvailableMetrics(prev => [...prev, res.data]);
        setSubscribedIds(prev => {
          const next = new Set(prev);
          next.add(res.data.id);
          return next;
        });
        
        // Reset and go back to list
        setNewName("");
        setViewState("list");
      }
    } catch (err) {
      console.error("Failed to create custom metric", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grouping
  const activeMetrics = useMemo(() => 
    availableMetrics.filter(m => 
      subscribedIds.has(m.id) && 
      m.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    ),
  [availableMetrics, subscribedIds, debouncedQuery]);

  const inactiveMetrics = useMemo(() => 
    availableMetrics.filter(m => 
      !subscribedIds.has(m.id) && 
      m.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    ),
  [availableMetrics, subscribedIds, debouncedQuery]);

  return (
    <div className="flex flex-col gap-3.5 w-full min-h-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/12">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => viewState === "create" ? setViewState("list") : onBack()}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-white/80 font-semibold">
            <Settings2 className="w-3 h-3 text-purple-300" />
            <span>{viewState === "list" ? "Manage Metrics" : "New Custom Metric"}</span>
          </div>
        </div>
        
        {viewState === "list" && (
          <button
            onClick={() => setViewState("create")}
            className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 hover:bg-purple-500/40 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Create
          </button>
        )}
      </div>

      {/* Main Content Area (Morphing inner views) */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {viewState === "list" ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-20 text-white/30 text-xs">Loading...</div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="flex px-1 mb-2">
                    <input
                      type="text"
                      placeholder="Search metrics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-purple-400 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
                    />
                  </div>

                  {/* Subscribed Metrics Section */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[10px] font-mono uppercase text-white/40 tracking-wider pl-1">Active Subscriptions</h3>
                    {activeMetrics.length === 0 ? (
                      <p className="text-xs text-white/30 pl-1 italic">No active metrics.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {activeMetrics.map(metric => (
                          <div key={metric.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-purple-500/20">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Activity className="w-3 h-3 text-purple-300" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">{metric.name}</span>
                                <span className="text-[10px] text-white/40 capitalize">{metric.type} • {metric.polarity}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleSubscription(metric.id)}
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-white/70 text-xs transition-all cursor-pointer font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available Metrics Section */}
                  <div className="flex flex-col gap-2 mt-2">
                    <h3 className="text-[10px] font-mono uppercase text-white/40 tracking-wider pl-1">Available to Track</h3>
                    {inactiveMetrics.length === 0 ? (
                      <p className="text-xs text-white/30 pl-1 italic">No more metrics available.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {inactiveMetrics.map(metric => (
                          <div key={metric.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all">
                            <div className="flex items-center gap-2.5 opacity-60">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                <Activity className="w-3 h-3 text-white/40" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">{metric.name}</span>
                                <span className="text-[10px] text-white/40 capitalize">{metric.type} • {metric.polarity}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleSubscription(metric.id)}
                              className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 text-xs transition-all cursor-pointer font-medium flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="create-view"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleCreateCustom} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider pl-1">Metric Name</label>
                  <input
                    type="text"
                    required
                    ref={createInputRef}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., Deep Work Hours, Pages Read"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-purple-400 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider pl-1">Type</label>
                    <div className="flex bg-white/[0.04] border border-white/10 rounded-xl p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
                      {["number", "boolean", "currency"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewType(t)}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                            newType === t
                              ? "bg-purple-500/80 text-white shadow-sm border border-purple-400/50"
                              : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider pl-1">Polarity</label>
                    <div className="flex bg-white/[0.04] border border-white/10 rounded-xl p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
                      {[
                        { id: "positive", label: "Positive (+)" },
                        { id: "negative", label: "Negative (-)" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewPolarity(p.id)}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            newPolarity === p.id
                              ? "bg-purple-500/80 text-white shadow-sm border border-purple-400/50"
                              : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 mt-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200/80 leading-relaxed">
                  Custom metrics are private to you. They will be added to your active subscriptions immediately upon creation.
                </div>

                <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewState("list")}
                    className="px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-white/60 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newName.trim()}
                    className="px-4 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create Metric"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
