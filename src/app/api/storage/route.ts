import { NextRequest, NextResponse } from 'next/server';
import {
  supabase,
  listAllStorageFiles,
  linkFileToMoment,
  unlinkMedia,
  storagePublicUrl,
} from '@/lib/supabase';
import { CURRENT_USER } from '@/lib/auth';

export async function GET() {
  const files = await listAllStorageFiles();

  // Get all non-cloudinary media rows to map filename -> moment
  const mediaRows: any[] = [];
  for (let off = 0; off < 50000; off += 1000) {
    const { data } = await supabase
      .from('media')
      .select('image_url, datalineobject_id, media_id, user_id')
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

  // Get ALL moments with titles and user_ids for the linking dropdown
  const allMoments: any[] = [];
  for (let off = 0; off < 10000; off += 1000) {
    const { data } = await supabase
      .from('dataline_objects')
      .select('datalineobject_id, title, start_date, user_id, raw_data')
      .not('title', 'is', null)
      .order('start_date', { ascending: false, nullsFirst: false })
      .range(off, off + 999);
    if (!data || !data.length) break;
    allMoments.push(...data);
  }

  // Build momentId -> title map, and user_id -> name map
  const momentTitles: Record<string, string> = {};
  const uidToName: Record<string, string> = {};
  const momentsByUserId: Record<string, any[]> = {};

  for (const m of allMoments) {
    let raw: any = {};
    try { raw = typeof m.raw_data === 'string' ? JSON.parse(m.raw_data) : (m.raw_data || {}); } catch {}
    const title = raw.object_title || m.title || 'Untitled';
    momentTitles[m.datalineobject_id] = title;

    if (raw.posted_by && m.user_id && !uidToName[m.user_id]) {
      uidToName[m.user_id] = raw.posted_by;
    }

    // Group moments by user_id
    if (m.user_id) {
      if (!momentsByUserId[m.user_id]) momentsByUserId[m.user_id] = [];
      const sd = m.start_date ? new Date(Number(m.start_date)) : null;
      momentsByUserId[m.user_id].push({
        datalineobject_id: m.datalineobject_id,
        title,
        date: sd && !isNaN(sd.getTime()) ? sd.toISOString().slice(0, 10) : '',
      });
    }
  }

  // Build fileUserNum -> firebase_uid from media rows
  const userNumToUid: Record<string, string> = {};
  for (const row of mediaRows) {
    const fnm = (row.image_url || '').match(/user(\d+)_/);
    if (fnm && row.user_id) {
      userNumToUid[`user${fnm[1]}`] = row.user_id;
    }
  }

  // Combine: fileUserNum -> display name
  const userNames: Record<string, string> = {};
  for (const [userNum, uid] of Object.entries(userNumToUid)) {
    userNames[userNum] = uidToName[uid] || userNum;
  }

  // Count images per userId (from filenames)
  const userCounts: Record<string, number> = {};
  const parsed = files.map(f => {
    const m = f.name.match(
      /^user(\d+)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\w+?)_(Original|Large|Medium|Small|ExtraLarge|ExtraSmall)\.(jpg|jpeg|png|gif)$/i
    );
    const link = linkMap[f.name];
    const userId = m ? `user${m[1]}` : null;

    // Count
    const countKey = userId || '_unnamed';
    userCounts[countKey] = (userCounts[countKey] || 0) + 1;

    return {
      name: f.name,
      url: storagePublicUrl(f.name),
      linked: !!link,
      momentId: link?.momentId || null,
      momentTitle: link ? (momentTitles[link.momentId] || 'Unknown moment') : null,
      mediaId: link?.mediaId || null,
      userId,
      userName: userId ? (userNames[userId] || userId) : null,
      date: m ? `${m[2]}-${m[3]}-${m[4]}` : null,
      time: m ? `${m[5]}:${m[6]}:${m[7]}` : null,
      variant: m ? m[9] : null,
      ext: m ? m[10] : f.name.split('.').pop(),
    };
  });

  // Build user moments map: userNum -> moments[]
  const userMoments: Record<string, any[]> = {};
  for (const [userNum, uid] of Object.entries(userNumToUid)) {
    userMoments[userNum] = momentsByUserId[uid] || [];
  }

  return NextResponse.json({
    files: parsed,
    userNames,
    userCounts,
    userMoments,
  });
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
