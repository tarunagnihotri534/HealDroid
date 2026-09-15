"use client";

import React, { useState } from "react";
import {
  Shield,
  Download,
  Terminal,
  Activity,
  Lock,
  Code,
  CheckCircle2,
  FileCode,
  Zap,
  ChevronDown,
  Sparkles,
  Smartphone,
  Bell,
  ExternalLink,
} from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";
import { HealDroidShowcase } from "./VeilShowcase";
import { OwaspMatrixSection } from "./OwaspMatrixSection";
import { HealDroidLogo } from "@/app/components/ui/HealDroidLogo";

interface LandingPageProps {
  onOpenApp: () => void;
  renderAppContent: React.ReactNode;
}

export function LandingPage({ onOpenApp, renderAppContent }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadApk = () => {
    setDownloading(true);
    const link = document.createElement("a");
    link.href = "/HealDroid-v1.0.apk";
    link.download = "HealDroid-v1.0.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };



  const faqs = [
    {
      q: "How does HealDroid perform APK static analysis without requiring cloud servers?",
      a: "HealDroid uses an integrated static analysis engine featuring binary AndroidManifest.xml (AXML) decoding, Dalvik Executable (DEX) string pool extraction, and local JADX decompilation running directly in the Next.js runtime.",
    },
    {
      q: "What Android APK versions are supported?",
      a: "HealDroid supports Android APKs targeting all API levels from Android 5.0 (API 21) up to Android 15 (API 35), including multi-DEX applications and zipped source fixtures.",
    },
    {
      q: "Can I download and run the mobile application on my physical Android phone?",
      a: "Yes! Click the 'Download APK' button to download the HealDroid-v1.0.apk installer package directly, or run the React Native Expo client in the mobile/ directory.",
    },
    {
      q: "Are uploaded APKs transmitted or shared with third parties?",
      a: "No. HealDroid operates under strict offline-first sandboxing. All manifest extraction, code decompilation, and rule matching are executed locally in memory and storage with zero third-party telemetry.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* ── TOP NAVBAR (EXACT VEIL MINIMAL STYLE) ── */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <HealDroidLogo size={32} variant="green" />
            <div className="font-bold text-lg tracking-tight text-stone-900">
              <span>HealDroid</span>
            </div>
          </div>

          {/* Navigation Links: Features, OWASP Matrix, Contact, Download APK, FAQs */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <a href="#features" className="hover:text-stone-900 transition-colors">
              Features
            </a>
            <a href="#owasp" className="hover:text-stone-900 transition-colors">
              OWASP Matrix
            </a>
            <a href="/contact" className="hover:text-stone-900 transition-colors">
              Contact
            </a>
            <button
              type="button"
              onClick={handleDownloadApk}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Download APK
            </button>
            <a href="#faq" className="hover:text-stone-900 transition-colors">
              FAQs
            </a>
          </nav>

          {/* Right Action CTA */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadApk}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full border border-stone-200 hover:border-stone-300 text-stone-700 bg-white shadow-xs transition-all hover:bg-stone-50 cursor-pointer"
            >
              <Download size={13} className="text-teal-600" />
              <span>{downloading ? "Downloading..." : "Download APK"}</span>
            </button>

            <button
              type="button"
              onClick={onOpenApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full bg-[#111827] text-white hover:bg-black shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Launch Scanner</span>
              <span className="text-xs">↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION (EXACT SCREENSHOT 1 VEIL ALIGNMENT & STORYTELLING) ── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-subtle-grid">
        {/* Soft background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Pitch & Story */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Early Access Status Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-stone-200/80 text-xs font-medium text-stone-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span>Autonomous Mobile SAST · Enterprise Ready</span>
              </div>

              {/* Headline with Playfair Display Italic */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-950 leading-[1.12]">
                Secure by<br />
                design.<br />
                <span
                  className="font-serif italic font-normal text-stone-700"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Resilient by nature.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-stone-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Static security analysis engineered specifically for Android APKs. Decompile binaries, hunt OWASP Mobile Top 10 vulnerabilities, and generate compliant developer fixes. Quietly, swiftly, and entirely on your terms.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadApk}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#111827] text-white font-semibold text-sm hover:bg-black shadow-lg shadow-gray-950/15 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>{downloading ? "Downloading..." : "Download APK"}</span>
                  <span className="text-xs">↗</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-stone-700 font-medium text-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 shadow-xs transition-all cursor-pointer"
                >
                  <span>Launch Live Scanner</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-medium text-stone-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-teal-600" />
                  <span>Secure sign-in</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-teal-600" />
                  <span>Offline-first</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-teal-600" />
                  <span>Privacy-first</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Phone Mockup with 4 Floating Glass Badges */}
            <div className="lg:col-span-6 flex items-center justify-center relative">
              <PhoneMockup>
                {renderAppContent}
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: THE EXPERIENCE (EXACT SCREENSHOT 2 VEIL SHOWCASE) ── */}
      <section id="features" className="py-20 md:py-28 bg-[#FAF8F5] border-t border-stone-200/60">
        <HealDroidShowcase onOpenApp={onOpenApp} onDownloadApk={handleDownloadApk} />
      </section>

      {/* ── SECTION 3: 5-STAGE PIPELINE SHOWCASE ── */}
      <section id="pipeline" className="py-20 bg-white border-t border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-teal-600">
              STATIC ANALYSIS PIPELINE
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 mt-2">
              End-to-End Vulnerability Intelligence
            </h2>
            <p className="text-sm text-stone-500 mt-3">
              From raw APK byte streams to line-by-line developer remediation code in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FAF8F5] rounded-3xl p-7 border border-stone-200/70 shadow-xs hover:border-teal-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 shadow-xs">
                <FileCode size={24} />
              </div>
              <h3 className="text-base font-bold text-stone-900">1. Dual-Mode Manifest Parser</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Decodes binary AXML string pools and XML tags to identify exported components without permission enforcement, debuggable release flags, and legacy cleartext HTTP allowances.
              </p>
            </div>

            <div className="bg-[#FAF8F5] rounded-3xl p-7 border border-stone-200/70 shadow-xs hover:border-teal-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 shadow-xs">
                <Terminal size={24} />
              </div>
              <h3 className="text-base font-bold text-stone-900">2. Hybrid Decompiler & DEX AST</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Streams Java and Smali source trees via JADX with automatic Dalvik string extraction fallback for serverless cloud execution with zero external runtime dependencies.
              </p>
            </div>

            <div className="bg-[#FAF8F5] rounded-3xl p-7 border border-stone-200/70 shadow-xs hover:border-teal-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 shadow-xs">
                <Shield size={24} />
              </div>
              <h3 className="text-base font-bold text-stone-900">3. Weighted OWASP Risk Scoring</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Deducts weighted risk points (Critical -15, High -10, Medium -5, Low -2) to produce standard letter grades (A–F) and actionable remediation code snippets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: OWASP MATRIX (TECHNICAL HUD & AST INSPECTOR) ── */}
      <OwaspMatrixSection />

      {/* ── SECTION 5: DOWNLOAD APK HUB ── */}
      <section id="download" className="py-20 bg-white border-t border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#111827] rounded-[36px] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
              <div className="md:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950 border border-teal-800 text-teal-300 text-xs font-semibold">
                  <Sparkles size={12} />
                  <span>Direct Mobile Binary Available</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Download HealDroid for Android</h2>
                <p className="text-sm text-stone-400 max-w-lg leading-relaxed font-normal">
                  Install the mobile APK package directly on any Android device (API 21+) to run static security assessments and inspect vulnerability findings on the go.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadApk}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>{downloading ? "Downloading APK..." : "Download HealDroid-v1.0.apk"}</span>
                  </button>

                  <div className="text-xs text-stone-400 flex items-center gap-3">
                    <span>Version 1.0.0</span>
                    <span>•</span>
                    <span>Target: Android 5.0+</span>
                  </div>
                </div>
              </div>

              {/* Phone info card */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-3xl bg-stone-900/80 border border-stone-800 text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-900/50 border border-teal-700/50 flex items-center justify-center text-teal-400 mb-3">
                  <Smartphone size={32} />
                </div>
                <p className="text-xs font-bold text-stone-200">Mobile Client Ready</p>
                <p className="text-[11px] text-stone-400 mt-1">Universal React Native & Expo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: FAQ ── */}
      <section id="faq" className="py-20 bg-[#FAF8F5] border-t border-stone-200/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-teal-600">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-2">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden transition-colors shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-stone-900 hover:bg-stone-50 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`text-stone-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs text-stone-600 leading-relaxed border-t border-stone-100 bg-[#FAF8F5]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#111827] text-stone-400 py-12 border-t border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <HealDroidLogo size={28} variant="green" />
            <span className="text-white font-bold text-sm">HealDroid</span>
            <span className="text-stone-500">| Static APK Security Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#owasp" className="hover:text-white transition-colors">OWASP Matrix</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            <button
              type="button"
              onClick={handleDownloadApk}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Download APK
            </button>
            <a href="#faq" className="hover:text-white transition-colors">FAQs</a>
            <button
              type="button"
              onClick={onOpenApp}
              className="text-teal-400 hover:text-teal-300 transition-colors font-semibold cursor-pointer"
            >
              Live Scanner ↗
            </button>
          </div>

          <p className="text-stone-500">© 2026 HealDroid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
