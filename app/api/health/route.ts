import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    application: 'SPORTO',
    runtime: 'next-app-router',
    status: 'ok',
  });
}
