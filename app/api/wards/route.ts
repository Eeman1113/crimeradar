import { NextResponse } from "next/server";
import { listWards } from "@/lib/wards";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ wards: listWards() });
}
