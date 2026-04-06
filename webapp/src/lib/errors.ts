import { NextResponse } from "next/server";

export function apiError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ code, message, details }, { status });
}
