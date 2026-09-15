import { NextResponse } from "next/server";
import rawRules from "@/lib/analyzer/rules.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(rawRules);
}
