import { NextResponse } from 'next/server';

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function getErrorStatus(error: unknown, fallback = 500): number {
  const message = getErrorMessage(error, '');

  if (/already exists/i.test(message)) {
    return 409;
  }

  if (/not found/i.test(message)) {
    return 404;
  }

  return fallback;
}

export function jsonError(error: unknown, fallback: string, fallbackStatus = 500) {
  return NextResponse.json(
    { error: getErrorMessage(error, fallback) },
    { status: getErrorStatus(error, fallbackStatus) }
  );
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
