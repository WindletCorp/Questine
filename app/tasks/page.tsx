"use client";

import { useThemeContext } from "@/themes/provider";

export default function TasksPage() {
  const { theme } = useThemeContext();
  const TaskList = theme.pages.TaskList;
  return <TaskList userId="current-user" />;
}
