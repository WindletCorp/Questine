"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { seedDummyData } from "@/actions/debug";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SeedButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSeed = () => {
    startTransition(async () => {
      try {
        await seedDummyData();
        toast.success("Successfully seeded dummy routine data!");
        router.refresh();
      } catch (error: any) {
        toast.error(`Failed to seed data: ${error.message}`);
      }
    });
  };

  return (
    <Button 
      type="button" 
      variant="secondary" 
      fullWidth 
      onClick={handleSeed} 
      disabled={isPending}
    >
      {isPending ? "Seeding..." : "Seed Dummy Data"}
    </Button>
  );
}
