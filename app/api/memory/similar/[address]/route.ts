import { NextResponse } from 'next/server';
import { findSimilarAddresses } from '@/lib/memory';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Get the query address profile including embedding via raw query
    // (Prisma doesn't include VECTOR columns in typed queries)
    const result = await prisma.$queryRaw<Array<{ embedding: string }>>`
      SELECT "behaviorEmbedding"::text as embedding
      FROM "AddressProfile"
      WHERE address = ${address.toLowerCase()}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Address not found in memory' },
        { status: 404 }
      );
    }

    if (!result[0].embedding) {
      return NextResponse.json(
        { error: 'Address has no embedding (insufficient data)' },
        { status: 400 }
      );
    }

    // Parse embedding (CockroachDB returns vector as "[1,2,3,...]" string)
    const embedding = JSON.parse(result[0].embedding) as number[];

    // Find similar addresses via vector kNN
    const similar = await findSimilarAddresses(embedding, limit);

    // Exclude the query address itself
    const filtered = similar.filter(s => s.address !== address.toLowerCase());

    return NextResponse.json({
      query: address,
      results: filtered.map(s => ({
        address: s.address,
        distance: s.distance,
        observationCount: s.observationCount,
        degree: s.degree,
        chainIds: s.chainIds,
        bridgeProtocols: s.bridgeProtocols,
        topTokens: s.topTokens,
        behaviorText: s.behaviorText,
      })),
    });
  } catch (error) {
    console.error('Similar addresses error:', error);
    return NextResponse.json(
      { error: 'Failed to find similar addresses' },
      { status: 500 }
    );
  }
}
