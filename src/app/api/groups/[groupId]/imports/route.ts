import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createImportSession,
  listImportSessions,
} from "@/lib/imports";
import {
  badRequest,
  handleServiceError,
  readJsonObject,
  requireCurrentUserId,
} from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

const jsonImportSchema = z.object({
  filename: z.string().trim().min(1),
  csv: z.string().min(1),
});

async function readImportUpload(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      badRequest("Multipart import requires a file field");
    }

    return {
      filename: file.name,
      csv: await file.text(),
    };
  }

  return jsonImportSchema.parse(await readJsonObject(req));
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const imports = await listImportSessions(actorId, groupId);
    return NextResponse.json({ imports });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const upload = await readImportUpload(req);
    const importSession = await createImportSession(actorId, {
      groupId,
      ...upload,
    });

    return NextResponse.json({ importSession }, { status: 201 });
  } catch (error) {
    return handleServiceError(error);
  }
}
