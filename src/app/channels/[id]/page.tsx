import { getThreadById, getMomentsByThread, getMediaForMoments, mapMoment } from '@/lib/supabase';
import { MomentCard } from '@/components/moments/moment-card';
import Link from 'next/link';
import { ArrowLeft, Hash } from 'lucide-react';

export default async function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = await getThreadById(id);
  const moments = await getMomentsByThread(id, 50);

  const ids = moments.map((m: any) => m.datalineobject_id);
  const media = ids.length ? await getMediaForMoments(ids) : [];
  const mediaByMoment: Record<string, any[]> = {};
  media.forEach((img: any) => {
    const mid = img.datalineobject_id;
    if (!mediaByMoment[mid]) mediaByMoment[mid] = [];
    mediaByMoment[mid].push(img);
  });
  const mapped = moments.map((m: any) => mapMoment(m, mediaByMoment[m.datalineobject_id] || []));

  let threadRaw: any = {};
  try { threadRaw = thread?.raw_data ? JSON.parse(thread.raw_data) : {}; } catch {}
  const threadName = threadRaw.thread_name || 'Untitled Channel';

  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400">Channel not found</h1>
        <Link href="/channels" className="text-indigo-600 mt-4 inline-block hover:underline">Back to Channels</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/channels" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Channels</span>
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Hash className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{threadName}</h1>
        </div>
        <p className="text-sm text-gray-400 mt-2 ml-13">{mapped.length} moments</p>
      </div>

      {mapped.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No moments in this channel yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mapped.map((moment: any) => (
            <MomentCard key={moment.datalineobject_id} moment={moment} />
          ))}
        </div>
      )}
    </div>
  );
}
