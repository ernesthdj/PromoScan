// lib/infrastructure/apiResponse.ts
//
// Format de réponse uniforme sur tous les endpoints (docs/API-ENDPOINTS.md — "Notes transverses") :
// { success: true, data } ou { success: false, error: { code, message } }.

import { NextResponse } from 'next/server';

export function jsonSuccess<T>(data: T, init?: { status?: number }) {
  return NextResponse.json({ success: true, data }, { status: init?.status ?? 200 });
}

export function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
