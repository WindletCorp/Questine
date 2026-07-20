"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleTaskStatus, updateTaskDetails, deleteTask, createTask, createMetric, updateMetricValue } from "@/app/actions/updateSummaryData";

export function useToggleTaskMutation(dateStr: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: "pending" | "completed" }) => 
      toggleTaskStatus(taskId, newStatus),
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', dateStr] });
      
      const previousTasks = queryClient.getQueryData(['tasks', dateStr]);
      
      queryClient.setQueryData(['tasks', dateStr], (old: any[]) => {
        if (!old) return old;
        return old.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null } 
            : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', dateStr], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', dateStr] });
    },
  });
}

export function useDeleteTaskMutation(dateStr: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', dateStr] });
      const previousTasks = queryClient.getQueryData(['tasks', dateStr]);
      
      queryClient.setQueryData(['tasks', dateStr], (old: any[]) => {
        if (!old) return old;
        return old.filter(task => task.id !== taskId);
      });
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', dateStr], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', dateStr] });
    },
  });
}

export function useCreateTaskMutation(dateStr: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, targetDate, linkedBlockId }: { title: string, targetDate?: string, linkedBlockId?: string }) => 
      createTask(title, targetDate, linkedBlockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', dateStr] });
    },
  });
}

export function useUpdateTaskMutation(dateStr: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string, updates: any }) => 
      updateTaskDetails(taskId, updates),
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', dateStr] });
      const previousTasks = queryClient.getQueryData(['tasks', dateStr]);
      
      queryClient.setQueryData(['tasks', dateStr], (old: any[]) => {
        if (!old) return old;
        return old.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', dateStr], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', dateStr] });
    },
  });
}

export function useCreateMetricMutation(dateStr: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, value, unit }: { name: string, value: number, unit?: string }) => 
      createMetric(name, value, unit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metric_logs', dateStr] });
    },
  });
}

export function useUpdateMetricMutation(dateStr: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ logId, value }: { logId: string, value: number }) => 
      updateMetricValue(logId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metric_logs', dateStr] });
    },
  });
}
