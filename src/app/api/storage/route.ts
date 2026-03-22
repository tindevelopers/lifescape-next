import { NextRequest, NextResponse } from 'next/server';
import {
  listAllStorageFiles,
  getLinkedFilenames,
  getUnlinkedMoments,
  linkFileToMoment,
  unlinkMedia,
  storagePublicUrl,
} from '@/lib/supabase';
import { CURRENT_USER } from '@/lib/auth';

export async function GET() {
  const [files, linked, moments] = await Promise.all([
    listAllStorageFiles(),
    getLinkedFilenames(),
    getUnlinkedMoments(CURRENT_USER.user_id),
  ]);

  // Parse filename metadata
  const parsed = files.map(f => {
    const m = f.name.match(
      /^user(\d+)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\w+?)_(Original|Large|Medium|Small|ExtraLarge|ExtraSmall)\.(jpg|jpeg|png|gif)$/i
    );
    return {
      name: f.name,
      url: storagePublicUrl(f.name),
      linked: linked.has(f.name),
      userId: m ? `user${m[1]}` : null,
      date: m ? `${m[2]}-${m[3]}-${m[4]}` : null,
      time: m ? `${m[5]}:${m[6]}:${m[7]}` : null,
      variant: m ? m[9] : null,
      ext: m ? m[10] : f.name.split('.').pop(),
    };
  });

  return NextResponse.json({ files: parsed, moments });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, filename, momentId, mediaId } = body;

  if (action === 'link' && filename && momentId) {
    const ok = await linkFileToMoment(filename, momentId, CURRENT_USER.user_id);
    return NextResponse.json({ success: ok });
  }

  if (action === 'unlink' && mediaId) {
    const ok = await unlinkMedia(mediaId);
    return NextResponse.json({ success: ok });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
