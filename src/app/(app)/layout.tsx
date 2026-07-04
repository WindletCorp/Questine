import { BottomNav } from "@/components/layout/BottomNav";
import { GlobalAIAssistant } from "@/components/ui/GlobalAIAssistant";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-24">
        {children}
      </div>
      <BottomNav />
      <GlobalAIAssistant />
    </div>
  );
}
