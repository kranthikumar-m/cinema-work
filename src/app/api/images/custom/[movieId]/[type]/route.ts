import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCustomImageRecord } from "@/lib/database";

interface RouteContext {
  params: { movieId: string; type: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const movieId = Number(params.movieId);
  const imageType = params.type;

  if (!Number.isFinite(movieId) || (imageType !== "poster" && imageType !== "backdrop")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const record = await getCustomImageRecord(movieId, imageType as "poster" | "backdrop");
  if (!record) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "uploads",
    "movies",
    String(movieId),
    record.file_name
  );

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = fs.readFileSync(filePath);

  return new NextResponse(file, {
    headers: {
      "Content-Type": record.mime_type,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
