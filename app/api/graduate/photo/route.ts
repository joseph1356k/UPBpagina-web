/**
 * POST   /api/graduate/photo — upload the participant's optional photo
 * DELETE /api/graduate/photo — remove it
 *
 * The photo personalizes invitation emails (e.g. the graduate's face on
 * the pass their grandmother receives). Strictly optional.
 *
 * Security model:
 *   · Auth: graduate session cookie (requireGraduate)
 *   · Validation: size ≤ 2 MB AND magic-byte sniffing (JPEG/PNG/WebP) —
 *     extension and Content-Type headers are attacker-controlled, the
 *     first bytes are not.
 *   · Storage: Supabase Storage bucket `participant-photos` (public READ,
 *     writes only through this route via service role). One object per
 *     participant (`{graduateId}.{ext}`, upsert) so re-uploads replace.
 */

import { NextResponse, type NextRequest } from "next/server";

import { USE_SUPABASE } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/csrf";
import { requireGraduate } from "@/lib/security/graduate-auth";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const BUCKET = "participant-photos";

/** Sniff real image type from leading bytes. Returns null when unknown. */
function sniffImage(bytes: Uint8Array): { ext: string; mime: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const rl = await rateLimit(request, "graduate-photo", { max: 10, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireGraduate();
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) {
    return NextResponse.json(
      { ok: false, error: "unsupported_format" },
      { status: 415 },
    );
  }

  const service = createServiceClient();
  const path = `${auth.graduateId}.${kind.ext}`;

  // Clean stale variants with other extensions (jpg→png re-upload etc.)
  const stale = ["jpg", "png", "webp"]
    .filter((e) => e !== kind.ext)
    .map((e) => `${auth.graduateId}.${e}`);
  await service.storage.from(BUCKET).remove(stale);

  const { error: upErr } = await service.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: kind.mime, upsert: true });
  if (upErr) {
    console.error("[graduate/photo] upload failed:", upErr);
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }

  const { data: pub } = service.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust: same path on re-upload would show the old CDN-cached photo
  const photoUrl = `${pub.publicUrl}?v=${Date.now()}`;

  const { error: dbErr } = await service
    .from("graduates")
    .update({ photo_url: photoUrl })
    .eq("id", auth.graduateId);
  if (dbErr) {
    console.error("[graduate/photo] db update failed:", dbErr);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, photoUrl });
}

export async function DELETE(request: NextRequest) {
  if (!USE_SUPABASE) {
    return NextResponse.json({ ok: false, error: "mock_mode" }, { status: 501 });
  }

  const csrf = assertSameOrigin(request);
  if (!csrf.ok) return csrf.response;

  const auth = await requireGraduate();
  if (!auth.ok) return auth.response;

  const service = createServiceClient();
  await service.storage
    .from(BUCKET)
    .remove(["jpg", "png", "webp"].map((e) => `${auth.graduateId}.${e}`));

  const { error } = await service
    .from("graduates")
    .update({ photo_url: null })
    .eq("id", auth.graduateId);
  if (error) {
    return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
