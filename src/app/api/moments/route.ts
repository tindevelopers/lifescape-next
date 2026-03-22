import { NextRequest, NextResponse } from 'next/server';
import { getMomentsWithMediaByUser } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId') || '';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!userId) {
    return NextResponse.json([], { status: 400 });
  }

  const moments = await getMomentsWithMediaByUser(userId, limit, offset);
  return NextResponse.json(moments);
}
