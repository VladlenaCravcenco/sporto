import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: 'noindex, nofollow',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-8">Page not found</p>
        <p className="text-gray-600 mb-12 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/ro"
          className="inline-block px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
