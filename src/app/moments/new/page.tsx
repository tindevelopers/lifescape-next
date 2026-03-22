import PostMomentForm from '@/components/moments/post-moment-form';

export default function NewMomentPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Post a Moment</h1>
      <PostMomentForm />
    </div>
  );
}
