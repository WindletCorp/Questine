"use client";

import { useThemeContext } from "@/themes/provider";
import { useAuth } from "@/components/providers/auth-provider";

export default function AppPage() {
  const { theme } = useThemeContext();
  const { user } = useAuth();
  const AppHome = theme.pages.AppHome;
  
  return <AppHome userId={user?.id || "guest"} />;
}
