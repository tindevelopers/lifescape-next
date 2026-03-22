import { getMomentsWithMediaByUser, getThreadsByUser } from '@/lib/supabase';
import { CURRENT_USER } from '@/lib/auth';
import { MomentCard } from '@/components/moments/moment-card';
import { User, Camera, Hash } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const [moments, threads] = await Promise.all([
    getMomentsWithMediaByUser(CURRENT_USER.user_id, 30, 0),
    getThreadsByUser(CURRENT_USER.user_id),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {CURRENT_USER.display_name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{CURRENT_USER.display_name}</h1>
            <p className="text-gray-500 mt-1">Your life, your moments</p>
            <div className="flex items-center gap-6 mt-4 justify-center sm:justify-start">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Camera className="w-4 h-4 text-indigo-500" />
                <span><strong>{moments.length}</strong> moments</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hash className="w-4 h-4 text-indigo-500" />
                <span><strong>{threads.length}</strong> channels</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Moments Grid */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Moments</h2>
      </div>

      {moments.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No moments yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {moments.map((moment: any) => (
            <MomentCard key={moment.datalineobject_id} moment={moment} />
          ))}
        </div>
      )}
    </div>
  );
}
