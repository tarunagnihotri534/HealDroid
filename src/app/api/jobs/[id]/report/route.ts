import { NextRequest, NextResponse } from "next/server";
import { getJobReport } from "@/lib/analyzer/job-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const report = getJobReport(jobId);

  if (!report) {
    return NextResponse.json(
      { detail: "Job not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(report);
}
