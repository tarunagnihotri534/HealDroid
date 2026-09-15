"use client";

import React from "react";
import { Shield, Lock, Activity, Sparkles, CheckCircle2 } from "lucide-react";

interface PhoneMockupProps {
  children: React.ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="relative mx-auto flex items-center justify-center p-0 sm:p-2 md:p-4 select-none w-full max-w-[320px] sm:max-w-[345px] md:max-w-[355px]">
      {/* ── SMARTPHONE BEZEL SHELL (CLEAN TITANIUM IPHONE BEZEL) ── */}
      <div
        className="relative rounded-[40px] sm:rounded-[46px] p-[5px] sm:p-[6px] transition-all duration-300 shadow-2xl w-full"
        style={{
          background: "linear-gradient(145deg, #2D3139 0%, #1A1D24 50%, #0F1115 100%)",
          boxShadow: `
            0 25px 60px -15px rgba(15, 23, 42, 0.35),
            0 12px 25px -10px rgba(15, 23, 42, 0.2),
            inset 0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 1px 3px rgba(255, 255, 255, 0.25)
          `,
        }}
      >
        {/* Screen Bezel Inset (Clean Thin Radius) */}
        <div
          className="relative rounded-[34px] sm:rounded-[40px] overflow-hidden bg-slate-900 h-[500px] sm:h-[540px] md:h-[575px]"
          style={{
            boxShadow: "inset 0 0 0 1.5px rgba(0, 0, 0, 0.85)",
          }}
        >
          {/* Dynamic Island / Camera Notch */}
          <div className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-2.5 sm:px-3 h-4 sm:h-4.5 w-20 sm:w-22 bg-black rounded-full shadow-md">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#111827] flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#1e293b]" />
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          </div>

          {/* Glass glare reflection overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-40"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 45%)",
            }}
          />

          {/* Phone Screen App Container */}
          <div className="w-full h-full overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
