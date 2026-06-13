import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureCurrentLocalUser } from "@/lib/users/current-user";

export class ServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "SERVICE_ERROR"
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function badRequest(message: string): never {
  throw new ServiceError(400, message, "BAD_REQUEST");
}

export function forbidden(message = "Forbidden"): never {
  throw new ServiceError(403, message, "FORBIDDEN");
}

export function notFound(message = "Not found"): never {
  throw new ServiceError(404, message, "NOT_FOUND");
}

export function conflict(message: string): never {
  throw new ServiceError(409, message, "CONFLICT");
}

export async function requireCurrentUserId(): Promise<string> {
  const account = await ensureCurrentLocalUser();

  if (!account) {
    throw new ServiceError(401, "Unauthenticated", "UNAUTHENTICATED");
  }

  return account.user.id;
}

export function handleServiceError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: "Internal Server Error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    badRequest("Request body must be valid JSON");
  }
}

export async function readJsonObject(
  req: Request
): Promise<Record<string, unknown>> {
  const body = await readJson(req);

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    badRequest("Request body must be a JSON object");
  }

  return body as Record<string, unknown>;
}
