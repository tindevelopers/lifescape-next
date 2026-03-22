'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Link2,
  Unlink,
  Trash2,
  Plus,
  Search,
  Calendar,
  MapPin,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Image as ImageIcon,
  CheckSquare,
  Square,
} from 'lucide-react'

interface MomentData {
  datalineobject_id: string
  title: string
  posted_by: string
  date: string
  location: string
  description: string
}

interface MediaRow {
  media_id: string
  image_url: string
  url: string
  media_desc: string
  isCloudinary: boolean
  isWorking: boolean
}

interface StorageFile {
  name: string
  url: string
  date: string | null
  time: string | null
  variant: string | null
}

const STORAGE_PAGE_SIZE = 200

export default function MomentEditPage() {
  const params = useParams()
  const router = useRouter()
  const momentId = params.id as string

  const [moment, setMoment] = useState<MomentData | null>(null)
  const [media, setMedia] = useState<MediaRow[]>([])
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Storage browser state
  const [storageSearch, setStorageSearch] = useState('')
  const [storageDate, setStorageDate] = useState('')
  const [storagePage, setStoragePage] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [lightbox, setLightbox] = useState<string | null>(null)

  // Load data
  const loadData = useCallback(async () => {
    const res = await fetch(`/api/moment?id=${momentId}`)
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setMoment(data.moment)
    setMedia(data.media)
    setStorageFiles(data.storageFiles)
    setLoading(false)

    // Auto-set date filter to moment's date
    if (data.moment?.date) {
      setStorageDate(data.moment.date)
    }
  }, [momentId])

  useEffect(() => { loadData() }, [loadData])

  // Current media (linked images)
  const workingMedia = media.filter(m => m.isWorking)
  const deadMedia = media.filter(m => m.isCloudinary)

  // Available dates from storage
  const availableDates = useMemo(() => {
    const dates = new Set(storageFiles.map(f => f.date).filter(Boolean))
    return [...dates].sort() as string[]
  }, [storageFiles])

  // Filtered storage files
  const filteredStorage = useMemo(() => {
    // Exclude files already linked to THIS moment
    const linkedUrls = new Set(media.map(m => m.image_url))
    return storageFiles.filter(f => {
      if (linkedUrls.has(f.url)) return false
      if (storageSearch && !f.name.toLowerCase().includes(storageSearch.toLowerCase())) return false
      if (storageDate && f.date !== storageDate) return false
      return true
    })
  }, [storageFiles, media, storageSearch, storageDate])

  const storageTotalPages = Math.ceil(filteredStorage.length / STORAGE_PAGE_SIZE)
  const storagePageFiles = filteredStorage.slice(
    storagePage * STORAGE_PAGE_SIZE,
    (storagePage + 1) * STORAGE_PAGE_SIZE
  )

  useEffect(() => { setStoragePage(0) }, [storageSearch, storageDate])

  // Toggle file selection
  const toggleFile = (name: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // Select all on current page
  const selectAllPage = () => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      storagePageFiles.forEach(f => next.add(f.name))
      return next
    })
  }

  const deselectAll = () => setSelectedFiles(new Set())

  // Link selected files
  const linkSelected = async () => {
    if (selectedFiles.size === 0) return
    setSaving(true)
    const res = await fetch('/api/moment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'bulkLink',
        filenames: [...selectedFiles],
        momentId,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setSelectedFiles(new Set())
      await loadData() // refresh
    }
    setSaving(false)
  }

  // Unlink a media row
  const unlinkImage = async (mediaId: string) => {
    setSaving(true)
    const res = await fetch('/api/moment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlink', mediaId }),
    })
    if ((await res.json()).success) {
      setMedia(prev => prev.filter(m => m.media_id !== mediaId))
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
      </div>
    )
  }

  if (!moment) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">Moment not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push(`/moment/${momentId}`)}
            className="mb-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to moment
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit: {moment.title}</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            {moment.posted_by && <span>{moment.posted_by}</span>}
            {moment.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {moment.date}
              </span>
            )}
            {moment.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {moment.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT: Current images */}
        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-indigo-500" />
              Current Images ({workingMedia.length})
              {deadMedia.length > 0 && (
                <span className="text-xs text-amber-500 font-normal">
                  + {deadMedia.length} dead Cloudinary
                </span>
              )}
            </h2>

            {workingMedia.length === 0 && deadMedia.length === 0 ? (
              <div className="mt-4 flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-400">No images linked to this moment</p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {workingMedia.map(m => (
                  <div key={m.media_id} className="group relative rounded-lg overflow-hidden border-2 border-green-300">
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={m.url}
                        alt={m.media_desc || 'Image'}
                        className="h-full w-full object-cover cursor-pointer"
                        loading="lazy"
                        onClick={() => setLightbox(m.url)}
                      />
                    </div>
                    <button
                      onClick={() => unlinkImage(m.media_id)}
                      disabled={saving}
                      className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600 disabled:opacity-50"
                      title="Remove from moment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1 py-0.5">
                      <p className="truncate text-[9px] text-white">{m.image_url.split('/').pop()}</p>
                    </div>
                  </div>
                ))}
                {deadMedia.map(m => (
                  <div key={m.media_id} className="relative rounded-lg overflow-hidden border-2 border-red-200 opacity-50">
                    <div className="aspect-square bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                      <span className="text-[10px] text-red-400 text-center px-1">Dead Cloudinary</span>
                    </div>
                    <button
                      onClick={() => unlinkImage(m.media_id)}
                      disabled={saving}
                      className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                      title="Remove dead link"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Available storage photos */}
        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-500" />
                Add Photos from Storage
              </h2>
              {selectedFiles.size > 0 && (
                <button
                  onClick={linkSelected}
                  disabled={saving}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Link2 className="h-4 w-4" />
                  Link {selectedFiles.size} photo{selectedFiles.size !== 1 ? 's' : ''}
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={storageSearch}
                  onChange={e => setStorageSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <select
                value={storageDate}
                onChange={e => setStorageDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm"
              >
                <option value="">All dates</option>
                {availableDates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Selection controls */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span>{filteredStorage.length.toLocaleString()} available</span>
                <button onClick={selectAllPage} className="text-indigo-500 hover:text-indigo-700">
                  Select page
                </button>
                {selectedFiles.size > 0 && (
                  <button onClick={deselectAll} className="text-red-500 hover:text-red-700">
                    Clear ({selectedFiles.size})
                  </button>
                )}
              </div>
              {storageTotalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setStoragePage(p => Math.max(0, p - 1))}
                    disabled={storagePage === 0}
                    className="rounded border px-1.5 py-0.5 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <span>{storagePage + 1}/{storageTotalPages}</span>
                  <button
                    onClick={() => setStoragePage(p => Math.min(storageTotalPages - 1, p + 1))}
                    disabled={storagePage >= storageTotalPages - 1}
                    className="rounded border px-1.5 py-0.5 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Photo grid */}
            <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6 max-h-[600px] overflow-y-auto">
              {storagePageFiles.map(file => {
                const isSelected = selectedFiles.has(file.name)
                return (
                  <div
                    key={file.name}
                    onClick={() => toggleFile(file.name)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="10">404</text></svg>'
                        }}
                      />
                    </div>

                    {/* Checkbox overlay */}
                    <div className="absolute top-1 left-1">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-indigo-500 drop-shadow" />
                      ) : (
                        <Square className="h-5 w-5 text-white/70 drop-shadow opacity-0 group-hover:opacity-100" />
                      )}
                    </div>

                    {/* Zoom */}
                    <button
                      onClick={e => { e.stopPropagation(); setLightbox(file.url) }}
                      className="absolute bottom-1 right-1 rounded bg-black/40 p-0.5 text-white opacity-0 hover:opacity-100 transition"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>

                    {/* Date label */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/40 px-1">
                      <p className="truncate text-[8px] text-white">{file.date} {file.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredStorage.length === 0 && (
              <div className="mt-4 flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-400">
                  {storageDate ? `No photos on ${storageDate}` : 'No matching photos'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 rounded-full bg-white p-2 shadow-lg"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      )}
    </div>
  )
}
