'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Calendar,
  ExternalLink,
  ArrowLeft,
  Pencil,
} from 'lucide-react'
import type { Moment, Comment } from '@/types/index'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function formatCommentDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export function MomentDetail({
  moment,
  comments,
}: {
  moment: Moment
  comments: Comment[]
}) {
  const router = useRouter()
  const media = moment.mediadata ?? []
  const hasMedia = media.length > 0

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back + Edit buttons */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => router.push(`/moment/${moment.datalineobject_id}/edit`)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Images
        </button>
      </div>

      {/* Image carousel */}
      {hasMedia && (
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gray-100">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {media.map((item, idx) => (
                <div
                  key={item.media_id ?? idx}
                  className="relative min-w-0 flex-[0_0_100%]"
                >
                  <div className="aspect-[16/10] w-full bg-gray-100">
                    {item.media_type === 'video' ? (
                      <video
                        src={item.url}
                        controls
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.media_desc || moment.object_title || 'Media'}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                          target.parentElement!.style.background = 'linear-gradient(135deg, #818cf8, #a855f7)';
                          const span = document.createElement('span');
                          span.className = 'text-4xl font-bold text-white/30';
                          span.textContent = 'LS';
                          target.parentElement!.appendChild(span);
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next */}
          {media.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {media.map((_, idx) => (
                  <span
                    key={idx}
                    className={`block h-2 w-2 rounded-full transition-colors ${
                      idx === selectedIndex
                        ? 'bg-white'
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* No media placeholder */}
      {!hasMedia && (
        <div className="mb-6 flex aspect-[16/10] items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500">
          <span className="text-6xl font-bold text-white/20">LS</span>
        </div>
      )}

      {/* Details panel */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {moment.object_title || 'Untitled Moment'}
        </h1>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
          {moment.posted_by && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                {moment.posted_by.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-700">
                {moment.posted_by}
              </span>
            </div>
          )}
          {moment.start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(moment.start_date)}
            </span>
          )}
          {moment.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {moment.location}
            </span>
          )}
        </div>

        {/* Description */}
        {moment.object_desc && (
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-gray-600">
            {moment.object_desc}
          </p>
        )}

        {/* Link */}
        {moment.moment_link && (
          <a
            href={moment.moment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <ExternalLink className="h-4 w-4" />
            View link
          </a>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-4">
          <button className="flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-500">
            <Heart className="h-4 w-4" />
            {moment.like_counter ?? 0}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <MessageCircle className="h-4 w-4" />
            {moment.comments_counter ?? 0} comment
            {(moment.comments_counter ?? 0) !== 1 ? 's' : ''}
          </span>
          <button className="ml-auto flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Comments section */}
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">No comments yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {comments.map((comment, idx) => (
              <li
                key={comment.comment_id ?? idx}
                className="border-b border-gray-50 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
                    {(comment.posted_by ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {comment.posted_by ?? 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatCommentDate(comment.created_datetime)}
                  </span>
                </div>
                <p className="mt-1 pl-8 text-sm text-gray-600">
                  {comment.comment_text ?? ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
