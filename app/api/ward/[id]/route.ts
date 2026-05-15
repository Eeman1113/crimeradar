import { NextResponse } from "next/server";
import { getWard } from "@/lib/wards";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return params.then((p) => {
    const ward = getWard(decodeURIComponent(p.id));
    if (!ward) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ward });
  });
}
