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

  // Build user number -> display name mapping
  // Step 1: media rows give us fileUserNum -> firebase_uid
  const userNumToUid: Record<string, string> = {};
  for (const row of mediaRows) {
    const fnameMatch = (row.image_url || '').match(/user(\d+)_/);
    if (fnameMatch) {
      // We need the user_id from this media row - re-fetch with user_id
      const key = `user${fnameMatch[1]}`;
      if (!userNumToUid[key]) {
        // Look up user_id from linked moment
        const mid = row.datalineobject_id;
        if (mid) {
          const mom = momentsP.find((m: any) => m.datalineobject_id === mid);
          // momentsP doesn't have user_id, but we can derive from the existing data
        }
      }
    }
  }

  // Step 2: Get display names from dataline_objects (user_id -> posted_by via raw_data)
  const uidToName: Record<string, string> = {};
  const { data: nameRows } = await supabase
    .from('dataline_objects')
    .select('user_id, raw_data')
    .not('user_id', 'is', null)
    .limit(2000);
  for (const row of (nameRows || [])) {
    if (uidToName[row.user_id]) continue;
    let raw: any = {};
    try { raw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data; } catch {}
    if (raw?.posted_by) uidToName[row.user_id] = raw.posted_by;
  }

  // Step 3: Get user_id for each file user number from media table
  const { data: userMediaRows } = await supabase
    .from('media')
    .select('user_id, image_url')
    .not('image_url', 'is', null)
    .not('image_url', 'like', '%cloudinary%')
    .limit(5000);
  for (const row of (userMediaRows || [])) {
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

  // Parse filename metadata
  const parsed = files.map(f => {
    const m = f.name.match(
      /^user(\d+)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\w+?)_(Original|Large|Medium|Small|ExtraLarge|ExtraSmall)\.(jpg|jpeg|png|gif)$/i
    );
    const link = linkMap[f.name];
    const userId = m ? `user${m[1]}` : null;
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

  return NextResponse.json({ files: parsed, moments: momentsP, userNames });
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
