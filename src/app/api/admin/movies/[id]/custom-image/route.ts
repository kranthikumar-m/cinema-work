import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-api";
import {
  upsertCustomImageRecord,
  deleteCustomImageRecord,
  getCustomImageRecord,
} from "@/lib/database";

interface RouteContext {
  params: { id: string };
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getUploadsDir(movieId: number) {
  return path.join(process.cwd(), "data", "uploads", "movies", String(movieId));
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const imageType = formData.get("imageType") as string;
    const file = formData.get("file") as File | null;

    if (imageType !== "poster" && imageType !== "backdrop") {
      return NextResponse.json(
        { error: "imageType must be 'poster' or 'backdrop'." },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10 MB limit." },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are accepted." },
        { status: 400 }
      );
    }

    const uploadsDir = getUploadsDir(movieId);
    fs.mkdirSync(uploadsDir, { recursive: true });

    const existing = await getCustomImageRecord(movieId, imageType);
    if (existing) {
      const oldPath = path.join(uploadsDir, existing.file_name);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const fileName = `${imageType}${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const record = await upsertCustomImageRecord({
      movieId,
      imageType,
      fileName,
      mimeType: file.type,
      uploadedByUserId: auth.user.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await requireAdminApiUser(["admin", "editor"]);
  if (auth.response) return auth.response;

  const movieId = Number(params.id);
  if (!Number.isFinite(movieId)) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get("imageType");

    if (imageType !== "poster" && imageType !== "backdrop") {
      return NextResponse.json(
        { error: "imageType query param must be 'poster' or 'backdrop'." },
        { status: 400 }
      );
    }

    const existing = await getCustomImageRecord(movieId, imageType);
    if (existing) {
      const filePath = path.join(getUploadsDir(movieId), existing.file_name);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await deleteCustomImageRecord(movieId, imageType);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
