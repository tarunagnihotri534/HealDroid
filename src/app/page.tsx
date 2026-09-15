"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { LandingPage } from "@/app/components/landing/LandingPage";
import { Download, ArrowLeft, Shield } from "lucide-react";
import { HealDroidLogo } from "@/app/components/ui/HealDroidLogo";

// Dynamic import with SSR false ensures client-side only libraries (canvas-confetti, react-dnd)
// mount smoothly without hydration mismatches.
const App = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-[#F8F9FB] text-gray-500">
      <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mb-3" />
      <p className="text-xs font-medium">Initializing HealDroid Engine...</p>
    </div>
  ),
});

export default function Page() {
  const [viewMode, setViewMode] = useState<"landing" | "app">("landing");

  const handleDownloadApk = () => {
    const link = document.createElement("a");
    link.href = "/HealDroid-v1.0.apk";
    link.download = "HealDroid-v1.0.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewMode === "app") {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col">
        {/* Top Fullscreen Bar */}
        <div className="bg-gray-950 text-white px-4 py-2.5 flex items-center justify-between border-b border-gray-800 z-50">
          <button
            type="button"
            onClick={() => setViewMode("landing")}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Product Overview</span>
          </button>

          <div className="flex items-center gap-2">
            <HealDroidLogo size={24} variant="green" />
            <span className="text-xs font-bold text-gray-200 hidden sm:inline">HealDroid SAST Scanner</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadApk}
            className="flex items-center gap-1.5 text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-all shadow-sm shadow-teal-600/20 cursor-pointer"
          >
            <Download size={13} />
            <span>Download APK</span>
          </button>
        </div>

        {/* Fullscreen Scanner App */}
        <div className="flex-1">
          <App embedded={false} onBackToLanding={() => setViewMode("landing")} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFDFE]">
      <LandingPage
        onOpenApp={() => setViewMode("app")}
        renderAppContent={<App embedded={true} />}
      />
    </main>
  );
}

