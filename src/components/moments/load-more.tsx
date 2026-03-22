'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { MomentCard } from './moment-card';
import type { Moment } from '@/types/index';

interface LoadMoreProps {
  userId: string;
  initialOffset: number;
  pageSize: number;
  totalHint?: number;
}

export function LoadMore({ userId, initialOffset, pageSize }: LoadMoreProps) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [offset, setOffset] = useState(initialOffset);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/moments?userId=${userId}&limit=${pageSize}&offset=${offset}`);
      const data = await res.json();
      if (data.length < pageSize) setHasMore(false);
      if (data.length === 0) { setHasMore(false); setLoading(false); return; }
      setMoments(prev => [...prev, ...data]);
      setOffset(prev => prev + data.length);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {moments.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-5">
          {moments.map((moment) => (
            <MomentCard key={moment.datalineobject_id} moment={moment} />
          ))}
        </div>
      )}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3 rounded-xl text-sm font-medium text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Moments'
            )}
          </button>
        </div>
      )}
    </>
  );
}
