"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, Shield } from "lucide-react";
import { ContactSection } from "@/app/components/landing/ContactSection";
import { HealDroidLogo } from "@/app/components/ui/HealDroidLogo";

export default function ContactPage() {
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] font-sans flex flex-col justify-between selection:bg-teal-100 selection:text-teal-900">
      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <HealDroidLogo size={32} variant="green" />
            <div className="font-bold text-lg tracking-tight text-stone-900">
              <span>HealDroid</span>
            </div>
          </Link>

          {/* Nav Items requested: Features, OWASP Matrix, Contact, Download APK, FAQs */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <Link href="/#features" className="hover:text-stone-900 transition-colors">
              Features
            </Link>
            <Link href="/#owasp" className="hover:text-stone-900 transition-colors">
              OWASP Matrix
            </Link>
            <Link href="/contact" className="text-stone-950 font-semibold transition-colors">
              Contact
            </Link>
            <button
              type="button"
              onClick={handleDownloadApk}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Download APK
            </button>
            <Link href="/#faq" className="hover:text-stone-900 transition-colors">
              FAQs
            </Link>
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

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full bg-[#111827] text-white hover:bg-black shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Launch Scanner</span>
              <span className="text-xs">↗</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex items-center justify-center">
        <ContactSection />
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#111827] text-stone-400 py-10 border-t border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <HealDroidLogo size={28} variant="green" />
            <span className="text-white font-bold text-sm">HealDroid</span>
            <span className="text-stone-500">| Static APK Security Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#owasp" className="hover:text-white transition-colors">OWASP Matrix</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/#faq" className="hover:text-white transition-colors">FAQs</Link>
          </div>

          <p className="text-stone-500">© 2026 HealDroid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
