"use client";

import { useThemeContext } from "@/themes/provider";

export default function ProfilePage() {
  const { theme } = useThemeContext();
  const Profile = theme.pages.Profile;
  return <Profile userId="current-user" />;
}
