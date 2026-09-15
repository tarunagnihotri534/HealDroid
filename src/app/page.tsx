"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR false ensures client-side only libraries (e.g. canvas-confetti, react-dnd)
// mount smoothly without hydration mismatches.
const App = dynamic(() => import("./App"), { ssr: false });

export default function Page() {
  return (
    <main className="min-h-screen">
      <App />
    </main>
  );
}
