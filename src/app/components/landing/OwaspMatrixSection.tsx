"use client";

import React, { useState } from "react";
import {
  Shield,
  Terminal,
  Code2,
  Lock,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Search,
  Copy,
  Check,
  Layers,
  Activity,
  FileCode,
} from "lucide-react";

interface OwaspRuleDetail {
  code: string;
  category: string;
  title: string;
  severity: "critical" | "high" | "medium";
  cwe: string;
  cvss: string;
  engine: string;
  target: string;
  pattern: string;
  vulnerableSnippet: string;
  compliantSnippet: string;
  description: string;
  remediationSummary: string;
}

export function OwaspMatrixSection() {
  const [selectedRule, setSelectedRule] = useState<string>("M1");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const rules: OwaspRuleDetail[] = [
    {
      code: "M1",
      category: "Improper Platform Usage",
      title: "Exported Components & Debuggable Flag",
      severity: "critical",
      cwe: "CWE-215 / CWE-926",
      cvss: "8.8",
      engine: "Binary AXML Stream Parser",
      target: "AndroidManifest.xml",
      pattern: `android:debuggable="true" | android:exported="true" (no perm)`,
      description:
        "Release binaries compiled with debuggable flags permit unauthorized JDWP debugger attachments and runtime memory inspection. Exported activities allow inter-process hijacking.",
      remediationSummary: "Enforce release variant stripping and explicit signature permissions.",
      vulnerableSnippet: `<!-- CRITICAL: JDWP Debugger & Exported Activity -->
<application 
    android:debuggable="true" 
    android:allowBackup="true">
    <activity 
        android:name=".DeepLinkActivity" 
        android:exported="true" />
</application>`,
      compliantSnippet: `// build.gradle: Strips debuggable bridge in release
android {
  buildTypes {
    release {
      debuggable false
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
    }
  }
}`,
    },
    {
      code: "M2",
      category: "Insecure Data Storage",
      title: "World-Readable Storage & Plaintext JWTs",
      severity: "high",
      cwe: "CWE-276 / CWE-312",
      cvss: "7.5",
      engine: "Dalvik Bytecode Regex & AST",
      target: "SharedPreferences / SQLite",
      pattern: `MODE_WORLD_READABLE | SQLiteDatabase.openOrCreate(null)`,
      description:
        "Sensitive user credentials, auth tokens, and session databases stored without hardware-backed encryption or configured with legacy world-readable file access permissions.",
      remediationSummary: "Migrate to Android KeyStore and EncryptedSharedPreferences.",
      vulnerableSnippet: `// VULNERABLE: Plaintext world-readable SharedPreferences
SharedPreferences prefs = context.getSharedPreferences(
    "auth_tokens", 
    Context.MODE_WORLD_READABLE
);
prefs.edit().putString("bearer_token", jwtToken).apply();`,
      compliantSnippet: `// COMPLIANT: Hardware-backed EncryptedSharedPreferences
MasterKey masterKey = new MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build();

SharedPreferences securePrefs = EncryptedSharedPreferences.create(
    context, "auth_vault", masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
);`,
    },
    {
      code: "M3",
      category: "Insecure Communication",
      title: "Cleartext HTTP & Disabled TrustManagers",
      severity: "critical",
      cwe: "CWE-295 / CWE-319",
      cvss: "9.1",
      engine: "JADX AST & NetworkConfig Parser",
      target: "res/xml/network_security_config.xml",
      pattern: `checkServerTrusted() {} | usesCleartextTraffic="true"`,
      description:
        "Custom SSL TrustManagers that skip certificate validation, empty HostnameVerifiers, or global usesCleartextTraffic allowances expose all network streams to Man-in-the-Middle (MitM) interception.",
      remediationSummary: "Enforce TLS 1.3 certificate pinning with OkHttp CertificatePinner.",
      vulnerableSnippet: `// CRITICAL: Empty TrustManager disables SSL/TLS validation
TrustManager[] trustAllCerts = new TrustManager[] {
    new X509TrustManager() {
        public void checkClientTrusted(X509Certificate[] c, String a) {}
        public void checkServerTrusted(X509Certificate[] c, String a) {} // Empty!
        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
    }
};`,
      compliantSnippet: `// COMPLIANT: OkHttp Certificate Pinning & Enforced TLS
CertificatePinner certPinner = new CertificatePinner.Builder()
    .add("api.healdroid.dev", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .build();

OkHttpClient client = new OkHttpClient.Builder()
    .certificatePinner(certPinner)
    .build();`,
    },
    {
      code: "M5",
      category: "Insufficient Cryptography",
      title: "Broken Ciphers, ECB Mode & Weak Hashing",
      severity: "high",
      cwe: "CWE-327 / CWE-328",
      cvss: "7.9",
      engine: "Bytecode Method Invocation Tracer",
      target: "javax.crypto.Cipher / MessageDigest",
      pattern: `Cipher.getInstance("DES|AES/ECB|MD5|SHA-1")`,
      description:
        "Usage of deprecated cryptographic algorithms like DES, 3DES, AES in ECB mode (deterministic ciphertext leakage), MD5 hashing for passwords, and pseudo-random PRNGs without secure seeds.",
      remediationSummary: "Use AES-256 in GCM authenticated mode and Argon2/PBKDF2 for hashes.",
      vulnerableSnippet: `// VULNERABLE: Deprecated DES cipher & deterministic ECB mode
Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
Key key = new SecretKeySpec("hardcoded".getBytes(), "DES");
cipher.init(Cipher.ENCRYPT_MODE, key);`,
      compliantSnippet: `// COMPLIANT: Authenticated AES-GCM with dynamic 12-byte IV
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);
GCMParameterSpec spec = new GCMParameterSpec(128, iv);
cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);`,
    },
    {
      code: "M7",
      category: "Client Code Quality",
      title: "Raw SQL Injections & Sensitive Logcat Dumps",
      severity: "medium",
      cwe: "CWE-89 / CWE-532",
      cvss: "6.5",
      engine: "AST Taint Analysis & CallGraph Scanner",
      target: "android.database.sqlite.SQLiteDatabase",
      pattern: `db.rawQuery("... " + userInput) | Log.d(TAG, password)`,
      description:
        "Dynamic SQL queries constructed via string concatenation permit localized SQLite injection attacks. Sensitive tokens and PII leaked via Logcat buffers accessible to third-party tools.",
      remediationSummary: "Enforce parameterized queries with selectionArgs and strip debug logs.",
      vulnerableSnippet: `// VULNERABLE: Direct SQL string concatenation
String sql = "SELECT * FROM accounts WHERE user = '" + inputUser + "'";
Cursor cursor = db.rawQuery(sql, null);

// LEAK: Sensitive tokens in standard Logcat
Log.d("AUTH", "User session token: " + sessionToken);`,
      compliantSnippet: `// COMPLIANT: Parameterized query binding
Cursor cursor = db.rawQuery(
    "SELECT * FROM accounts WHERE user = ?", 
    new String[]{ inputUser }
);
// Use Timber tree to automatically strip logs in production builds`,
    },
    {
      code: "M9",
      category: "Reverse Engineering",
      title: "Hardcoded Cloud Credentials & Private Keys",
      severity: "critical",
      cwe: "CWE-798 / CWE-200",
      cvss: "9.3",
      engine: "DEX String Pool Entropy & Regex Engine",
      target: "DEX String Table & Constants",
      pattern: `AKIA[0-9A-Z]{16} | AIza[0-9A-Za-z-_]{35} | -----BEGIN PRIVATE KEY-----`,
      description:
        "High-entropy hardcoded secrets embedded in Dalvik bytecode constants. Decompilers instantly extract AWS Access Keys, Firebase API tokens, and private RSA keys.",
      remediationSummary: "Store secrets on server backend and obtain short-lived STS tokens.",
      vulnerableSnippet: `// CRITICAL: Hardcoded AWS cloud credentials in Java class
public class AuthManager {
    public static final String AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
    public static final String AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
}`,
      compliantSnippet: `// COMPLIANT: Ephemeral STS credentials generated via secure backend
public class AuthManager {
    public void fetchSessionCredentials(Callback callback) {
        apiClient.post("/auth/sts-token", new Callback() {
            // Receives 15-minute short-lived federated STS session token
        });
    }
}`,
    },
  ];

  const filteredRules = activeFilter === "all" ? rules : rules.filter((r) => r.code.toLowerCase() === activeFilter.toLowerCase());
  const activeRuleData = rules.find((r) => r.code === selectedRule) || rules[0];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section id="owasp" className="py-20 md:py-28 bg-[#FAF8F5] relative border-t border-stone-200/60">
      {/* Background Cyber Grid Lines */}
      <div className="absolute inset-0 bg-subtle-grid pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── SECTION HEADER ── */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Top HUD Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-teal-200 shadow-xs text-xs font-mono mb-4 text-stone-700">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="font-bold text-teal-800">AST_ENGINE :: ACTIVE</span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-500">20+ STATIC DETECTION RULES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-950 leading-[1.15]">
            Engineered for{" "}
            <span
              className="font-serif italic font-normal text-stone-700"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              OWASP Mobile Top 10.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-stone-500 mt-3.5 max-w-2xl mx-auto leading-relaxed font-normal">
            Autonomous static rules map directly to standard mobile risk vectors with AST decompilation, bytecode entropy detection, and verified remediation diffs.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-6 overflow-x-auto no-scrollbar max-w-full justify-start sm:justify-center px-1 py-1">
            {[
              { key: "all", label: "All Vectors (6)" },
              { key: "m1", label: "M1: Platform" },
              { key: "m2", label: "M2: Storage" },
              { key: "m3", label: "M3: Network" },
              { key: "m5", label: "M5: Crypto" },
              { key: "m7", label: "M7: Code Quality" },
              { key: "m9", label: "M9: Secrets" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setActiveFilter(f.key);
                  if (f.key !== "all") setSelectedRule(f.key.toUpperCase());
                }}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  activeFilter === f.key
                    ? "bg-[#111827] text-white shadow-sm"
                    : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:text-stone-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TECHNICAL SPLIT LAYOUT: GRID OF CARDS + INTERACTIVE AST TERMINAL ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Vector Cards */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between px-1 text-xs font-mono text-stone-500 font-semibold uppercase tracking-wider">
              <span>SECURITY VECTORS</span>
              <span>CLICK TO INSPECT AST</span>
            </div>

            {filteredRules.map((rule) => {
              const isSelected = selectedRule === rule.code;
              return (
                <div
                  key={rule.code}
                  onClick={() => setSelectedRule(rule.code)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-white border-teal-500 shadow-md ring-2 ring-teal-500/15"
                      : "bg-white/80 border-stone-200/80 hover:border-stone-300 hover:bg-white shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                          rule.severity === "critical"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : rule.severity === "high"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-teal-50 text-teal-800 border border-teal-200"
                        }`}
                      >
                        {rule.code}
                      </span>
                      <span className="text-[11px] font-mono text-stone-400 font-medium">
                        {rule.cwe}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                        rule.severity === "critical"
                          ? "bg-rose-100/70 text-rose-800"
                          : "bg-amber-100/70 text-amber-800"
                      }`}
                    >
                      {rule.severity} · CVSS {rule.cvss}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center justify-between">
                    <span>{rule.title}</span>
                    <ChevronRight
                      size={14}
                      className={`text-stone-400 transition-transform ${
                        isSelected ? "translate-x-1 text-teal-600" : ""
                      }`}
                    />
                  </h3>

                  <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                    {rule.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono text-stone-400">
                    <span className="truncate max-w-[200px] sm:max-w-[220px]">Target: {rule.target}</span>
                    <span className="text-teal-600 font-semibold">{isSelected ? "● Inspected" : "Inspect →"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Cybersecurity AST Inspector Terminal (Follows Scroll from M1 to M9) */}
          <div className="lg:col-span-7 lg:sticky lg:top-20 self-start z-30">
            <div className="rounded-2xl sm:rounded-3xl bg-[#0F141C] text-stone-100 border border-slate-800 shadow-2xl overflow-hidden">
              {/* Terminal Window Header */}
              <div className="bg-[#181E29] px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 ml-1 sm:ml-2 truncate max-w-[200px] sm:max-w-none">
                    healdroid_ast_inspector :: {activeRuleData.code.toLowerCase()}_detector.ts
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] font-mono bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800">
                    ENGINE: {activeRuleData.engine}
                  </span>
                </div>
              </div>

              {/* Terminal Telemetry Body */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* Meta Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl bg-[#141923] border border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block">OWASP CATEGORY</span>
                    <span className="text-teal-400 font-bold text-[11px] sm:text-xs">{activeRuleData.code}: {activeRuleData.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block">CWE WEAKNESS</span>
                    <span className="text-slate-200 font-bold text-[11px] sm:text-xs">{activeRuleData.cwe}</span>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block">SEVERITY IMPACT</span>
                    <span className="text-rose-400 font-bold text-[11px] sm:text-xs">{activeRuleData.severity.toUpperCase()} ({activeRuleData.cvss})</span>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block">MATCH LATENCY</span>
                    <span className="text-emerald-400 font-bold text-[11px] sm:text-xs">~0.42 ms</span>
                  </div>
                </div>

                {/* Pattern Signature */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-teal-400" />
                      <span>AST SEARCH PATTERN & SIGNATURE</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500">TARGET: {activeRuleData.target}</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-lg bg-[#0B0E14] border border-slate-800 text-teal-300 text-[10px] sm:text-[11px] overflow-x-auto">
                    <code>{activeRuleData.pattern}</code>
                  </div>
                </div>

                {/* Vulnerable Code Finding */}
                <div className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                    <span className="text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle size={12} />
                      <span>DETECTED VULNERABILITY (SAMPLE AST)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(activeRuleData.vulnerableSnippet, "vuln")}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      {copiedCode === "vuln" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedCode === "vuln" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 sm:p-3 rounded-xl bg-[#090C10] border border-rose-950/60 text-slate-200 text-[10px] sm:text-[11px] overflow-x-auto leading-relaxed">
                    <code>{activeRuleData.vulnerableSnippet}</code>
                  </pre>
                </div>

                {/* Verified Fix Guidance */}
                <div className="space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      <span>ACTIONABLE REMEDIATION PATCH</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(activeRuleData.compliantSnippet, "fix")}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      {copiedCode === "fix" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedCode === "fix" ? "Copied" : "Copy Patch"}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 sm:p-3 rounded-xl bg-[#090C10] border border-teal-950/60 text-slate-200 text-[10px] sm:text-[11px] overflow-x-auto leading-relaxed">
                    <code>{activeRuleData.compliantSnippet}</code>
                  </pre>
                </div>
              </div>

              {/* Terminal Bottom Status Bar */}
              <div className="bg-[#141923] px-5 py-2.5 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>Rule definition verified against OWASP Mobile Top 10 (2024 Release)</span>
                </span>
                <span className="text-slate-500">HealDroid Core Engine v2.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
