import { NextResponse } from 'next/server';
import { getHighDegreeAddresses } from '@/lib/memory';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minDegree = parseInt(searchParams.get('minDegree') || '10', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const hubs = await getHighDegreeAddresses(minDegree, limit);

    return NextResponse.json({
      minDegree,
      count: hubs.length,
      addresses: hubs.map(h => ({
        address: h.address,
        degree: h.degree,
        observationCount: h.observationCount,
        chainIds: h.chainIds,
        bridgeProtocols: h.bridgeProtocols,
        topTokens: h.topTokens,
        behaviorText: h.behaviorText,
      })),
    });
  } catch (error) {
    console.error('High degree addresses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch high-degree addresses' },
      { status: 500 }
    );
  }
}
