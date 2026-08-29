import React from "react";
import type { Task, RoutineBlock, Journal, UserStats, UserSettings, ShopItem, UserInventoryItem } from "@/lib/db/types";

export interface DashboardPageProps { userId: string; }
export interface AppHomePageProps { userId: string; }
export interface TaskListPageProps { userId: string; }
export interface TaskDetailPageProps { userId: string; }
export interface JournalPageProps { userId: string; }
export interface RoutinesPageProps { userId: string; }
export interface MetricsPageProps { userId: string; }
export interface ProfilePageProps { userId: string; }
export interface SettingsPageProps { userId: string; }
export interface ShopPageProps { userId: string; }
export interface TestLabPageProps { userId: string; }

export interface AppShellProps {
  children: React.ReactNode;
}

export interface ThemeContract {
  id: string;
  pages: {
    Dashboard: React.ComponentType<DashboardPageProps>;
    AppHome: React.ComponentType<AppHomePageProps>;
    TaskList: React.ComponentType<TaskListPageProps>;
    TaskDetail: React.ComponentType<TaskDetailPageProps>;
    Journal: React.ComponentType<JournalPageProps>;
    Routines: React.ComponentType<RoutinesPageProps>;
    Metrics: React.ComponentType<MetricsPageProps>;
    Profile: React.ComponentType<ProfilePageProps>;
    Settings: React.ComponentType<SettingsPageProps>;
    Shop: React.ComponentType<ShopPageProps>;
    TestLab: React.ComponentType<TestLabPageProps>;
  };
  shell: {
    AppShell: React.ComponentType<AppShellProps>;
    LoadingState: React.ComponentType;
  };
}
