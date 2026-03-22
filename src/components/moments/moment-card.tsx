'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, MapPin, Calendar } from 'lucide-react'
import type { Moment } from '@/types/index'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d)
  } catch {
    return ''
  }
}

export function MomentCard({ moment }: { moment: Moment }) {
  const router = useRouter()
  const [imgError, setImgError] = useState(false)

  const thumbnail =
    moment.mediadata && moment.mediadata.length > 0 && !imgError
      ? moment.mediadata[0].url
      : null

  return (
    <article
      onClick={() => router.push(`/moment/${moment.datalineobject_id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border border-gray-100"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={moment.object_title || 'Moment'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500">
            <span className="text-4xl font-bold text-white/30">LS</span>
          </div>
        )}

        {/* Title overlay */}
        {moment.object_title && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-3 pt-10">
            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-white">
              {moment.object_title}
            </h2>
          </div>
        )}

        {/* Media count badge */}
        {(moment.media_count ?? moment.mediadata?.length ?? 0) > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {moment.media_count ?? moment.mediadata?.length} photos
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {moment.posted_by && (
            <span className="font-medium text-gray-700">
              {moment.posted_by}
            </span>
          )}
          {moment.start_date && formatDate(moment.start_date) && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(moment.start_date)}
            </span>
          )}
          {moment.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{moment.location}</span>
            </span>
          )}
        </div>

        {/* Counters */}
        <div className="mt-2 flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {moment.like_counter ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {moment.comments_counter ?? 0}
          </span>
        </div>
      </div>
    </article>
  )
}
