import { NextResponse } from 'next/server';
import { getMemoryStats } from '@/lib/memory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getMemoryStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Memory stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memory stats' },
      { status: 500 }
    );
  }
}
