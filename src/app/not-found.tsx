import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2F4F8] text-[#101828]">
      <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-[#667085] mb-4">The requested page could not be found.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#13B8A6] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
