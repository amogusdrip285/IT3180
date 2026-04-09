import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return apiError("VALIDATION_ERROR", "Missing avatar file", 400);
  }

  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowed.includes(file.type)) {
    return apiError("VALIDATION_ERROR", "Only PNG/JPG/JPEG/WEBP are allowed", 400, { mime: file.type });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return apiError("VALIDATION_ERROR", "Uploaded file is empty", 400);
  }
  if (bytes.length > 2 * 1024 * 1024) {
    return apiError("VALIDATION_ERROR", "Avatar size must be <= 2MB", 400);
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${auth.user!.id}-${randomUUID()}.${ext}`;
  const uploadDir = process.env.AVATAR_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "avatars");

  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, fileName), bytes);

    const normalizedUploadDir = uploadDir.replace(/\\/g, "/");
    const normalizedPublicDir = path.join(process.cwd(), "public").replace(/\\/g, "/");
    const avatarUrl = normalizedUploadDir.startsWith(normalizedPublicDir)
      ? `/${normalizedUploadDir.slice(normalizedPublicDir.length).replace(/^\/+/, "")}/${fileName}`
      : `/uploads/avatars/${fileName}`;
    await db.user.update({ where: { id: auth.user!.id }, data: { avatarUrl } });

    return NextResponse.json({ ok: true, avatarUrl });
  } catch {
    return apiError("FILE_UPLOAD_ERROR", "Cannot save avatar file on server", 500);
  }
}
