import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://igatuvmuedjybxemlnza.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYXR1dm11ZWRqeWJ4ZW1sbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjcyNjgsImV4cCI6MjA4ODg0MzI2OH0.wG4E1_8kX7q1vc7-BNWy98gzFkAJ0u8_654VsMVHsVY';
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/lifescape-images/`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function storageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  const filename = imageUrl.split('/').pop();
  if (!filename) return '';
  return `${STORAGE_BASE}${encodeURIComponent(filename)}`;
}

export function resolveMediaUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return storageUrl(imageUrl);
}

// --- Moments ---

export async function getMoments(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('dataline_objects')
    .select('*')
    .neq('title', '')
    .not('title', 'is', null)
    .order('start_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (error) { console.error('getMoments error:', error); return []; }
  return data || [];
}

export async function getMomentsByUser(userId: string, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('dataline_objects')
    .select('*')
    .eq('user_id', userId)
    .neq('title', '')
    .not('title', 'is', null)
    .order('start_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (error) { console.error('getMomentsByUser error:', error); return []; }
  return data || [];
}

export async function getMomentById(id: string) {
  const { data, error } = await supabase
    .from('dataline_objects')
    .select('*')
    .eq('datalineobject_id', id)
    .single();
  if (error) { console.error('getMomentById error:', error); return null; }
  return data;
}

// --- Media ---

export async function getMediaForMoment(momentId: string) {
  const { data, error } = await supabase
    .from('media')
    .select('media_id, datalineobject_id, image_url, media_desc, width, height')
    .eq('datalineobject_id', momentId)
    .not('image_url', 'is', null)
    .order('created_datetime', { ascending: true });
  if (error) { console.error('getMediaForMoment error:', error); return []; }
  return data || [];
}

export async function getMediaForMoments(momentIds: string[]) {
  const { data, error } = await supabase
    .from('media')
    .select('media_id, datalineobject_id, image_url, media_desc, width, height')
    .in('datalineobject_id', momentIds)
    .not('image_url', 'is', null)
    .order('created_datetime', { ascending: true });
  if (error) { console.error('getMediaForMoments error:', error); return []; }
  return data || [];
}

// --- Threads ---

export async function getThreads(limit = 50) {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .order('created_datetime', { ascending: false })
    .limit(limit);
  if (error) { console.error('getThreads error:', error); return []; }
  return data || [];
}

export async function getThreadById(id: string) {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('thread_id', id)
    .single();
  if (error) { console.error('getThreadById error:', error); return null; }
  return data;
}

export async function getMomentsByThread(threadId: string, limit = 50) {
  const { data, error } = await supabase
    .from('dataline_objects')
    .select('*')
    .eq('thread_id', threadId)
    .order('start_date', { ascending: false })
    .limit(limit);
  if (error) { console.error('getMomentsByThread error:', error); return []; }
  return data || [];
}

// --- Comments ---

export async function getCommentsForMoment(momentId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('datalineobject_id', momentId)
    .order('created_datetime', { ascending: true });
  if (error) { console.error('getCommentsForMoment error:', error); return []; }
  return data || [];
}

// --- Likes ---

export async function getLikesForMoment(momentId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('*')
    .eq('datalineobject_id', momentId);
  if (error) { console.error('getLikesForMoment error:', error); return []; }
  return data || [];
}

// --- Storage Browser ---

export async function listStorageFiles(limit = 1000, offset = 0) {
  const { data, error } = await supabase.storage
    .from('lifescape-images')
    .list('', { limit, offset, sortBy: { column: 'name', order: 'asc' } });
  if (error) { console.error('listStorageFiles error:', error); return []; }
  return (data || []).filter(f => f.id !== null); // only files, not folders
}

export async function listAllStorageFiles() {
  const all: any[] = [];
  for (let off = 0; off < 50000; off += 1000) {
    const batch = await listStorageFiles(1000, off);
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 1000) break;
  }
  return all;
}

export function storagePublicUrl(filename: string): string {
  return `${STORAGE_BASE}${filename}`;
}

// Get media rows grouped by storage filename for link status
export async function getLinkedFilenames(): Promise<Set<string>> {
  const linked: string[] = [];
  for (let off = 0; off < 50000; off += 1000) {
    const { data } = await supabase
      .from('media')
      .select('image_url')
      .not('image_url', 'is', null)
      .not('image_url', 'like', '%cloudinary%')
      .range(off, off + 999);
    if (!data || !data.length) break;
    linked.push(...data.map((r: any) => r.image_url.split('/').pop()));
  }
  return new Set(linked);
}

// Get unlinked moments (no supabase images) for the linking dropdown
export async function getUnlinkedMoments(userId: string) {
  // Get all moments
  const allMoments: any[] = [];
  for (let off = 0; off < 5000; off += 1000) {
    const { data } = await supabase
      .from('dataline_objects')
      .select('datalineobject_id, title, start_date, raw_data')
      .eq('user_id', userId)
      .not('title', 'is', null)
      .order('start_date', { ascending: false, nullsFirst: false })
      .range(off, off + 999);
    if (!data || !data.length) break;
    allMoments.push(...data);
  }

  // Get moments that have supabase images
  const { data: supaMedia } = await supabase
    .from('media')
    .select('datalineobject_id')
    .eq('user_id', userId)
    .not('image_url', 'like', '%cloudinary%')
    .not('image_url', 'is', null);
  const withSupa = new Set((supaMedia || []).map((m: any) => m.datalineobject_id));

  return allMoments.map(m => {
    let raw: any = {};
    try { raw = m.raw_data ? JSON.parse(m.raw_data) : {}; } catch {}
    const sd = m.start_date ? new Date(Number(m.start_date)) : null;
    return {
      datalineobject_id: m.datalineobject_id,
      title: raw.object_title || m.title || 'Untitled',
      date: sd && !isNaN(sd.getTime()) ? sd.toISOString().slice(0, 10) : '',
      hasImages: withSupa.has(m.datalineobject_id),
    };
  });
}

// Link a storage file to a moment
export async function linkFileToMoment(filename: string, momentId: string, userId: string) {
  const mediaId = crypto.randomUUID();
  const { error } = await supabase.from('media').insert({
    media_id: mediaId,
    user_id: userId,
    datalineobject_id: momentId,
    image_url: storagePublicUrl(filename),
    media_desc: '',
    created_datetime: Date.now(),
  });
  if (error) { console.error('linkFileToMoment error:', error); return false; }
  return true;
}

// Unlink a media row
export async function unlinkMedia(mediaId: string) {
  const { error } = await supabase.from('media').delete().eq('media_id', mediaId);
  if (error) { console.error('unlinkMedia error:', error); return false; }
  return true;
}

// --- Storage ---

export async function uploadFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('lifescape-images')
    .upload(path, file);
  if (error) { console.error('Upload error:', error); return null; }
  return data;
}

export async function deleteFile(path: string) {
  const { data, error } = await supabase.storage
    .from('lifescape-images')
    .remove([path]);
  if (error) { console.error('Delete error:', error); return null; }
  return data;
}

// --- Helpers ---

export function mapMoment(m: any, mediadata: any[] = []) {
  let raw: any = {};
  try { raw = m.raw_data ? JSON.parse(m.raw_data) : {}; } catch {}
  return {
    datalineobject_id: m.datalineobject_id,
    user_id: m.user_id,
    object_title: raw.object_title || m.title || '',
    posted_by: raw.posted_by || m.posted_by || '',
    start_date: m.start_date ? new Date(Number(m.start_date)).toISOString() : '',
    moment_link: raw.moment_link || '',
    object_desc: raw.object_desc || '',
    user_profile_picture: raw.user_profile_picture || '',
    location: raw.location || '',
    mediadata: mediadata
      .filter(img => {
        const url = img.image_url || '';
        // Skip dead Cloudinary URLs — the account no longer exists
        if (url.includes('cloudinary.com')) return false;
        return !!url;
      })
      .map(img => ({
        media_id: img.media_id,
        media_desc: img.media_desc || '',
        url: resolveMediaUrl(img.image_url),
        media_type: (img.image_url?.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'image') as 'image' | 'video',
      })),
    media_count: mediadata.filter(img => img.image_url).length,
    like_counter: raw.like_counter || 0,
    mylike_status: raw.mylike_status || 0,
    comments_counter: raw.comments_counter || 0,
    thread_id: m.thread_id || '',
  };
}

export async function getMomentsWithMedia(limit = 20, offset = 0) {
  const moments = await getMoments(limit, offset);
  if (!moments.length) return [];
  const ids = moments.map((m: any) => m.datalineobject_id);
  const media = await getMediaForMoments(ids);
  const mediaByMoment: Record<string, any[]> = {};
  media.forEach((img: any) => {
    const id = img.datalineobject_id;
    if (!mediaByMoment[id]) mediaByMoment[id] = [];
    mediaByMoment[id].push(img);
  });
  return moments.map((m: any) => mapMoment(m, mediaByMoment[m.datalineobject_id] || []));
}

export async function getMomentsWithMediaByUser(userId: string, limit = 20, offset = 0) {
  const moments = await getMomentsByUser(userId, limit, offset);
  if (!moments.length) return [];
  const ids = moments.map((m: any) => m.datalineobject_id);
  const media = await getMediaForMoments(ids);
  const mediaByMoment: Record<string, any[]> = {};
  media.forEach((img: any) => {
    const id = img.datalineobject_id;
    if (!mediaByMoment[id]) mediaByMoment[id] = [];
    mediaByMoment[id].push(img);
  });
  return moments.map((m: any) => mapMoment(m, mediaByMoment[m.datalineobject_id] || []));
}

export async function getThreadsByUser(userId: string) {
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('user_id', userId)
    .order('created_datetime', { ascending: false });
  if (error) { console.error('getThreadsByUser error:', error); return []; }
  return data || [];
}

export async function getMomentWithMedia(id: string) {
  const moment = await getMomentById(id);
  if (!moment) return null;
  const media = await getMediaForMoment(id);
  return mapMoment(moment, media);
}
