import { NextResponse } from "next/server";
import { findJadxBinary } from "@/lib/analyzer/decompiler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jadxBin = findJadxBinary();
  return NextResponse.json({
    status: "ok",
    jadx_available: jadxBin !== null,
    jadx_path: jadxBin,
    framework: "Next.js Fullstack Engine",
  });
}
