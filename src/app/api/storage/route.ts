import { NextRequest, NextResponse } from 'next/server';
import {
  supabase,
  listAllStorageFiles,
  getUnlinkedMoments,
  linkFileToMoment,
  unlinkMedia,
  storagePublicUrl,
} from '@/lib/supabase';
import { CURRENT_USER } from '@/lib/auth';

export async function GET() {
  // Fetch in parallel: storage files, all media rows (for link mapping), moments
  const [files, momentsP] = await Promise.all([
    listAllStorageFiles(),
    getUnlinkedMoments(CURRENT_USER.user_id),
  ]);

  // Get all non-cloudinary media rows to map filename -> moment
  const mediaRows: any[] = [];
  for (let off = 0; off < 50000; off += 1000) {
    const { data } = await supabase
      .from('media')
      .select('image_url, datalineobject_id, media_id')
      .not('image_url', 'is', null)
      .not('image_url', 'like', '%cloudinary%')
      .range(off, off + 999);
    if (!data || !data.length) break;
    mediaRows.push(...data);
  }

  // Build filename -> {momentId, mediaId} map
  const linkMap: Record<string, { momentId: string; mediaId: string }> = {};
  for (const row of mediaRows) {
    const fname = (row.image_url || '').split('/').pop();
    if (fname) linkMap[fname] = { momentId: row.datalineobject_id, mediaId: row.media_id };
  }

  // Build momentId -> title map from moments list
  const momentTitles: Record<string, string> = {};
  for (const m of momentsP) {
    momentTitles[m.datalineobject_id] = m.title;
  }

  // Parse filename metadata
  const parsed = files.map(f => {
    const m = f.name.match(
      /^user(\d+)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\w+?)_(Original|Large|Medium|Small|ExtraLarge|ExtraSmall)\.(jpg|jpeg|png|gif)$/i
    );
    const link = linkMap[f.name];
    return {
      name: f.name,
      url: storagePublicUrl(f.name),
      linked: !!link,
      momentId: link?.momentId || null,
      momentTitle: link ? (momentTitles[link.momentId] || 'Unknown moment') : null,
      mediaId: link?.mediaId || null,
      userId: m ? `user${m[1]}` : null,
      date: m ? `${m[2]}-${m[3]}-${m[4]}` : null,
      time: m ? `${m[5]}:${m[6]}:${m[7]}` : null,
      variant: m ? m[9] : null,
      ext: m ? m[10] : f.name.split('.').pop(),
    };
  });

  return NextResponse.json({ files: parsed, moments: momentsP });
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
