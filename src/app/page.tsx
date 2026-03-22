import { getMomentsWithMediaByUser } from '@/lib/supabase'
import { MomentCard } from '@/components/moments/moment-card'
import { LoadMore } from '@/components/moments/load-more'
import { CURRENT_USER } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24;

export default async function WallPage() {
  const moments = await getMomentsWithMediaByUser(CURRENT_USER.user_id, PAGE_SIZE, 0)

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {CURRENT_USER.display_name}&apos;s Wall
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Showing latest moments
        </p>
      </header>

      {moments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-24">
          <p className="text-lg font-medium text-gray-400">No moments yet</p>
          <p className="mt-1 text-sm text-gray-400">Start capturing your life moments</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {moments.map((moment) => (
              <MomentCard key={moment.datalineobject_id} moment={moment} />
            ))}
          </div>
          <LoadMore
            userId={CURRENT_USER.user_id}
            initialOffset={PAGE_SIZE}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  )
}
