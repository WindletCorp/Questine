"use client";

import { useThemeContext } from "@/themes/provider";

export default function DashboardPage() {
  const { theme } = useThemeContext();
  const Dashboard = theme.pages.Dashboard;
  return <Dashboard userId="current-user" />;
}
