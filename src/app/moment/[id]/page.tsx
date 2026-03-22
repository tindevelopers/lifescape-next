import { getMomentWithMedia, getCommentsForMoment } from '@/lib/supabase'
import { MomentDetail } from '@/components/moments/moment-detail'

export default async function MomentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const moment = await getMomentWithMedia(id)

  if (!moment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Moment not found
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            This moment may have been removed or does not exist.
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to Wall
          </a>
        </div>
      </main>
    )
  }

  const comments = await getCommentsForMoment(id)

  return (
    <main className="min-h-screen bg-gray-50/50">
      <MomentDetail moment={moment} comments={comments} />
    </main>
  )
}
