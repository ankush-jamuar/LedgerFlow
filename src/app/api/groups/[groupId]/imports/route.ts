import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createImportSession,
  listImportSessions,
} from "@/lib/imports";
import { serializeImportSession } from "@/lib/imports/serialize";
import {
  badRequest,
  handleServiceError,
  readJsonObject,
  requireCurrentUserId,
} from "@/lib/api/http";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

import type { ImportColumnMapping } from "@/lib/imports/types";

const jsonImportSchema = z.object({
  filename: z.string().trim().min(1),
  csv: z.string().min(1),
  mapping: z.record(z.string(), z.string()).optional(),
});

async function readImportUpload(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      badRequest("Multipart import requires a file field");
    }

    let mapping: ImportColumnMapping | undefined;
    const mappingField = form.get("mapping");
    if (typeof mappingField === "string" && mappingField.trim()) {
      try {
        mapping = JSON.parse(mappingField) as ImportColumnMapping;
      } catch {
        badRequest("Invalid column mapping JSON");
      }
    }

    const strictModeField = form.get("strictMode");
    const strictMode = strictModeField === "true";

    return {
      filename: file.name,
      csv: await file.text(),
      mapping,
      strictMode,
    };
  }

  const jsonBody = await readJsonObject(req) as Record<string, unknown>;
  const parsed = jsonImportSchema.parse(jsonBody);
  const strictMode = jsonBody.strictMode === true;
  return {
    ...parsed,
    strictMode,
  };
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const actorId = await requireCurrentUserId();
    const { groupId } = await context.params;
    const imports = await listImportSessions(actorId, groupId);
    return NextResponse.json({
      imports: imports.map((session) => serializeImportSession(session)),
    });
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

    return NextResponse.json(
      { importSession: serializeImportSession(importSession) },
      { status: 201 }
    );
  } catch (error) {
    return handleServiceError(error);
  }
}
