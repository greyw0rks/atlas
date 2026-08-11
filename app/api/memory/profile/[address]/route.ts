import { NextResponse } from 'next/server';
import { getAddressProfile } from '@/lib/memory';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    const profile = await getAddressProfile(address);

    if (!profile) {
      return NextResponse.json(
        { error: 'Address not found in memory' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address profile' },
      { status: 500 }
    );
  }
}
