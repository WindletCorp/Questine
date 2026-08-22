"use client";

import { useThemeContext } from "@/themes/provider";

export default function MetricsPage() {
  const { theme } = useThemeContext();
  const Metrics = theme.pages.Metrics;
  return <Metrics userId="current-user" />;
}
