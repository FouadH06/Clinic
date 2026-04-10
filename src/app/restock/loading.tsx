import NavBar from '@/components/NavBar'

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
  )
}

export default function RestockLoading() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pt-[60px]">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 md:px-6">
        {/* Header */}
        <div className="mb-6">
          <Shimmer className="h-6 w-24 mb-2" />
          <Shimmer className="h-4 w-64" />
        </div>

        {/* Restock form area */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Shimmer className="h-10 w-48 rounded-lg" />
            <Shimmer className="h-10 w-48 rounded-lg" />
            <Shimmer className="h-10 w-32 rounded-lg" />
            <Shimmer className="h-10 w-20 rounded-lg" />
          </div>
          {/* Item rows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Shimmer className="h-8 w-40 rounded-lg" />
              <Shimmer className="h-8 w-16 rounded-lg" />
              <Shimmer className="h-8 w-20 rounded-lg" />
              <Shimmer className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Recent restocks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <Shimmer className="h-4 w-32 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center py-3 border-b border-slate-100 last:border-b-0">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-4 w-32" />
              <Shimmer className="h-4 w-12" />
              <Shimmer className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
