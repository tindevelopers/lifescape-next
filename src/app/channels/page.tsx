import { getThreadsByUser } from '@/lib/supabase';
import { CURRENT_USER } from '@/lib/auth';
import Link from 'next/link';
import { Hash, Calendar, ChevronRight, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

function parseThread(thread: any) {
  let raw: any = {};
  try { raw = typeof thread.raw_data === 'string' ? JSON.parse(thread.raw_data) : thread.raw_data || {}; } catch {}
  return {
    ...thread,
    thread_name: raw.thread_name || 'Untitled Channel',
    moment_counter: raw.moment_counter || 0,
  };
}

export default async function ChannelsPage() {
  const rawThreads = await getThreadsByUser(CURRENT_USER.user_id);
  const threads = rawThreads.map(parseThread);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Channels</h1>
        <p className="text-gray-500 mt-1">{threads.length} channels</p>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-20">
          <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400">No channels yet</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {threads.map((thread: any) => (
            <Link
              key={thread.thread_id}
              href={`/channels/${thread.thread_id}`}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex items-start gap-4 border border-gray-100"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Hash className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                  {thread.thread_name}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {thread.created_datetime && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(thread.created_datetime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {Number(thread.moment_counter) > 0 && (
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {thread.moment_counter} moments
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
