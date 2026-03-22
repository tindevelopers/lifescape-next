'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Search,
  Filter,
  Link2,
  Unlink,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Calendar,
  User,
  Grid3X3,
  LayoutGrid,
  ZoomIn,
  Pencil,
  Eye,
} from 'lucide-react'

interface StorageFile {
  name: string
  url: string
  linked: boolean
  momentId: string | null
  momentTitle: string | null
  mediaId: string | null
  userId: string | null
  userName: string | null
  date: string | null
  time: string | null
  variant: string | null
  ext: string | null
}

interface MomentOption {
  datalineobject_id: string
  title: string
  date: string
}

const PAGE_SIZES = [60, 120, 240, 500, 1000]

export default function PhotoBrowserPage() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterLinked, setFilterLinked] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(240)
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null)
  const [linkingFile, setLinkingFile] = useState<string | null>(null)
  const [momentSearch, setMomentSearch] = useState('')
  const [linkingInProgress, setLinkingInProgress] = useState(false)
  const [gridSize, setGridSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [lightboxFile, setLightboxFile] = useState<StorageFile | null>(null)
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [userCounts, setUserCounts] = useState<Record<string, number>>({})
  const [userMoments, setUserMoments] = useState<Record<string, MomentOption[]>>({})

  // Load data
  useEffect(() => {
    fetch('/api/storage')
      .then(r => r.json())
      .then(data => {
        setFiles(data.files || [])
        setUserNames(data.userNames || {})
        setUserCounts(data.userCounts || {})
        setUserMoments(data.userMoments || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Derived data
  const userIds = useMemo(() => {
    const ids = new Set(files.map(f => f.userId).filter(Boolean))
    return [...ids].sort() as string[]
  }, [files])

  const dates = useMemo(() => {
    const d = new Set(files.map(f => f.date).filter(Boolean))
    return [...d].sort() as string[]
  }, [files])

  const filtered = useMemo(() => {
    return files.filter(f => {
      if (searchTerm && !f.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterUser !== 'all' && f.userId !== filterUser) return false
      if (filterLinked === 'linked' && !f.linked) return false
      if (filterLinked === 'orphan' && f.linked) return false
      if (filterDate && f.date !== filterDate) return false
      return true
    })
  }, [files, searchTerm, filterUser, filterLinked, filterDate])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const pageFiles = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const stats = useMemo(() => ({
    total: files.length,
    linked: files.filter(f => f.linked).length,
    orphan: files.filter(f => !f.linked).length,
    user39: files.filter(f => f.userId === 'user39').length,
  }), [files])

  // Reset page on filter change
  useEffect(() => { setPage(0) }, [searchTerm, filterUser, filterLinked, filterDate, pageSize])

  // Link file to moment
  const handleLink = useCallback(async (filename: string, momentId: string) => {
    setLinkingInProgress(true)
    const res = await fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'link', filename, momentId }),
    })
    const data = await res.json()
    if (data.success) {
      setFiles(prev => prev.map(f => f.name === filename ? { ...f, linked: true } : f))
      setLinkingFile(null)
    }
    setLinkingInProgress(false)
  }, [])

  // Get moments for the selected file's user (or filtered user)
  const relevantMoments = useMemo(() => {
    // If we have a selected file, use its userId to find that user's moments
    const selectedUserId = selectedFile?.userId || filterUser
    if (selectedUserId && selectedUserId !== 'all' && userMoments[selectedUserId]) {
      return userMoments[selectedUserId]
    }
    // Fallback: combine all user moments
    return Object.values(userMoments).flat()
  }, [selectedFile, filterUser, userMoments])

  const filteredMoments = useMemo(() => {
    if (!momentSearch) return relevantMoments.slice(0, 30)
    const q = momentSearch.toLowerCase()
    return relevantMoments.filter(m =>
      m.title.toLowerCase().includes(q) || m.date.includes(q)
    ).slice(0, 30)
  }, [relevantMoments, momentSearch])

  const gridClass = gridSize === 'sm'
    ? 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'
    : gridSize === 'lg'
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10'

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
        <span className="ml-4 text-gray-500">Loading {'>'}11,000 storage files...</span>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <ImageIcon className="h-7 w-7 text-indigo-500" />
          Photo Browser
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse all {stats.total.toLocaleString()} storage files.
          <span className="ml-2 inline-flex items-center gap-1 text-green-600">
            <Link2 className="h-3 w-3" /> {stats.linked.toLocaleString()} linked
          </span>
          <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
            <Unlink className="h-3 w-3" /> {stats.orphan.toLocaleString()} orphan
          </span>
        </p>
      </header>

      {/* Filters bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search filenames..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>

        {/* User filter */}
        <select
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
        >
          <option value="all">All users ({userIds.length})</option>
          {userIds.map(u => (
            <option key={u} value={u}>
              {userNames[u] ? `${userNames[u]}` : u} — {userCounts[u] || 0} photos
            </option>
          ))}
        </select>

        {/* Link status */}
        <select
          value={filterLinked}
          onChange={e => setFilterLinked(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          <option value="linked">Linked</option>
          <option value="orphan">Orphan</option>
        </select>

        {/* Date filter */}
        <select
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
        >
          <option value="">All dates ({dates.length})</option>
          {dates.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Page size */}
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
        >
          {PAGE_SIZES.map(s => (
            <option key={s} value={s}>{s} per page</option>
          ))}
        </select>

        {/* Grid size */}
        <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
          <button
            onClick={() => setGridSize('sm')}
            className={`rounded p-1.5 ${gridSize === 'sm' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setGridSize('md')}
            className={`rounded p-1.5 ${gridSize === 'md' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setGridSize('lg')}
            className={`rounded p-1.5 ${gridSize === 'lg' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results count + pagination */}
      <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
        <span>{filtered.length.toLocaleString()} files</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border px-2 py-1 disabled:opacity-30 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border px-2 py-1 disabled:opacity-30 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Photo grid */}
      <div className={`grid gap-1.5 ${gridClass}`}>
        {pageFiles.map(file => (
          <div
            key={file.name}
            className={`group relative overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
              file.linked
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-white hover:border-indigo-300'
            }`}
            onClick={() => setLightboxFile(file)}
          >
            <div className="relative aspect-square bg-gray-100">
              <img
                src={file.url}
                alt={file.name}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="12">404</text></svg>'
                }}
              />

              {/* Status badge */}
              <div className={`absolute top-1 right-1 rounded-full p-0.5 ${
                file.linked ? 'bg-green-500' : 'bg-amber-400'
              }`}>
                {file.linked ? (
                  <Link2 className="h-2.5 w-2.5 text-white" />
                ) : (
                  <Unlink className="h-2.5 w-2.5 text-white" />
                )}
              </div>

              {/* Moment title overlay for linked files */}
              {file.linked && file.momentTitle && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition">
                  <p className="truncate text-[9px] text-white">{file.momentTitle}</p>
                </div>
              )}
            </div>

            {/* Info (medium/large only) */}
            {gridSize !== 'sm' && (
              <div className="px-1.5 py-1">
                <p className="truncate text-[10px] text-gray-500">{file.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  {file.date && <span>{file.date}</span>}
                  {file.userName && file.userName !== file.userId ? (
                    <span className="text-gray-600 font-medium">{file.userName}</span>
                  ) : file.userId && (
                    <span>{file.userId}</span>
                  )}
                  {file.variant && <span className="text-indigo-400">{file.variant}</span>}
                </div>
                {file.linked && file.momentTitle && (
                  <p className="truncate text-[10px] text-green-600 mt-0.5">→ {file.momentTitle}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="flex items-center px-3 text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Selected file detail panel */}
      {selectedFile && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-[1600px] mx-auto p-4">
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <img
                src={selectedFile.url}
                alt={selectedFile.name}
                className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 truncate">{selectedFile.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    selectedFile.linked
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedFile.linked ? 'Linked' : 'Orphan'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  {(selectedFile.userName || selectedFile.userId) && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {selectedFile.userName && selectedFile.userName !== selectedFile.userId
                        ? selectedFile.userName
                        : selectedFile.userId}
                      {selectedFile.userId && relevantMoments.length > 0 && (
                        <span className="text-xs text-indigo-500">({relevantMoments.length} moments)</span>
                      )}
                    </span>
                  )}
                  {selectedFile.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {selectedFile.date}
                    </span>
                  )}
                  {selectedFile.time && <span>{selectedFile.time}</span>}
                  {selectedFile.variant && (
                    <span className="text-indigo-500">{selectedFile.variant}</span>
                  )}
                </div>

                {/* Link action */}
                {!selectedFile.linked && linkingFile !== selectedFile.name && (
                  <button
                    onClick={() => setLinkingFile(selectedFile.name)}
                    className="mt-2 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 transition"
                  >
                    <Link2 className="inline h-3.5 w-3.5 mr-1" />
                    Link to Moment
                  </button>
                )}

                {/* Moment selector */}
                {linkingFile === selectedFile.name && (
                  <div className="mt-2 max-w-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search moments by title or date..."
                        value={momentSearch}
                        onChange={e => setMomentSearch(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => setLinkingFile(null)}
                        className="rounded-lg border px-2 py-1.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {filteredMoments.map(m => (
                        <li key={m.datalineobject_id}>
                          <button
                            onClick={() => handleLink(selectedFile.name, m.datalineobject_id)}
                            disabled={linkingInProgress}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50 transition disabled:opacity-50"
                          >
                            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              m.hasImages ? 'bg-green-400' : 'bg-amber-400'
                            }`} />
                            <span className="truncate flex-1">{m.title}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{m.date}</span>
                          </button>
                        </li>
                      ))}
                      {filteredMoments.length === 0 && (
                        <li className="px-3 py-3 text-sm text-gray-400 text-center">No moments found</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                onClick={() => { setSelectedFile(null); setLinkingFile(null); }}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-resolution lightbox with moment info */}
      {lightboxFile && (
        <div
          className="fixed inset-0 z-50 flex bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxFile(null)}
        >
          {/* Image area */}
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxFile.url}
              alt={lightboxFile.name}
              className="max-h-[92vh] max-w-full object-contain rounded"
              onClick={() => setLightboxFile(null)}
            />
          </div>

          {/* Side panel */}
          <div
            className="w-80 flex-shrink-0 bg-gray-900 border-l border-gray-700 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4">
              {/* Close button */}
              <button
                onClick={() => setLightboxFile(null)}
                className="mb-4 rounded-lg bg-gray-800 p-1.5 text-gray-400 hover:text-white transition float-right"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-sm font-semibold text-white break-all pr-8">{lightboxFile.name}</h3>

              {/* Metadata */}
              <div className="mt-3 space-y-2 text-sm">
                {lightboxFile.date && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {lightboxFile.date} {lightboxFile.time}
                  </div>
                )}
                {(lightboxFile.userName || lightboxFile.userId) && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>
                      {lightboxFile.userName && lightboxFile.userName !== lightboxFile.userId
                        ? <><span className="text-white font-medium">{lightboxFile.userName}</span> <span className="text-gray-500 text-xs">({lightboxFile.userId})</span></>
                        : lightboxFile.userId
                      }
                    </span>
                  </div>
                )}
                {lightboxFile.variant && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    {lightboxFile.variant} · {lightboxFile.ext}
                  </div>
                )}
              </div>

              {/* Link status */}
              <div className="mt-4 rounded-lg bg-gray-800 p-3">
                {lightboxFile.linked ? (
                  <>
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <Link2 className="h-4 w-4" /> Linked to moment
                    </div>
                    {lightboxFile.momentTitle && (
                      <p className="mt-1 text-sm text-gray-300">{lightboxFile.momentTitle}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {lightboxFile.momentId && (
                        <>
                          <a
                            href={`/moment/${lightboxFile.momentId}`}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition"
                          >
                            <Eye className="h-3 w-3" /> View
                          </a>
                          <a
                            href={`/moment/${lightboxFile.momentId}/edit`}
                            className="flex items-center gap-1 rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-600 transition"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </a>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                      <Unlink className="h-4 w-4" /> Orphan — not linked
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(lightboxFile)
                        setLinkingFile(lightboxFile.name)
                        setLightboxFile(null)
                      }}
                      className="mt-2 flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition"
                    >
                      <Link2 className="h-3 w-3" /> Link to Moment
                    </button>
                  </>
                )}
              </div>

              {/* Full URL for debugging */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Storage URL</p>
                <input
                  readOnly
                  value={lightboxFile.url}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-2 py-1 text-[10px] text-gray-400 select-all"
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
              </div>

              {/* Navigate prev/next in filtered list */}
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => {
                    const idx = filtered.findIndex(f => f.name === lightboxFile.name)
                    if (idx > 0) setLightboxFile(filtered[idx - 1])
                  }}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => {
                    const idx = filtered.findIndex(f => f.name === lightboxFile.name)
                    if (idx < filtered.length - 1) setLightboxFile(filtered[idx + 1])
                  }}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
