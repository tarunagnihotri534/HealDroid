import type { Metadata, Viewport } from "next";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "HealDroid - APK Security Assessment & Vulnerability Scanner",
  description: "Static security analysis engine for Android APKs featuring decompilation, vulnerability detection, and OWASP compliance reporting.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
