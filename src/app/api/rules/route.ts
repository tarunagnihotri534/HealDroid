import { NextResponse } from "next/server";
import { RULE_DEFINITIONS } from "@/lib/analyzer/rules-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(RULE_DEFINITIONS);
}
