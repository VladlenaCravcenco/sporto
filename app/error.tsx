'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
        <p className="text-xl text-gray-700 mb-2">Something went wrong</p>
        <p className="text-gray-600 mb-12 max-w-md">
          An unexpected error occurred. Please try again or contact support.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded text-left">
            <p className="text-sm text-red-700 font-mono">{error.message}</p>
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/ro"
            className="inline-block px-8 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
