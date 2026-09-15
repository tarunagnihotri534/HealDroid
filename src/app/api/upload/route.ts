import { NextRequest, NextResponse } from "next/server";
import { processApkBuffer } from "@/lib/analyzer/job-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { detail: "No file uploaded or invalid file format." },
        { status: 400 }
      );
    }

    const filename = (file as any).name || "app.apk";
    if (!filename.toLowerCase().endsWith(".apk") && !filename.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { detail: "Only .apk files are supported." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const job = await processApkBuffer(buffer, filename);
    return NextResponse.json(job);
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { detail: error?.message || "Failed to process APK upload." },
      { status: 500 }
    );
  }
}
