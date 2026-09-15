"use client";

import React, { useState } from "react";
import {
  Shield,
  Zap,
  BarChart3,
  Code2,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Lock,
  Activity,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { HealDroidLogo } from "@/app/components/ui/HealDroidLogo";

interface HealDroidShowcaseProps {
  onOpenApp?: () => void;
  onDownloadApk?: () => void;
}

export function HealDroidShowcase({ onOpenApp }: HealDroidShowcaseProps) {
  const [activeSlide, setActiveSlide] = useState<0 | 1 | 2 | 3>(0);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [fixGuidanceOpen, setFixGuidanceOpen] = useState(true);

  const slides = [
    {
      id: 0,
      slideNumber: "01 / 04",
      tag: "Scan",
      tagIcon: Zap,
      title: "Automated 5-Stage SAST Pipeline",
      description:
        "Run end-to-end binary ingestion, manifest parsing, Dalvik bytecode decompilation, and declarative rule matching in seconds. 100% automated with zero cloud dependencies.",
      features: [
        "Full 5-stage automated scan pipeline",
        "Scored 0/100 (Grade F) across 32 findings",
        "6 Java source files decompiled in 1.57s",
      ],
    },
    {
      id: 1,
      slideNumber: "02 / 04",
      tag: "OWASP",
      tagIcon: Shield,
      title: "Comprehensive OWASP Mobile Top 10 Coverage",
      description:
        "Direct mapping across all 10 OWASP Mobile security categories with instant detection of debuggable flags, exposed AWS secrets, and insecure network listeners.",
      features: [
        "Automated M1–M10 compliance matrix",
        "4 Critical & 11 High severity findings flagged",
        "Direct file & line-number traceability",
      ],
    },
    {
      id: 2,
      slideNumber: "03 / 04",
      tag: "Score",
      tagIcon: BarChart3,
      title: "Weighted Risk Score & Severity Breakdown",
      description:
        "Deep-dive assessment metrics with standard letter grades, real-time CVSS risk deduction, and instant severity distribution across components.",
      features: [
        "Circular 25/100 Grade F security gauge",
        "Categorized into Critical, High, Medium, Low",
        "Continuous release gate readiness checks",
      ],
    },
    {
      id: 3,
      slideNumber: "04 / 04",
      tag: "Fixes",
      tagIcon: Code2,
      title: "Actionable Developer Fixes & Patch Guidance",
      description:
        "Step-by-step code remediation with drop-in Gradle & Manifest patches to resolve vulnerabilities before production release.",
      features: [
        "One-click copyable build.gradle & Java diffs",
        "Filterable search by rule, class, or OWASP ID",
        "Inline fix guidance with safe configurations",
      ],
    },
  ];

  const currentSlide = slides[activeSlide];

  return (
    <div className="w-full relative select-none">
      {/* ── SECTION HEADER: THE EXPERIENCE ── */}
      <div className="text-center max-w-3xl mx-auto px-4 sm:px-6 mb-12">
        <span className="text-[11px] font-bold tracking-[0.22em] text-stone-400 uppercase font-sans">
          THE EXPERIENCE
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-stone-900 mt-2.5">
          A quiet, powerful{" "}
          <span
            className="font-serif italic font-normal text-stone-700"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            security companion.
          </span>
        </h2>
        <p className="text-sm sm:text-base text-stone-500 mt-3 max-w-xl mx-auto leading-relaxed font-normal">
          Screens that show how HealDroid quietly fits into your mobile security workflow.
        </p>
      </div>

      {/* ── TOP SLIDE SWITCHER CONTROLS (4 SHORT TABS) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-1.5 bg-white/90 backdrop-blur-md p-1 sm:p-1.5 rounded-full border border-stone-200/80 shadow-xs overflow-x-auto no-scrollbar max-w-full">
          {slides.map((s, idx) => {
            const Icon = s.tagIcon;
            const isActive = activeSlide === idx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSlide(idx as 0 | 1 | 2 | 3)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#111827] text-white shadow-md shadow-gray-950/10 scale-100"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                }`}
              >
                <span className="font-serif italic text-xs opacity-75">{`0${idx + 1}`}</span>
                <Icon size={13} className={isActive ? "text-teal-400" : ""} />
                <span>{s.tag}</span>
              </button>
            );
          })}
        </div>

        {/* Prev / Next slide pagination buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev === 0 ? 3 : (prev - 1) as 0 | 1 | 2 | 3))}
            aria-label="Previous slide"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-serif italic text-stone-500 px-1">
            {activeSlide + 1} of 4
          </span>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev === 3 ? 0 : (prev + 1) as 0 | 1 | 2 | 3))}
            aria-label="Next slide"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── MAIN CARD CONTAINER ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-[28px] sm:rounded-[36px] md:rounded-[40px] p-5 sm:p-8 md:p-14 overflow-hidden border border-[#ECE7DF] transition-all duration-500"
          style={{
            background: "linear-gradient(180deg, #FCFBF9 0%, #F8F6F2 100%)",
            boxShadow: "0 25px 50px -12px rgba(28, 25, 23, 0.05), 0 0 1px 1px rgba(28, 25, 23, 0.03)",
          }}
        >
          {/* ── CONCENTRIC BACKGROUND RINGS ── */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none hidden md:block">
            <div className="absolute inset-0 rounded-full border border-stone-200/40" />
            <div className="absolute inset-[80px] rounded-full border border-stone-200/50" />
            <div className="absolute inset-[160px] rounded-full border border-stone-200/60" />
            <div className="absolute inset-[240px] rounded-full border border-stone-200/70" />
            <div
              className="absolute inset-[180px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(204, 251, 241, 0.25) 0%, rgba(255, 255, 255, 0) 70%)",
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center relative z-10">
            {/* ── LEFT COLUMN: FEATURE DETAILS ── */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-6">
              {/* Slide Number & Tag */}
              <div className="flex items-center gap-3">
                <span
                  className="font-serif italic text-2xl md:text-3xl text-stone-400 font-normal tracking-wide"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {currentSlide.slideNumber}
                </span>

                <div className="w-8 h-[1px] bg-stone-300/80" />

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-200 bg-white/90 text-xs font-medium text-stone-700 shadow-xs">
                  <currentSlide.tagIcon size={12} className="text-teal-600" />
                  <span>{currentSlide.tag}</span>
                </div>
              </div>

              {/* Bold Title */}
              <h3 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-[-0.03em] text-[#1A1A1A] leading-[1.15]">
                {currentSlide.title}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base lg:text-lg text-stone-500 max-w-lg leading-relaxed font-normal">
                {currentSlide.description}
              </p>

              {/* Bullet Features with Circular Outline Checkmark */}
              <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                {currentSlide.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-3 text-xs sm:text-sm text-stone-700 font-medium">
                    <div className="w-4 h-4 rounded-full border border-stone-300 flex items-center justify-center text-stone-400 text-[10px] shrink-0">
                      ✓
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT COLUMN: PHONE MOCKUP WITH ZERO SCROLLBAR ── */}
            <div className="lg:col-span-6 flex items-center justify-center relative min-h-0 sm:min-h-[600px] w-full">
              {/* ── PHONE HARDWARE FRAME (CLEAN TITANIUM IPHONE BEZEL) ── */}
              <div
                className="relative rounded-[44px] sm:rounded-[52px] p-[5px] sm:p-[6px] transition-all duration-300 w-full max-w-[320px] sm:max-w-[360px] shadow-2xl"
                style={{
                  background: "linear-gradient(145deg, #2D3139 0%, #1A1D24 50%, #0F1115 100%)",
                  boxShadow:
                    "0 35px 70px -15px rgba(20, 20, 25, 0.4), 0 15px 30px -10px rgba(20, 20, 25, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.25)",
                }}
              >
                {/* Inner Screen Bezel (Clean Thin Radius) */}
                <div
                  className="relative rounded-[38px] sm:rounded-[46px] overflow-hidden bg-[#FAF9F6] text-stone-900 flex flex-col h-[580px] sm:h-[640px]"
                  style={{
                    boxShadow: "inset 0 0 0 1.5px rgba(0, 0, 0, 0.85)",
                  }}
                >
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-2.5 sm:px-3 h-4 sm:h-5 w-20 sm:w-24 bg-black rounded-full shadow-md">
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#1e293b]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400/80 animate-pulse" />
                  </div>

                  {/* ── SCREEN 1: 1.PNG (ANALYSIS COMPLETE & PIPELINE) ── */}
                  {activeSlide === 0 && (
                    <div className="flex-1 flex flex-col justify-between pt-7 pb-2 px-3.5 overflow-y-auto no-scrollbar bg-[#F8F9FB] text-stone-900">
                      <div className="space-y-3">
                        {/* Status bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-700 font-mono">09:46</span>
                            <HealDroidLogo size={20} variant="green" />
                          </div>
                          <h3 className="text-xl font-bold text-stone-900 tracking-tight mt-1">
                            Analysis Complete
                          </h3>
                          <p className="text-[11px] font-mono text-stone-500">
                            sample_test_vulnerable_app.apk
                          </p>
                        </div>

                        {/* Card 1: Full Scan Finished */}
                        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-900">Full Scan Finished</span>
                            <span className="text-xs font-bold text-teal-600">100%</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full w-full" />
                          </div>
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-stone-500">5 of 5 stages complete</span>
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-[9px] font-semibold">
                              ✓ Score: 0/100 (32 findings)
                            </span>
                          </div>
                        </div>

                        {/* Card 2: Scan Results & Proof */}
                        <div className="p-3.5 rounded-2xl bg-white border-2 border-teal-400 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                              SCAN RESULTS & PROOF
                            </span>
                            <span className="text-[9px] font-mono bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200/60 font-medium">
                              Job: 27f8248c
                            </span>
                          </div>

                          {/* 2x2 Metrics Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-xl bg-[#F8F9FB] border border-stone-100 flex flex-col justify-between">
                              <span className="text-[9px] text-stone-400 font-medium">Security Score</span>
                              <div className="mt-1">
                                <span className="text-sm font-bold text-red-500">0 / 100</span>
                                <span className="text-[10px] font-bold text-red-500 ml-1">(Grade F)</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#F8F9FB] border border-stone-100 flex flex-col justify-between">
                              <span className="text-[9px] text-stone-400 font-medium">Vulnerabilities Found</span>
                              <p className="text-xs font-bold text-stone-900 font-mono mt-1">32 findings</p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#F8F9FB] border border-stone-100 flex flex-col justify-between">
                              <span className="text-[9px] text-stone-400 font-medium">Java Files Decompiled</span>
                              <p className="text-xs font-bold text-stone-900 font-mono mt-1">
                                6 files <span className="text-[10px] text-stone-500 font-normal">(1.57s)</span>
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[#F8F9FB] border border-stone-100 flex flex-col justify-between">
                              <span className="text-[9px] text-stone-400 font-medium">Critical / High Issues</span>
                              <p className="text-xs font-bold text-red-500 font-mono mt-1">16 issues</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={onOpenApp}
                            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20 transition-all cursor-pointer"
                          >
                            <FileCode size={13} />
                            <span>View Full Security Report</span>
                          </button>
                        </div>

                        {/* Card 3: Pipeline Stages */}
                        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-xs space-y-2">
                          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                            PIPELINE STAGES
                          </p>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[9px] font-bold">✓</div>
                                <div>
                                  <p className="text-xs font-bold text-stone-900">Ingestion</p>
                                  <p className="text-[9px] text-stone-400">Validate APK & calculate hash</p>
                                </div>
                              </div>
                              <span className="text-teal-600 text-[11px] font-bold">✓</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[9px] font-bold">✓</div>
                                <div>
                                  <p className="text-xs font-bold text-stone-900">Manifest Scan</p>
                                  <p className="text-[9px] text-stone-400">8 perms, 4 comps</p>
                                </div>
                              </div>
                              <span className="text-teal-600 text-[11px] font-bold">✓</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[9px] font-bold">✓</div>
                                <div>
                                  <p className="text-xs font-bold text-stone-900">Decompilation</p>
                                  <p className="text-[9px] text-stone-400">6 files in 1.57s</p>
                                </div>
                              </div>
                              <span className="text-teal-600 text-[11px] font-bold">✓</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Phone Bottom Dock */}
                      <div className="mt-3 p-2 rounded-2xl bg-[#18181B] text-white flex items-center justify-around text-stone-400 shadow-md">
                        <button type="button" className="p-1 hover:text-white transition-colors"><Activity size={15} className="text-teal-400" /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><Shield size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><FileCode size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><Lock size={15} /></button>
                      </div>
                    </div>
                  )}

                  {/* ── SCREEN 2: 2.PNG (OWASP MOBILE TOP 10 & TOP FINDINGS) ── */}
                  {activeSlide === 1 && (
                    <div className="flex-1 flex flex-col justify-between pt-7 pb-2 px-3.5 overflow-y-auto no-scrollbar bg-[#F8F9FB] text-stone-900">
                      <div className="space-y-3">
                        {/* Status bar */}
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-teal-700 font-mono">09:57</span>
                          <HealDroidLogo size={20} variant="green" />
                        </div>

                        {/* Card 1: OWASP Mobile Top 10 Coverage Grid */}
                        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-xs space-y-2.5">
                          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider text-center">
                            OWASP MOBILE TOP 10 COVERAGE
                          </p>

                          <div className="grid grid-cols-5 gap-1.5 text-center">
                            {[
                              { code: "M1", active: true },
                              { code: "M2", active: true },
                              { code: "M3", active: true },
                              { code: "M4", active: false },
                              { code: "M5", active: true },
                              { code: "M6", active: false },
                              { code: "M7", active: true },
                              { code: "M8", active: false },
                              { code: "M9", active: true },
                              { code: "M10", active: false },
                            ].map((m) => (
                              <div
                                key={m.code}
                                className={`py-1.5 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                                  m.active
                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : "bg-stone-50 text-stone-400 border border-stone-100"
                                }`}
                              >
                                {m.code}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Critical Alert Card */}
                        <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-start gap-2 text-rose-800">
                          <AlertTriangle size={13} className="text-rose-600 mt-0.5 shrink-0" />
                          <p className="text-[11px] leading-tight font-medium">
                            4 Critical findings require immediate remediation before release.
                          </p>
                        </div>

                        {/* High Alert Card */}
                        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-start gap-2 text-amber-900">
                          <AlertTriangle size={13} className="text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-[11px] leading-tight font-medium">
                            11 High severity issues detected across components and code.
                          </p>
                        </div>

                        {/* Top Findings List */}
                        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                              TOP FINDINGS
                            </span>
                            <span className="text-[10px] font-bold text-teal-600 hover:underline cursor-pointer">
                              View all (22) →
                            </span>
                          </div>

                          <div className="divide-y divide-stone-100">
                            {[
                              { title: "Application Is Debuggable", file: "AndroidManifest.xml", code: "M1" },
                              { title: "Hardcoded AWS Access Key", file: "src/com/test/vulnerableapp/Auth...", code: "M9" },
                              { title: "TLS/SSL Certificate Verific...", file: "src/com/test/vulnerableapp/Netw...", code: "M3" },
                              { title: "Insecure WebView with Ja...", file: "src/com/test/vulnerableapp/WebA...", code: "M1" },
                            ].map((f) => (
                              <div key={f.title} className="py-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-stone-900 truncate">{f.title}</p>
                                    <p className="text-[10px] text-stone-400 font-mono truncate">{f.file}</p>
                                  </div>
                                </div>
                                <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-mono font-bold shrink-0">
                                  {f.code}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Phone Bottom Dock */}
                      <div className="mt-3 p-2 rounded-2xl bg-[#18181B] text-white flex items-center justify-around text-stone-400 shadow-md">
                        <button type="button" className="p-1 hover:text-white transition-colors"><Activity size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><Shield size={15} className="text-teal-400" /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><FileCode size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><Lock size={15} /></button>
                      </div>
                    </div>
                  )}

                  {/* ── SCREEN 3: 3.PNG (RISK SCORE & SEVERITY BREAKDOWN) ── */}
                  {activeSlide === 2 && (
                    <div className="flex-1 flex flex-col justify-between pt-7 pb-2 px-3.5 overflow-y-auto no-scrollbar bg-[#F8F9FB] text-stone-900">
                      <div className="space-y-3">
                        {/* Status bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-700 font-mono">09:54</span>
                            <HealDroidLogo size={20} variant="green" />
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <div>
                              <p className="text-[10px] text-stone-400">Security Assessment Report</p>
                              <h3 className="text-sm font-bold text-stone-900 font-mono truncate">
                                com.android.sample_te...
                              </h3>
                              <p className="text-[10px] text-stone-500">22 findings identified</p>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200/70">
                              Standard
                            </span>
                          </div>
                        </div>

                        {/* Main Gauge & Severity Card */}
                        <div className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-xs space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            {/* Arc Gauge */}
                            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="#FEE2E2" strokeWidth="8" fill="transparent" />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="#EF4444"
                                  strokeWidth="8"
                                  strokeDasharray={251}
                                  strokeDashoffset={251 - (251 * 25) / 100}
                                  strokeLinecap="round"
                                  fill="transparent"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-xl font-bold text-stone-900 leading-none">25</span>
                                <span className="text-[8px] text-stone-400 uppercase tracking-wide mt-0.5">SCORE</span>
                                <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 text-[8px] font-bold mt-0.5">
                                  GRADE F
                                </span>
                              </div>
                            </div>

                            {/* Severity Breakdown Bar */}
                            <div className="flex-1 space-y-1.5">
                              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                                BY SEVERITY
                              </p>
                              {/* Color Bar */}
                              <div className="h-2 w-full rounded-full flex overflow-hidden">
                                <div className="bg-rose-500 w-[20%]" />
                                <div className="bg-amber-500 w-[55%]" />
                                <div className="bg-yellow-400 w-[25%]" />
                              </div>

                              <div className="space-y-0.5 text-[10px] font-medium pt-1">
                                <div className="flex items-center justify-between text-rose-600">
                                  <span>● Critical</span>
                                  <span className="font-bold">4</span>
                                </div>
                                <div className="flex items-center justify-between text-amber-600">
                                  <span>● High</span>
                                  <span className="font-bold">11</span>
                                </div>
                                <div className="flex items-center justify-between text-yellow-600">
                                  <span>● Medium</span>
                                  <span className="font-bold">7</span>
                                </div>
                                <div className="flex items-center justify-between text-stone-400">
                                  <span>● Low</span>
                                  <span className="font-bold">0</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4 Severity Badges */}
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          <div className="p-2 rounded-xl bg-white border border-stone-200/70 shadow-xs">
                            <p className="text-sm font-bold text-rose-600">4</p>
                            <p className="text-[8px] text-stone-400 uppercase font-bold">CRITICAL</p>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-stone-200/70 shadow-xs">
                            <p className="text-sm font-bold text-amber-600">11</p>
                            <p className="text-[8px] text-stone-400 uppercase font-bold">HIGH</p>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-stone-200/70 shadow-xs">
                            <p className="text-sm font-bold text-yellow-600">7</p>
                            <p className="text-[8px] text-stone-400 uppercase font-bold">MEDIUM</p>
                          </div>
                          <div className="p-2 rounded-xl bg-white border border-stone-200/70 shadow-xs">
                            <p className="text-sm font-bold text-stone-400">0</p>
                            <p className="text-[8px] text-stone-400 uppercase font-bold">LOW</p>
                          </div>
                        </div>
                      </div>

                      {/* Phone Bottom Dock */}
                      <div className="mt-3 p-2 rounded-2xl bg-[#18181B] text-white flex items-center justify-around text-stone-400 shadow-md">
                        <button type="button" className="p-1 hover:text-white transition-colors"><Activity size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><Shield size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><FileCode size={15} className="text-teal-400" /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><Lock size={15} /></button>
                      </div>
                    </div>
                  )}

                  {/* ── SCREEN 4: 4.PNG (ACTIONABLE REMEDIATION & INLINE CODE FIX) ── */}
                  {activeSlide === 3 && (
                    <div className="flex-1 flex flex-col justify-between pt-7 pb-2 px-3.5 overflow-y-auto no-scrollbar bg-[#F8F9FB] text-stone-900">
                      <div className="space-y-3">
                        {/* Status bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-700 font-mono">10:03</span>
                            <HealDroidLogo size={20} variant="green" />
                          </div>
                        </div>

                        {/* Search bar input */}
                        <div className="relative">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            placeholder="Search findings by rule, class, or OWASP.."
                            readOnly
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-[11px] text-stone-700 placeholder:text-stone-400 focus:outline-none shadow-xs"
                          />
                        </div>

                        {/* Filter pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                          {[
                            { key: "all", label: "✓ All" },
                            { key: "critical", label: "Critical" },
                            { key: "high", label: "High" },
                            { key: "medium", label: "Medium" },
                            { key: "low", label: "Low" },
                          ].map((f) => (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => setSelectedFilter(f.key as any)}
                              className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                selectedFilter === f.key
                                  ? "bg-teal-600 text-white"
                                  : "bg-white text-stone-600 border border-stone-200"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium px-1">
                          <span>22 findings matched</span>
                          <span className="flex items-center gap-1 text-stone-700 font-bold">
                            <Layers size={11} />
                            <span>Flat List</span>
                          </span>
                        </div>

                        {/* Finding 1 with Expandable Fix Guidance */}
                        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-xs space-y-2.5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                              <div>
                                <h4 className="text-xs font-bold text-stone-900">Application Is Debuggable</h4>
                                <p className="text-[10px] font-mono text-stone-400">AndroidManifest.xml</p>
                              </div>
                            </div>
                            <ChevronRight size={13} className="text-stone-400" />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-bold font-mono">
                              Critical
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-bold font-mono">
                              M1
                            </span>
                            <span className="text-[9px] font-mono text-stone-400">MANIFEST_DEBUGGABLE</span>
                          </div>

                          {/* Fix Guidance Box */}
                          <div className="rounded-xl border border-teal-100 bg-[#ECFDF5]/60 p-2.5 space-y-1.5">
                            <button
                              type="button"
                              onClick={() => setFixGuidanceOpen(!fixGuidanceOpen)}
                              className="flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline cursor-pointer"
                            >
                              <Shield size={12} className="text-teal-600" />
                              <span>{fixGuidanceOpen ? "Hide Fix Guidance" : "Show Fix Guidance"}</span>
                              <ChevronDown size={12} className={`transition-transform ${fixGuidanceOpen ? "rotate-180" : ""}`} />
                            </button>

                            {fixGuidanceOpen && (
                              <div className="space-y-1.5 pt-1 text-[10px]">
                                <p className="font-bold text-stone-800">Remediation:</p>
                                <p className="text-stone-600">
                                  Disable debuggable in production release variants in build.gradle:
                                </p>
                                <pre className="p-2 rounded-lg bg-stone-900 text-stone-100 font-mono text-[9px] overflow-x-auto">
{`android {
  buildTypes {
    release {
      debuggable false
      minifyEnabled true
    }
  }
}`}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Finding 2: Hardcoded AWS Access Key */}
                        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/70 shadow-xs space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                              <div>
                                <h4 className="text-xs font-bold text-stone-900">Hardcoded AWS Access Key</h4>
                                <p className="text-[10px] font-mono text-stone-400">src/com/test/vulnerableapp/AuthManager...</p>
                              </div>
                            </div>
                            <ChevronRight size={13} className="text-stone-400" />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-bold font-mono">
                              Critical
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-bold font-mono">
                              M9
                            </span>
                            <span className="text-[9px] font-mono text-stone-400">SECRET_AWS_KEY</span>
                          </div>
                        </div>
                      </div>

                      {/* Phone Bottom Dock */}
                      <div className="mt-3 p-2 rounded-2xl bg-[#18181B] text-white flex items-center justify-around text-stone-400 shadow-md">
                        <button type="button" className="p-1 hover:text-white transition-colors"><Activity size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><Shield size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><FileCode size={15} /></button>
                        <button type="button" className="p-1 hover:text-white transition-colors"><Lock size={15} className="text-teal-400" /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const VeilShowcase = HealDroidShowcase;
