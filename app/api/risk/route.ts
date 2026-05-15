import { NextResponse } from "next/server";
import { getWard } from "@/lib/wards";
import { wardIdForPoint } from "@/lib/geocode";

export function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "lat and lon required" },
      { status: 400 },
    );
  }
  const id = wardIdForPoint(lat, lon);
  if (!id) {
    return NextResponse.json({ ward: null, outsideMumbai: true });
  }
  const ward = getWard(id);
  return NextResponse.json({ ward: ward ?? null, outsideMumbai: false });
}
