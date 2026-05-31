import { NextResponse } from "next/server";
import { serviceStatus } from "@/lib/env";

export async function GET() {
  return NextResponse.json({ ok: true, services: serviceStatus() });
}
