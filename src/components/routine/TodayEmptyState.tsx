"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function TodayEmptyState() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("byok_api_key");
    setHasKey(!!key);
  }, []);

  if (hasKey === null) {
    return (
      <div className="bg-blue-50 p-8 rounded-3xl border-2 border-blue-200 text-center flex flex-col gap-6 shadow-[0_4px_0_0_rgba(191,219,254,1)] animate-pulse">
        <div className="h-8 bg-blue-200/50 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-blue-200/50 rounded w-3/4 mx-auto" />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="bg-pink-50 p-8 rounded-3xl border-2 border-pink-200 text-center flex flex-col gap-6 shadow-[0_4px_0_0_rgba(244,114,182,1)]">
        <div>
          <h2 className="text-2xl font-black text-pink-900 mb-2">No AI Key Set!</h2>
          <p className="text-pink-700 font-bold">You need to set up your AI API Key in settings before building routines.</p>
        </div>
        <a href="/profile" className="mx-auto">
          <Button type="button" variant="primary">
            Go to Settings
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 p-8 rounded-3xl border-2 border-blue-200 text-center flex flex-col gap-6 shadow-[0_4px_0_0_rgba(191,219,254,1)]">
      <div>
        <h2 className="text-2xl font-black text-blue-900 mb-2">Ready to build?</h2>
        <p className="text-blue-700 font-bold">Let's craft your perfect day using AI.</p>
      </div>
      <a href="/generate" className="mx-auto">
        <Button type="button" variant="primary">
          Generate Today's Routine
        </Button>
      </a>
    </div>
  );
}
