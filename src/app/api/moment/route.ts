import { NextRequest, NextResponse } from 'next/server';
import {
  supabase,
  listAllStorageFiles,
  storagePublicUrl,
  linkFileToMoment,
  unlinkMedia,
} from '@/lib/supabase';
import { CURRENT_USER } from '@/lib/auth';

// GET: fetch moment data + its media + available storage files for linking
export async function GET(request: NextRequest) {
  const momentId = request.nextUrl.searchParams.get('id');
  if (!momentId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Fetch moment
  const { data: moment } = await supabase
    .from('dataline_objects')
    .select('*')
    .eq('datalineobject_id', momentId)
    .single();

  if (!moment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch all media for this moment (including cloudinary)
  const { data: media } = await supabase
    .from('media')
    .select('media_id, image_url, media_desc, width, height, created_datetime')
    .eq('datalineobject_id', momentId)
    .not('image_url', 'is', null)
    .order('created_datetime', { ascending: true });

  const mediaRows = (media || []).map(m => ({
    media_id: m.media_id,
    image_url: m.image_url,
    url: m.image_url, // full URL for display
    media_desc: m.media_desc || '',
    isCloudinary: (m.image_url || '').includes('cloudinary'),
    isWorking: !(m.image_url || '').includes('cloudinary'),
  }));

  // Parse moment metadata
  let raw: any = {};
  try { raw = moment.raw_data ? JSON.parse(moment.raw_data) : {}; } catch {}
  const sd = moment.start_date ? new Date(Number(moment.start_date)) : null;

  const parsed = {
    datalineobject_id: moment.datalineobject_id,
    title: raw.object_title || moment.title || '',
    posted_by: raw.posted_by || moment.posted_by || '',
    date: sd && !isNaN(sd.getTime()) ? sd.toISOString().slice(0, 10) : '',
    location: raw.location || '',
    description: raw.object_desc || '',
    thread_id: moment.thread_id || '',
  };

  // Get all storage files for the available photos panel
  const allFiles = await listAllStorageFiles();
  const user39Files = allFiles
    .filter(f => f.name.startsWith('user39_'))
    .map(f => {
      const m = f.name.match(
        /^user(\d+)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\w+?)_(Original|Large|Medium|Small|ExtraLarge|ExtraSmall)\.(jpg|jpeg|png|gif)$/i
      );
      return {
        name: f.name,
        url: storagePublicUrl(f.name),
        date: m ? `${m[2]}-${m[3]}-${m[4]}` : null,
        time: m ? `${m[5]}:${m[6]}:${m[7]}` : null,
        variant: m ? m[9] : null,
      };
    });

  return NextResponse.json({ moment: parsed, media: mediaRows, storageFiles: user39Files });
}

// POST: link/unlink operations
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, filename, momentId, mediaId, filenames } = body;

  // Bulk link
  if (action === 'bulkLink' && filenames?.length && momentId) {
    let success = 0;
    for (const fn of filenames) {
      const ok = await linkFileToMoment(fn, momentId, CURRENT_USER.user_id);
      if (ok) success++;
    }
    return NextResponse.json({ success: true, linked: success });
  }

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
