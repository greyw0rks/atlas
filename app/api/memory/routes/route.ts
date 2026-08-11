import { NextResponse } from 'next/server';
import { getRoutePrior, getProtocolRoutes } from '@/lib/memory';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const protocol = searchParams.get('protocol');
    const fromChain = searchParams.get('fromChain');
    const toChain = searchParams.get('toChain');
    const tokenSymbol = searchParams.get('token');

    // If only protocol provided, return all routes for that protocol
    if (protocol && !fromChain && !toChain && !tokenSymbol) {
      const routes = await getProtocolRoutes(protocol);
      return NextResponse.json({ protocol, routes });
    }

    // If all params provided, return specific route prior
    if (protocol && fromChain && toChain && tokenSymbol) {
      const route = await getRoutePrior(
        protocol,
        parseInt(fromChain, 10),
        parseInt(toChain, 10),
        tokenSymbol
      );

      if (!route) {
        return NextResponse.json(
          { error: 'Route not found in memory' },
          { status: 404 }
        );
      }

      return NextResponse.json(route);
    }

    return NextResponse.json(
      { error: 'Invalid parameters. Provide either "protocol" alone, or all of: protocol, fromChain, toChain, token' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Route prior error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route priors' },
      { status: 500 }
    );
  }
}
