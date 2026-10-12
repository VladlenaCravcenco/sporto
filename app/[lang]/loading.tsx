export default function Loading() {
  return <div role="status" aria-label="Loading" className="mx-auto w-full max-w-[1920px] px-4 py-10 sm:px-6 lg:px-8">
    <div aria-hidden="true" className="animate-pulse space-y-6 motion-reduce:animate-none">
      <div className="h-8 w-60 rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-72 rounded bg-gray-100" />)}</div>
    </div>
  </div>;
}
