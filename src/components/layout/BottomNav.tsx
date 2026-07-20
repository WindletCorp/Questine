"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Routine", href: "/routine", icon: CalendarDays },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white border-4 border-gray-200 rounded-[2rem] p-2 z-50 flex justify-between items-center shadow-[0_8px_0_0_#e5e7eb]">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center relative group"
          >
            {isActive ? (
              <div className="flex flex-col items-center justify-center -translate-y-2 transition-transform duration-300">
                <div className="bg-[#7EC8E3]/10 text-[#7EC8E3] p-3 rounded-2xl border-4 border-[#7EC8E3] shadow-[0_4px_0_0_#7EC8E3]">
                  <Icon size={24} strokeWidth={3} />
                </div>
                <span className="text-[11px] font-black mt-2 text-[#7EC8E3] tracking-wide uppercase">
                  {item.name}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-active:scale-90">
                <div className="p-3 text-gray-400 group-hover:text-gray-600 rounded-2xl transition-colors">
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-bold mt-1 text-gray-400 group-hover:text-gray-600 tracking-wide uppercase">
                  {item.name}
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
