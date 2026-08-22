"use client";

import { useThemeContext } from "@/themes/provider";

export default function JournalPage() {
  const { theme } = useThemeContext();
  const Journal = theme.pages.Journal;
  return <Journal userId="current-user" />;
}
